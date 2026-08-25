'use client'

import { useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { UserContext } from '@/components/Providers'
import { useRouter, useSearchParams } from 'next/navigation'
import AnimationWrapper from '@/lib/page-animation'
import Loader from '@/components/loader.component'
import NoDataMessage from '@/components/nodata.component'
import InPageNavigation from '@/components/inpage-navigation.component'
import { ManagePublishedBlogCard, ManageDraftBlogPost } from '@/components/manage-blogcard.component'
import LoadMoreDataBtn from '@/components/load-more.component'

const DashboardBlogsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { userAuth: { access_token } } = useContext(UserContext)

  const [publishedBlogs, setPublishedBlogs] = useState(null)
  const [draftBlogs, setDraftBlogs] = useState(null)
  const [pageState, setPageState] = useState(() =>
    searchParams.get('tab') === 'draft' ? 'draft' : 'published'
  )
  const [isLoading, setIsLoading] = useState(false)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    if (access_token === null) router.replace('/signin')
  }, [access_token, router])

  // ✅ Fetch total count separately (replaces filterPaginationData)
  const fetchCount = useCallback(async (draft) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/user-written-blogs-count`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({ draft }),
          cache: 'no-store',
        }
      )
      if (!res.ok) return 0
      const { totalDocs } = await res.json()
      return totalDocs ?? 0
    } catch {
      return 0
    }
  }, [access_token])

  const fetchBlogs = useCallback(async ({ page = 1, draft = false }) => {
    if (!access_token || isLoadingRef.current) return

    isLoadingRef.current = true
    setIsLoading(true)

    const setter = draft ? setDraftBlogs : setPublishedBlogs

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/user-written-blogs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({ page, draft }),
          cache: 'no-store',
        }
      )

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const { blogs: fetchedBlogs } = await res.json()

      // ✅ On page 1 fetch total count; on page > 1 just append — same as home page
      if (page === 1) {
        const totalDocs = await fetchCount(draft)
        setter({
          results: fetchedBlogs,
          page: 1,
          totalDocs,
        })
      } else {
        // ✅ Append to existing results — simple and reliable
        setter((prev) => {
          if (!prev || !Array.isArray(prev.results)) return prev
          return {
            ...prev,
            results: [...prev.results, ...fetchedBlogs],
            page,
          }
        })
      }
    } catch (err) {
      console.error(`Error fetching ${draft ? 'draft' : 'published'} blogs:`, err)
      setter({ results: [], totalDocs: 0, page: 1 })
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [access_token, fetchCount])

  const getPublishedBlogs = useCallback(
    ({ page = 1 } = {}) => fetchBlogs({ page, draft: false }),
    [fetchBlogs]
  )

  const getDraftBlogs = useCallback(
    ({ page = 1 } = {}) => fetchBlogs({ page, draft: true }),
    [fetchBlogs]
  )

  // Initial load
  useEffect(() => {
    if (!access_token) return
    const isDraftTab = searchParams.get('tab') === 'draft'
    if (isDraftTab) {
      if (!draftBlogs) getDraftBlogs({ page: 1 })
    } else {
      if (!publishedBlogs) getPublishedBlogs({ page: 1 })
    }
  }, [access_token]) // eslint-disable-line

  // Tab change
  useEffect(() => {
    const newPageState = searchParams.get('tab') === 'draft' ? 'draft' : 'published'
    if (newPageState !== pageState) {
      setPageState(newPageState)
      if (newPageState === 'draft' && !draftBlogs) {
        getDraftBlogs({ page: 1 })
      } else if (newPageState === 'published' && !publishedBlogs) {
        getPublishedBlogs({ page: 1 })
      }
    }
  }, [searchParams]) // eslint-disable-line

  // ✅ Attach setStateFun so delete works — use the correct setter
  const publishedBlogsWithMeta = useMemo(() => {
    if (!publishedBlogs) return null
    return {
      ...publishedBlogs,
      results: publishedBlogs.results.map((blog, i) => ({
        ...blog,
        index: i,
        setStateFun: setPublishedBlogs,
      })),
    }
  }, [publishedBlogs])

  const draftBlogsWithMeta = useMemo(() => {
    if (!draftBlogs) return null
    return {
      ...draftBlogs,
      results: draftBlogs.results.map((blog, i) => ({
        ...blog,
        index: i,
        setStateFun: setDraftBlogs,
      })),
    }
  }, [draftBlogs])

  const publishedBlogsList = useMemo(() => {
    if (!publishedBlogsWithMeta) return <Loader />
    if (!publishedBlogsWithMeta.results.length) return <NoDataMessage message="No published blogs" />
    return (
      <>
        {publishedBlogsWithMeta.results.map((blog, i) => (
          <AnimationWrapper key={blog.blog_id || i} transition={{ duration: 0.6, delay: i * 0.04 }}>
            <ManagePublishedBlogCard blog={blog} />
          </AnimationWrapper>
        ))}
        <LoadMoreDataBtn
          state={publishedBlogsWithMeta}
          fetchDataFun={getPublishedBlogs}
          disabled={isLoading}
        />
      </>
    )
  }, [publishedBlogsWithMeta, getPublishedBlogs, isLoading])

  const draftBlogsList = useMemo(() => {
    if (!draftBlogsWithMeta) return <Loader />
    if (!draftBlogsWithMeta.results.length) return <NoDataMessage message="No draft blogs" />
    return (
      <>
        {draftBlogsWithMeta.results.map((blog, i) => (
          <AnimationWrapper key={blog.blog_id || i} transition={{ duration: 0.6, delay: i * 0.04 }}>
            <ManageDraftBlogPost blog={blog} />
          </AnimationWrapper>
        ))}
        <LoadMoreDataBtn
          state={draftBlogsWithMeta}
          fetchDataFun={getDraftBlogs}
          disabled={isLoading}
        />
      </>
    )
  }, [draftBlogsWithMeta, getDraftBlogs, isLoading])

  if (access_token === null) {
    return <div className="ts-dash-loading-screen"><Loader /></div>
  }

  return (
    <AnimationWrapper>
      <section className="ts-dash-section">
        <div className="ts-dash-header">
          <h1 className="ts-dash-title">Manage Blogs</h1>
          {isLoading && (
            <div className="ts-dash-loading-pill">
              <span className="ts-dash-spinner" aria-hidden="true" />
              Loading
            </div>
          )}
        </div>

        <InPageNavigation
          routes={['Published Blogs', 'Drafts']}
          defaultHidden={['Drafts']}
          defaultActiveIndex={pageState === 'draft' ? 1 : 0}
        >
          {publishedBlogsList}
          {draftBlogsList}
        </InPageNavigation>
      </section>
    </AnimationWrapper>
  )
}

export default DashboardBlogsPage