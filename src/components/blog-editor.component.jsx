"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import AnimationWrapper from "@/lib/page-animation";
import { uploadImage } from "@/lib/aws";
import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "@/lib/editor-context";
import axios from "axios";
import { ThemeContext, UserContext } from "@/components/Providers";

const getSafeEditorData = (content) => {
  if (!content) return null;
  const data = Array.isArray(content) ? content[0] : content;
  if (!data || !Array.isArray(data.blocks) || data.blocks.length === 0)
    return null;
  return data;
};

const BlogEditor = () => {
  const {
    blog: { title, banner, content, tags, des },
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState,
  } = useContext(EditorContext);

  const {
    userAuth: { access_token },
  } = useContext(UserContext);

  const { theme } = useContext(ThemeContext);
  const { blog_id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);

  const editorInstance = useRef(null);
  const editorReady = useRef(false);
  const titleTextareaRef = useRef(null);
  const editorHolderRef = useRef(null);
  const runTokenRef = useRef(0);

  useEffect(() => {
    runTokenRef.current += 1;
    const myToken = runTokenRef.current;
    editorReady.current = false;

    const init = async () => {
      if (runTokenRef.current !== myToken) return;

      const holder = editorHolderRef.current;
      if (!holder) return;
      holder.innerHTML = "";

      let editor;
      try {
        const [
          { default: EditorJS },
          { default: Header },
          { default: List },
          { default: ImageTool },
          { default: Quote },
          { default: Marker },
          { default: InlineCode },
          { default: Embed },
          { default: Code },
        ] = await Promise.all([
          import("@editorjs/editorjs"),
          import("@editorjs/header"),
          import("@editorjs/list"),
          import("@editorjs/image"),
          import("@editorjs/quote"),
          import("@editorjs/marker"),
          import("@editorjs/inline-code"),
          import("@editorjs/embed"),
          import("@editorjs/code"),
        ]);

        if (runTokenRef.current !== myToken) return;

        const safeData = getSafeEditorData(content);

        editor = new EditorJS({
          holder: editorHolderRef.current,
          tools: {
            header: {
              class: Header,
              config: {
                placeholder: "Type Heading...",
                levels: [2, 3],
                defaultLevel: 2,
              },
            },
            list: { class: List, inlineToolbar: true },
            image: {
              class: ImageTool,
              config: {
                uploader: {
                  uploadByFile: async (file) => {
                    // 🔧 FIX: trim the returned URL so inline blog-body images
                    // never carry stray whitespace into storage (mirrors the
                    // same fix applied to the banner upload below).
                    const rawUrl = await uploadImage(file);
                    const url = typeof rawUrl === "string" ? rawUrl.trim() : rawUrl;
                    return { success: 1, file: { url } };
                  },
                },
              },
            },
            quote: {
              class: Quote,
              inlineToolbar: true,
              config: {
                quotePlaceholder: "Enter a quote",
                captionPlaceholder: "Quote's author",
              },
            },
            marker: { class: Marker, shortcut: "CTRL+SHIFT+M" },
            inlineCode: { class: InlineCode, shortcut: "CTRL+SHIFT+C" },
            embed: { class: Embed, inlineToolbar: true },
            code: { class: Code },
          },
          placeholder: "Let's write an awesome story",
          minHeight: 300,

          // ✅ THE FIX: Only attach the 'data' property if there is existing content
          ...(safeData ? { data: safeData } : {}),

          onReady: () => {
            if (runTokenRef.current === myToken) {
              editorReady.current = true;
            }
          },
        });

        await editor.isReady;

        if (runTokenRef.current !== myToken) {
          try {
            editor.destroy();
          } catch (e) {}
          if (editorInstance.current === editor) {
            editorInstance.current = null;
          }
          editorReady.current = false;
          return;
        }

        editorInstance.current = editor;
        setTextEditor(editor);
      } catch (err) {
        if (runTokenRef.current !== myToken) return;
        console.error("EditorJS init failed:", err);
        toast.error("Failed to load editor. Please refresh.");
      }
    };

    const id = setTimeout(init, 0);

    return () => {
      runTokenRef.current += 1;
      editorReady.current = false;
      clearTimeout(id);

      if (editorInstance.current) {
        try {
          editorInstance.current.destroy();
        } catch (e) {}
        editorInstance.current = null;
      }

      setTextEditor(null);

      if (editorHolderRef.current) {
        editorHolderRef.current.innerHTML = "";
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ta = titleTextareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [title]);

  const handleBannerUpload = useCallback(
    async (e) => {
      const img = e.target.files?.[0];
      if (!img) return;

      if (img.size > 5 * 1024 * 1024)
        return toast.error("Image size should be less than 5MB");

      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(img.type))
        return toast.error("Only PNG and JPEG images are allowed");

      setBannerLoading(true);
      const loadingToast = toast.loading("Uploading...");
      try {
        // 🔧 FIX: trim the returned URL before storing it. Prevents trailing/
        // leading whitespace (introduced upstream by the /get-upload-url
        // backend) from breaking next/image optimization later.
        const rawUrl = await uploadImage(img);
        const url = typeof rawUrl === "string" ? rawUrl.trim() : rawUrl;
        if (url) {
          setBlog((prev) => ({ ...prev, banner: url }));
          toast.dismiss(loadingToast);
          toast.success("Uploaded");
        }
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error(err.message || "Failed to upload banner");
      } finally {
        setBannerLoading(false);
      }
    },
    [setBlog],
  );

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === "Enter") e.preventDefault();
  }, []);

  const handleTitleChange = useCallback(
    (e) => {
      const input = e.target;
      input.style.height = "auto";
      input.style.height = input.scrollHeight + "px";
      setBlog((prev) => ({ ...prev, title: input.value }));
    },
    [setBlog],
  );

  const handlePublishEvent = useCallback(async () => {
    if (!banner?.length) return toast.error("Upload a blog banner to publish it");
    if (!title?.trim().length) return toast.error("Write blog title to publish it");
    if (!textEditor?.save) return toast.error("Editor not ready");

    try {
      const data = await textEditor.save();
      if (data.blocks?.length) {
        setBlog((prev) => ({ ...prev, content: data }));
        setEditorState("publish");
      } else {
        toast.error("Write something in your blog to publish it");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save editor content");
    }
  }, [banner, title, textEditor, setBlog, setEditorState]);

  const handleSaveDraft = useCallback(async () => {
    if (loading) return;
    if (!title?.trim().length)
      return toast.error("Write a blog title before saving it as a draft");
    if (!textEditor?.save) return toast.error("Editor not ready");

    const loadingToast = toast.loading("Saving Draft...");
    setLoading(true);
    try {
      const editorData = await textEditor.save();
      const blogObj = {
        title: title.trim(),
        banner: banner || "",
        des: des || "",
        tags: tags || [],
        content: editorData,
        draft: true,
      };
      if (blog_id) blogObj.id = blog_id;

      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/create-blog`,
        blogObj,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      toast.dismiss(loadingToast);
      toast.success(blog_id ? "Draft updated" : "Draft saved");
      setTimeout(() => {
        router.push("/dashboard/blogs?tab=draft");
        router.refresh();
      }, 500);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.error || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  }, [loading, title, banner, des, tags, textEditor, blog_id, access_token, router]);

  // 🔧 FIX: the app was migrated from a two-file theme-based logo
  // (logo-dark.png / logo-light.png) to a single logo file, matching
  // the main Navbar (which now uses "/imgs/logo.png" directly). This
  // component still referenced the old, now-deleted files, causing a
  // 404 and a missing logo on the Write page. Updated to match.
  const logoSrc = "/imgs/logo.png";

  return (
    <>
      <nav className="navbar z-50 sticky top-0">
        <Link href="/" className="flex-none w-10 h-10 relative">
          <Image
            src={logoSrc}
            alt="TradingSyntax Logo"
            fill
            sizes="40px"
            className="object-contain"
            priority
          />
        </Link>

        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title?.trim().length ? title : "New Blog"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button
            className="btn-dark py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePublishEvent}
            disabled={loading || bannerLoading}
          >
            Publish
          </button>
          <button
            className="btn-light py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSaveDraft}
            disabled={loading || bannerLoading}
          >
            {loading ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </nav>

      <Toaster position="top-center" />

      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full px-4">

            <div
              className="relative aspect-video border border-dashed transition-all duration-200 rounded-lg overflow-hidden"
              style={{ borderColor: "var(--color-border-strong)" }}
            >
              <label
                htmlFor="uploadBanner"
                className={`block cursor-pointer h-full w-full ${bannerLoading ? "pointer-events-none" : ""}`}
              >
                <div className="relative w-full h-full">
                  {banner ? (
                    <Image
                      src={banner}
                      alt="Blog banner"
                      fill
                      sizes="(max-width: 900px) 100vw, 900px"
                      className="object-cover"
                      quality={90}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-3"
                      style={{ background: "var(--color-surface-2)" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "var(--color-text-faint)" }}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span
                        className="byline"
                        style={{ color: "var(--color-text-faint)" }}
                      >
                        Click to upload banner image
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-faint)",
                          opacity: 0.6,
                        }}
                      >
                        PNG or JPEG - max 5 MB
                      </span>
                    </div>
                  )}

                  {bannerLoading && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
                    </div>
                  )}
                </div>

                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  hidden
                  onChange={handleBannerUpload}
                  disabled={bannerLoading}
                />
              </label>
            </div>

            <textarea
              ref={titleTextareaRef}
              defaultValue={title}
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 bg-transparent"
              style={{ color: "var(--color-text)" }}
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
              maxLength={200}
              aria-label="Blog title"
            />

            <hr className="w-full my-6" style={{ borderColor: "var(--color-border-strong)", opacity: 0.5 }} />

            {/* ✅ THE FIX: Removed the custom onClick handler that was intercepting EditorJS clicks */}
            <div className="relative pb-64 cursor-text">
              <div ref={editorHolderRef} id="textEditor" className="min-h-[300px]" />
            </div>

          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

BlogEditor.displayName = "BlogEditor";

export default React.memo(BlogEditor);