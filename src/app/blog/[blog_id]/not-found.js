// app/blog/[blog_id]/not-found.js

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">
          Blog Not Found
        </h2>
        <p className="text-gray-500 mb-8">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  )
}