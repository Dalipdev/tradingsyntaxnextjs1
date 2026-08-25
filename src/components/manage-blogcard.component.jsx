'use client'

import Link from "next/link";
import Image from "next/image";
import { useContext, useState, useCallback, memo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { UserContext } from "@/components/Providers";
import { getDay } from "@/lib/date";

const BlogStats = memo(({ stats }) => {
  const entries = Object.keys(stats).filter((info) => !info.includes("parent"));

  return (
    <div className="flex max-lg:gap-2 max-lg:mb-6 max-lg:pb-6 border-grey max-lg:border-b lg:gap-0">
      {entries.map((info, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center max-lg:w-full max-lg:p-4 max-lg:px-6 lg:w-24"
        >
          <h2 className="text-xl lg:text-2xl mb-2 font-bold whitespace-nowrap">
            {stats[info].toLocaleString()}
          </h2>
          <p className="max-lg:text-dark-grey text-dark-grey capitalize text-sm whitespace-nowrap">
            {info.split("_")[1]}
          </p>
        </div>
      ))}
    </div>
  );
});

BlogStats.displayName = "BlogStats";

export const ManagePublishedBlogCard = memo(({ blog }) => {
  const { banner, blog_id, title, publishedAt, activity } = blog;
  const { userAuth: { access_token } } = useContext(UserContext);
  const [showStat, setShowStat] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async (e) => {
    e.preventDefault();

    const confirmed = window.confirm("Are you sure you want to delete this blog?");
    if (!confirmed) return;

    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting blog...");

    try {
      await deleteBlog(blog, access_token);
      toast.dismiss(loadingToast);
      toast.success("Blog deleted successfully");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err?.response?.data?.error || "Failed to delete blog");
    } finally {
      setIsDeleting(false);
    }
  }, [blog, access_token]);

  const toggleStats = useCallback(() => {
    setShowStat((prev) => !prev);
  }, []);

  return (
    <>
      <div className="flex gap-5 lg:gap-10 border-b mb-6 max-md:px-4 border-grey pb-6 items-center hover:bg-grey/10 transition-colors duration-200 rounded-lg p-4">
        <div className="hidden sm:block w-20 h-20 lg:w-28 lg:h-28 flex-none bg-grey relative overflow-hidden rounded-lg">
          <Image
            src={banner}
            alt={title}
            fill
            sizes="(max-width: 1024px) 80px, 112px"
            className="object-cover"
            quality={80}
          />
        </div>

        <div className="flex flex-col justify-between py-2 flex-1 min-w-0">
          <div>
            <Link
              href={`/blog/${blog_id}`}
              className="blog-title mb-4 hover:underline hover:text-purple transition-colors duration-200 line-clamp-2"
              prefetch={true}
            >
              {title}
            </Link>
            <time
              dateTime={publishedAt}
              className="line-clamp-1 text-dark-grey text-sm"
            >
              Published on {getDay(publishedAt)}
            </time>
          </div>

          <div className="flex gap-6 mt-3">
            <Link
              href={`/editor/${blog_id}`}
              className="pr-4 py-2 underline hover:text-purple transition-colors duration-200"
              prefetch={true}
            >
              Edit
            </Link>

            <button
              className="lg:hidden pr-4 py-2 underline hover:text-black transition-all duration-200 active:scale-95"
              onClick={toggleStats}
              aria-expanded={showStat}
              aria-label="Toggle statistics"
            >
              Stats
            </button>

            <button
              className="pr-4 py-2 text-red hover:bg-red/10 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete blog"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-red border-t-transparent rounded-full animate-spin"></span>
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>

        <div className="max-lg:hidden flex-none">
          <BlogStats stats={activity} />
        </div>
      </div>

      {showStat && (
        <div className="lg:hidden animate-fadeIn">
          <BlogStats stats={activity} />
        </div>
      )}
    </>
  );
});

ManagePublishedBlogCard.displayName = "ManagePublishedBlogCard";

export const ManageDraftBlogPost = memo(({ blog }) => {
  const { title, des, blog_id, index: blogIndex } = blog;
  const { userAuth: { access_token } } = useContext(UserContext);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayIndex = blogIndex + 1;

  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm("Are you sure you want to delete this draft?");
    if (!confirmed) return;

    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting draft...");

    try {
      await deleteBlog(blog, access_token);
      toast.dismiss(loadingToast);
      toast.success("Draft deleted successfully");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err?.response?.data?.error || "Failed to delete draft");
    } finally {
      setIsDeleting(false);
    }
  }, [blog, access_token]);

  return (
    <div className="flex gap-5 lg:gap-10 pb-6 border-b mb-6 border-grey hover:bg-grey/10 transition-colors duration-200 rounded-lg p-4">
      <h2 className="blog-index text-center pl-4 md:pl-6 flex-none font-bold text-dark-grey">
        {displayIndex < 10 ? "0" + displayIndex : displayIndex}
      </h2>

      <div className="flex-1 min-w-0 max-w-[720px]">
        <h3 className="blog-title mb-3 line-clamp-2">{title}</h3>
        <p className="line-clamp-2 font-gelasio text-dark-grey">
          {des?.length ? des : "No Description"}
        </p>

        <div className="flex gap-6 mt-3">
          <Link
            href={`/editor/${blog_id}`}
            className="pr-4 py-2 underline hover:text-purple transition-colors duration-200"
            prefetch={false}
          >
            Edit
          </Link>

          <button
            className="pr-4 py-2 text-red hover:bg-red/10 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete draft"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-red border-t-transparent rounded-full animate-spin"></span>
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

ManageDraftBlogPost.displayName = "ManageDraftBlogPost";

// ✅ Fixed: guard against null/undefined prevState, and filter by blog_id instead of index
const deleteBlog = async (blog, access_token) => {
  const { blog_id, setStateFun } = blog;

  const { data } = await axios.post(
    `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/delete-blog`,
    { blog_id },
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  setStateFun((prevState) => {
    // ✅ Guard: if state is null/undefined or results isn't an array, bail out safely
    if (!prevState || !Array.isArray(prevState.results)) {
      return prevState;
    }

    const { deletedDocCount, totalDocs, results } = prevState;

    // ✅ Filter by blog_id instead of array index — stable even after multiple deletions
    const newResults = results.filter((b) => b.blog_id !== blog_id);

    // If no results left but more docs exist on server, return null to trigger a reload
    if (!newResults.length && totalDocs - 1 > 0) {
      return null;
    }

    return {
      ...prevState,
      results: newResults,
      totalDocs: totalDocs - 1,
      deletedDocCount: (deletedDocCount ?? 0) + 1,
    };
  });

  return data;
};