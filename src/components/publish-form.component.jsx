'use client'

import { useContext, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "@/lib/editor-context";
import Tag from "./tags.component";
import axios from "axios";
import { UserContext } from "@/components/Providers";
import { useRouter } from "next/navigation";
import imageCompression from 'browser-image-compression';
import { uploadImage } from '@/lib/aws';

const AnimationWrapper = dynamic(() => import("@/lib/page-animation"), {
    loading: () => <div className="w-screen min-h-screen bg-white animate-pulse" />,
    ssr: false
});

const PublishForm = () => {
    const characterLimit = 200;
    const tagLimit = 10;

    const router = useRouter();

    const {
        blog,
        blog: { banner, title, tags, des, content },
        setEditorState,
        setBlog,
        textEditor,
        blog_id,
    } = useContext(EditorContext);

    const {
        userAuth: { access_token },
    } = useContext(UserContext);

    const [loading, setLoading] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    const handleCloseEvent = useCallback(() => {
        setEditorState("editor");
    }, [setEditorState]);

    const handleBlogTitleChange = useCallback((e) => {
        setBlog(prev => ({ ...prev, title: e.target.value }));
    }, [setBlog]);

    const handleBlogDescription = useCallback((e) => {
        setBlog(prev => ({ ...prev, des: e.target.value }));
    }, [setBlog]);

    const handleTitleKeyDown = useCallback((e) => {
        if (e.key === "Enter") e.preventDefault();
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const tag = e.target.value.trim().toLowerCase();

            if (!tag) return;

            if (tag.length < 2) {
                toast.error("Tag must be at least 2 characters long");
                return;
            }

            if (tag.length > 30) {
                toast.error("Tag must be less than 30 characters");
                return;
            }

            if (tags.length < tagLimit) {
                if (!tags.includes(tag)) {
                    setBlog(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                    e.target.value = "";
                } else {
                    toast.error("Tag already added");
                }
            } else {
                toast.error(`You can add max ${tagLimit} tags`);
            }
        }
    }, [tags, setBlog]);

    const handleBannerUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be less than 10MB");
            return;
        }

        try {
            setUploadingBanner(true);
            const previewUrl = URL.createObjectURL(file);
            setBlog(prev => ({ ...prev, banner: previewUrl }));

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                initialQuality: 0.8,
            };

            const compressedFile = await imageCompression(file, options);
            const uploadedUrl = await uploadImage(compressedFile);

            setBlog(prev => ({ ...prev, banner: uploadedUrl }));
            URL.revokeObjectURL(previewUrl);
            toast.success("Banner uploaded successfully ✅");
        } catch (error) {
            toast.error("Banner upload failed ❌");
            console.error('Banner upload error:', error);
            setBlog(prev => ({ ...prev, banner: '' }));
        } finally {
            setUploadingBanner(false);
        }
    }, [setBlog]);

    const publishBlog = useCallback(async () => {
        if (loading) return;

        const trimmedTitle = title.trim();
        const trimmedDes = des.trim();

        if (!trimmedTitle) return toast.error("Write a blog title before publishing");
        if (trimmedTitle.length < 3) return toast.error("Title must be at least 3 characters long");
        if (!trimmedDes) return toast.error("Write a blog description before publishing");
        if (trimmedDes.length > characterLimit) return toast.error(`Description must be ${characterLimit} characters or less`);
        if (!tags.length) return toast.error("Enter at least 1 tag to help us rank your blog");
        if (!banner) return toast.error("Upload a blog banner before publishing");

        let latestContent = content;
        if (textEditor?.isReady) {
            try {
                const savedData = await textEditor.save();
                if (!savedData?.blocks?.length) {
                    return toast.error("Write some content before publishing");
                }
                latestContent = savedData;
            } catch (err) {
                console.error("EditorJS save error:", err);
                return toast.error("Failed to save content. Please try again.");
            }
        } else {
            if (!content?.blocks?.length) {
                return toast.error("Write some content before publishing");
            }
        }

        const loadingToast = toast.loading("Publishing...");
        setLoading(true);

        try {
            const blogObj = {
                title: trimmedTitle,
                banner,
                des: trimmedDes,
                tags,
                content: latestContent,
                draft: false,
            };

            // ✅ FIX: Only include `id` when editing an existing blog.
            // For new blogs, blog_id is undefined/null — never send it,
            // otherwise the backend treats this as an edit and throws
            // "blog does not exist / no permission to edit".
            const payload = blog_id ? { ...blogObj, id: blog_id } : blogObj;

            await axios.post(
                `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/create-blog`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            // Purge Next.js cache so edits show immediately
            try {
                await fetch('/api/revalidate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        blog_id,
                        secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET,
                    }),
                });
            } catch (revalErr) {
                // Non-fatal — page will revalidate within 30s via ISR
                console.warn('Revalidation failed:', revalErr);
            }

            toast.dismiss(loadingToast);
            toast.success("Published ✅");

            setTimeout(() => {
                router.push("/dashboard/blogs");
                router.refresh();
            }, 500);

        } catch (err) {
            toast.dismiss(loadingToast);
            console.error('Publish error:', err);
            if (err.code === 'ECONNABORTED') {
                toast.error("Request timed out. Please try again.");
            } else if (err.response?.status === 401) {
                toast.error("Session expired. Please log in again.");
            } else if (err.response?.status === 403) {
                toast.error("You don't have permission to perform this action.");
            } else if (err.response?.status === 404) {
                toast.error("Blog not found. It may have been deleted.");
            } else if (err.response?.status === 413) {
                toast.error("Blog content is too large. Please reduce image sizes.");
            } else {
                toast.error(err.response?.data?.error || "Failed to publish. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, [loading, title, des, characterLimit, tags, banner, content, textEditor, blog_id, access_token, router]);

    const remainingChars = useMemo(() => characterLimit - des.length, [des.length, characterLimit]);

    const canPublish = useMemo(() => {
        return !loading &&
            title.trim().length >= 3 &&
            des.trim().length > 0 &&
            des.trim().length <= characterLimit &&
            tags.length > 0 &&
            banner &&
            !uploadingBanner;
    }, [loading, title, des, characterLimit, tags.length, banner, uploadingBanner]);

    return (
        <AnimationWrapper>
            <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
                <Toaster />

                <button
                    className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%] hover:rotate-90 transition-transform duration-300"
                    onClick={handleCloseEvent}
                    aria-label="Close publish form"
                    type="button"
                >
                    <i className="fi fi-br-cross" aria-hidden="true"></i>
                </button>

                <div className="max-w-[550px] center">
                    <p className="text-dark-grey mb-1 font-medium">Preview</p>

                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4 relative flex items-center justify-center">
                        {banner ? (
                            banner.startsWith('blob:') ? (
                                <img
                                    src={banner}
                                    alt="Blog banner preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Image
                                    src={banner}
                                    alt="Blog banner preview"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 550px"
                                    priority
                                    quality={90}
                                />
                            )
                        ) : (
                            <div className="text-center p-4">
                                <i className="fi fi-rr-picture text-4xl text-dark-grey/50 mb-2"></i>
                                <p className="text-dark-grey text-sm">No banner uploaded</p>
                            </div>
                        )}
                        {uploadingBanner && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                                    <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                                    <p className="text-sm font-medium">Uploading...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">
                        {title || "Untitled Blog"}
                    </h1>
                    <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4 text-dark-grey">
                        {des || "No description provided"}
                    </p>
                </div>

                <div className="px-4">
                    <label className="block text-dark-grey mb-2 font-medium">
                        Upload Blog Banner
                    </label>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleBannerUpload}
                        className="mb-6 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-black file:text-white file:cursor-pointer hover:file:bg-grey transition-colors"
                        disabled={uploadingBanner}
                        aria-label="Upload blog banner image"
                    />

                    <label htmlFor="blog-title" className="block text-dark-grey mb-2 font-medium">
                        Blog Title
                    </label>
                    <input
                        id="blog-title"
                        type="text"
                        placeholder="Enter your blog title..."
                        value={title}
                        className="input-box pl-4 w-full"
                        onChange={handleBlogTitleChange}
                        maxLength={100}
                        aria-required="true"
                    />

                    <label htmlFor="blog-description" className="block text-dark-grey mb-2 mt-9 font-medium">
                        Short description about your blog
                    </label>
                    <textarea
                        id="blog-description"
                        maxLength={characterLimit}
                        value={des}
                        className="h-40 resize-none leading-7 input-box pl-4 w-full"
                        onChange={handleBlogDescription}
                        onKeyDown={handleTitleKeyDown}
                        placeholder="Write a brief description of your blog..."
                        aria-required="true"
                        aria-describedby="char-count"
                    />
                    <p
                        id="char-count"
                        className={`mt-1 text-sm text-right transition-colors ${remainingChars < 20 ? 'text-red' : 'text-dark-grey'}`}
                        aria-live="polite"
                    >
                        {remainingChars} characters left
                    </p>

                    <label htmlFor="blog-tags" className="block text-dark-grey mb-2 mt-9 font-medium">
                        Topics (Press Enter or comma to add)
                    </label>
                    <div className="input-box pl-2 py-2 min-h-fit">
                        <input
                            id="blog-tags"
                            type="text"
                            placeholder="Add topics (e.g., technology, design)..."
                            className="w-full input-box bg-white pl-4 mb-3 focus:bg-white"
                            onKeyDown={handleKeyDown}
                            maxLength={30}
                            aria-label="Add blog topics"
                            aria-describedby="tag-count"
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, i) => <Tag tag={tag} tagIndex={i} key={i} />)}
                            </div>
                        )}
                    </div>
                    <p
                        id="tag-count"
                        className="mt-1 text-dark-grey text-sm"
                        aria-live="polite"
                    >
                        {tags.length}/{tagLimit} tags
                    </p>

                    <button
                        className={`btn-dark px-8 mt-10 transition-all duration-300 ${!canPublish ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
                        onClick={publishBlog}
                        disabled={!canPublish}
                        type="button"
                        aria-label="Publish blog"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Publishing...
                            </span>
                        ) : "Publish"}
                    </button>

                    {!canPublish && !loading && (
                        <div className="mt-4 text-sm text-dark-grey space-y-1">
                            <p className="font-medium">Required to publish:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {!title.trim() && <li>Blog title</li>}
                                {!des.trim() && <li>Blog description</li>}
                                {!tags.length && <li>At least one tag</li>}
                                {!banner && <li>Blog banner image</li>}
                            </ul>
                        </div>
                    )}
                </div>
            </section>
        </AnimationWrapper>
    );
};

export default PublishForm;