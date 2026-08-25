"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getDay } from "@/lib/date";

const BLOGS_PER_PAGE = 5;

const SimilarBlogItem = ({ blog }) => {
  const {
    title, banner, blog_id, publishedAt,
    author: { personal_info: { fullname, profile_img } },
  } = blog;

  return (
    <Link
      href={`/blog/${blog_id}`}
      className="flex gap-4 items-center py-4 border-b border-grey hover:opacity-80 transition-opacity"
      prefetch={false}
    >
      <div className="relative w-24 h-16 flex-shrink-0 rounded-md overflow-hidden bg-grey">
        <Image src={banner} alt={title} fill sizes="96px" className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className="!text-base font-semibold leading-snug line-clamp-2 mb-1"
          style={{ color: "var(--color-text, #0f0a06)" }}
        >
          {title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <div className="relative w-5 h-5 flex-shrink-0">
            <Image
              src={profile_img} alt={fullname} fill
              sizes="20px" quality={100}
              className="rounded-full object-cover"
            />
          </div>
          <span className="text-dark-grey text-sm truncate">{fullname}</span>
          <span className="text-dark-grey text-sm flex-shrink-0">· {getDay(publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
};

export default function SimilarBlogsList({ similarBlogs }) {
  const [visibleCount, setVisibleCount] = useState(BLOGS_PER_PAGE);

  const visibleBlogs = similarBlogs?.slice(0, visibleCount) || [];
  const hasMore = (similarBlogs?.length || 0) > visibleCount;

  if (!visibleBlogs.length) return null;

  return (
    <>
      <hr className="blog-section-rule" />
      <section aria-labelledby="similar-heading" className="blog-similar">
        <h2 id="similar-heading" className="blog-similar-heading">
          Continue Reading
        </h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {visibleBlogs.map((sBlog, i) => (
            <SimilarBlogItem key={sBlog._id || i} blog={sBlog} />
          ))}
        </div>
        {hasMore && (
          <div style={{ marginTop: "24px", display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => setVisibleCount(prev => prev + BLOGS_PER_PAGE)}
              className="btn-light px-10"
            >
              Load More
            </button>
          </div>
        )}
      </section>
    </>
  );
}