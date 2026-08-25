'use client';

import Link from 'next/link';

const MinimalBlogPost = ({ blog, index }) => {
  if (!blog) return null;
  const { title = 'Untitled Briefing', blog_id: id = '', author, tags = [] } = blog;
  const authorName = author?.personal_info?.fullname || 'Editorial Staff';

  return (
    <div className="ts_sidebar_trending_row">
      <span className="ts_sidebar_trending_index">{String(index + 1).padStart(2, '0')}</span>
      <div className="ts_sidebar_trending_body">
        <Link href={`/blog/${id}`} className="ts_sidebar_trending_link">
          {tags[0] && <span className="ts_sidebar_trending_tag">{tags[0]}</span>}
          <h4 className="ts_sidebar_trending_title">{title}</h4>
          <span className="ts_sidebar_trending_author">By {authorName}</span>
        </Link>
      </div>
    </div>
  );
};

export default MinimalBlogPost;