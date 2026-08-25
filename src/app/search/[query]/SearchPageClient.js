// app/search/[query]/SearchPageClient.js
'use client'

import { useState, useEffect, useCallback } from "react"
import AnimationWrapper from "@/lib/page-animation"
import InPageNavigation from "@/components/inpage-navigation.component"
import Loader from "@/components/loader.component"
import NoDataMessage from "@/components/nodata.component"
import BlogPostCard from "@/components/blog-post.component"
import LoadMoreDataBtn from "@/components/load-more.component"
import UserCard from "@/components/usercard.component"

export default function SearchPageClient({ query, initialBlogs, initialUsers }) {
  const [blogs, setBlogs] = useState(initialBlogs || null)
  const [users, setUsers] = useState(initialUsers || null)
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false)

  // Only re-fetch when query changes (not on first load — we have server data)
  useEffect(() => {
    if (!query) return

    setBlogs(null)
    setUsers(null)

    Promise.all([
      searchBlogs({ page: 1 }),
      fetchUsers()
    ])
  }, [query])

  const searchBlogs = useCallback(async ({ page = 1 } = {}) => {
    setIsLoadingBlogs(true)
    try {
      const [blogsRes, countRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/search-blogs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, page }),
        }),
        page === 1
          ? fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/search-blogs-count`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query }),
            })
          : Promise.resolve(null)
      ])

      const { blogs: fetchedBlogs } = await blogsRes.json()
      const totalDocs = page === 1 
        ? (await countRes.json()).totalDocs 
        : blogs?.totalDocs || 0

      setBlogs(prev => ({
        results: page === 1 
          ? fetchedBlogs || [] 
          : [...(prev?.results || []), ...(fetchedBlogs || [])],
        page,
        totalDocs,
      }))
    } catch (err) {
      console.error('Error searching blogs:', err)
      setBlogs({ results: [], totalDocs: 0, page: 1 })
    } finally {
      setIsLoadingBlogs(false)
    }
  }, [query, blogs?.totalDocs])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/search-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const { users: fetchedUsers } = await res.json()
      setUsers(fetchedUsers || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setUsers([])
    }
  }, [query])

  if (!query) {
    return (
      <section className="h-cover flex justify-center items-center">
        <NoDataMessage message="Enter a search query" />
      </section>
    )
  }

  const UserCardList = () => {
    if (users === null) return <Loader />
    if (!users.length) return <NoDataMessage message="No users found" />
    return users.map((user, i) => (
      <AnimationWrapper key={user._id || i} transition={{ duration: 0.6, delay: i * 0.05 }}>
        <UserCard user={user} />
      </AnimationWrapper>
    ))
  }

  const BlogList = () => {
    if (blogs === null) return <Loader />
    if (!blogs.results.length) return <NoDataMessage message="No blogs found" />
    return (
      <>
        {blogs.results.map((blog, i) => (
          <AnimationWrapper key={blog.blog_id || i} transition={{ duration: 0.6, delay: i * 0.05 }}>
            <BlogPostCard content={blog} author={blog.author.personal_info} />
          </AnimationWrapper>
        ))}
        <LoadMoreDataBtn
          state={blogs}
          fetchDataFun={searchBlogs}
          disabled={isLoadingBlogs}
        />
      </>
    )
  }

  return (
    <section className="h-cover flex justify-center gap-10 px-4 md:px-0">
      <div className="w-full max-w-4xl">
        <InPageNavigation
          routes={[`Search Results for "${query}"`, "Accounts Matched"]}
          defaultHidden={["Accounts Matched"]}
        >
          <BlogList />
          <UserCardList />
        </InPageNavigation>
      </div>

      {/* Sidebar for desktop */}
      <aside className="min-w-[40%] lg:min-w-[350px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
        <h2 className="font-medium text-xl mb-8 flex items-center gap-2">
          Users related to search
          <i className="fi fi-rr-user"></i>
        </h2>
        <UserCardList />
      </aside>
    </section>
  )
}