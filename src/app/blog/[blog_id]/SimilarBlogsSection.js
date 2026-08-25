import { cache } from 'react'
import SimilarBlogsList from './Similarblogslist'

const SERVER = process.env.NEXT_PUBLIC_SERVER_DOMAIN;
const FETCH_TIMEOUT = 15000;

async function serverFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

const getSimilarBlogs = cache(async (tag, blog_id) => {
  if (!tag || !SERVER) return [];
  const data = await serverFetch(`${SERVER}/search-blogs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag, limit: 6, eliminate_blogs: blog_id }),
    next: { revalidate: 300 },
  });
  return data?.blogs || [];
});

// This component is only ever rendered inside a <Suspense> boundary
// (see page.js), so awaiting here does NOT block the rest of the page —
// React streams this section in whenever this promise resolves.
export default async function SimilarBlogsSection({ tag, blog_id }) {
  const similarBlogs = await getSimilarBlogs(tag, blog_id);
  if (!similarBlogs?.length) return null;
  return <SimilarBlogsList similarBlogs={similarBlogs} />;
}