// src/app/blog/[blog_id]/page.js
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import BlogPageClient from './BlogPageClient';
import BlogPostCard from '@/components/blog-post-card.component';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com';
const SERVER   = process.env.NEXT_PUBLIC_SERVER_DOMAIN;

async function getBlog(blog_id) {
  if (!SERVER) return null;
  try {
    const res = await fetchWithTimeout(
      `${SERVER}/get-blog`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blog_id }),
        next: { revalidate: 30 },
      },
      { timeout: 12000, fallback: null }
    );
    if (!res || !res.ok) return null;
    const data = await res.json();
    return data?.blog || null;
  } catch {
    return null;
  }
}

async function getSimilarBlogs(tag, currentBlogId) {
  if (!SERVER || !tag) return [];
  try {
    const res = await fetchWithTimeout(
      `${SERVER}/search-blogs`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, page: 1 }),
        next: { revalidate: 300 },
      },
      { timeout: 10000, fallback: null }
    );
    if (!res || !res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data?.blogs || data?.results || []);
    return list
      .filter((b) => (b.blog_id || b._id) !== currentBlogId)
      .slice(0, 4);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { blog_id } = await params;
  const blog = await getBlog(blog_id);

  if (!blog) {
    return { title: 'Article Not Found — TradingSyntax' };
  }

  const url         = `${SITE_URL}/blog/${blog_id}`;
  const description = blog.des || blog.description || '';

  return {
    title: `${blog.title} — TradingSyntax`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: blog.title,
      description,
      images: blog.banner ? [{ url: blog.banner, width: 1200, height: 630 }] : undefined,
      publishedTime: blog.publishedAt,
      authors: blog.author?.personal_info?.fullname
        ? [blog.author.personal_info.fullname]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description,
      images: blog.banner ? [blog.banner] : undefined,
    },
  };
}

function buildArticleSchema(blog, blog_id) {
  const url = `${SITE_URL}/blog/${blog_id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.des || '',
    url,
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    author: {
      '@type': 'Person',
      name: blog.author?.personal_info?.fullname || 'TradingSyntax Team',
      url: blog.author?.personal_info?.username
        ? `${SITE_URL}/user/${blog.author.personal_info.username}`
        : SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TradingSyntax',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    ...(blog.banner && {
      image: { '@type': 'ImageObject', url: blog.banner, width: 1200, height: 630 },
    }),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

// FIX: this async component fetches similar blogs on its own and is
// only ever rendered inside a <Suspense> boundary below. That means
// Next can send the rest of the page (the actual article, via
// BlogPageClient) to the browser as soon as `getBlog` resolves,
// WITHOUT waiting for this component's `getSimilarBlogs` call too.
// The "Related Coverage" section streams in and pops into place
// once it's ready, instead of holding up the whole page.
//
// Previously: total wait = getBlog time + getSimilarBlogs time (up to
// 12s + 10s = 22s), because BlogPage awaited both before returning
// anything.
// Now: visible wait = getBlog time only (up to 12s); similar blogs
// arrive in the background afterward, visitors are already reading
// the article by then.
async function SimilarBlogsSection({ tag, currentBlogId }) {
  const similarBlogs = await getSimilarBlogs(tag, currentBlogId);

  if (!similarBlogs.length) return null;

  return (
    <section className="blog-similar" aria-labelledby="similar-blogs-heading">
      <hr className="blog-section-rule" />
      <p id="similar-blogs-heading" className="blog-similar-heading" style={{ marginTop: 32 }}>
        Related Coverage
      </p>
      <div>
        {similarBlogs.map((b) => (
          <BlogPostCard
            key={b.blog_id || b._id}
            content={b}
            author={b.author?.personal_info}
          />
        ))}
      </div>
    </section>
  );
}

export default async function BlogPage({ params }) {
  const { blog_id } = await params;
  const blog = await getBlog(blog_id);

  if (!blog) notFound();

  const tag           = blog.tags?.[0];
  const articleSchema = buildArticleSchema(blog, blog_id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <BlogPageClient
        initialBlog={blog}
        blog_id={blog_id}
        similarBlogsSlot={
          // FIX: fallback is null (no visible placeholder) rather than a
          // spinner, since "Related Coverage" is a below-the-fold, non-
          // critical section — popping in silently once ready reads as
          // normal progressive loading, not as a glitch. Swap in a
          // skeleton here later if you'd rather show a loading state.
          <Suspense fallback={null}>
            <SimilarBlogsSection tag={tag} currentBlogId={blog_id} />
          </Suspense>
        }
      />
    </>
  );
}