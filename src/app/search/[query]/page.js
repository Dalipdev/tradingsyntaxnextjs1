// app/search/[query]/page.js

import { Suspense } from 'react'
import SearchPageClient from './SearchPageClient'
import Loader from '@/components/loader.component'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'

export async function generateMetadata({ params }) {
  const query = params.query ? decodeURIComponent(params.query) : ""
  return {
    title: `Search results for "${query}" | TradingSyntax`,
    description: `Find blogs and users related to ${query}.`,
    openGraph: {
      title: `Search: ${query}`,
      description: `Search results for "${query}"`,
      type: 'website',
    },
    robots: { index: true, follow: true },
  }
}

export default async function SearchPage({ params }) {
  const query = params.query ? decodeURIComponent(params.query) : ""
  const SERVER = process.env.NEXT_PUBLIC_SERVER_DOMAIN;

  if (!SERVER) {
    return (
      <Suspense fallback={<Loader />}>
        <SearchPageClient
          query={query}
          initialBlogs={{ results: [], page: 1, totalDocs: 0 }}
          initialUsers={[]}
        />
      </Suspense>
    );
  }

  const [blogsRes, usersRes, countRes] = await Promise.all([
    fetchWithTimeout(
      `${SERVER}/search-blogs`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, page: 1 }),
        next: { revalidate: 60 }
      },
      { timeout: 8000, fallback: { blogs: [] } }
    ),
    fetchWithTimeout(
      `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/search-users`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        next: { revalidate: 60 }
      },
      { timeout: 8000, fallback: { users: [] } }
    ),
    fetchWithTimeout(
      `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/search-blogs-count`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        next: { revalidate: 60 }
      },
      { timeout: 8000, fallback: { totalDocs: 0 } }
    ),
  ])

  const blogsData = await blogsRes.json()
  const usersData = await usersRes.json()
  const countData = await countRes.json()

  const initialBlogs = {
    results: blogsData?.blogs || [],
    page: 1,
    totalDocs: countData?.totalDocs || 0,
  }

  return (
    <Suspense fallback={<Loader />}>
      <SearchPageClient
        query={query}
        initialBlogs={initialBlogs}
        initialUsers={usersData?.users || []}
      />
    </Suspense>
  )
}