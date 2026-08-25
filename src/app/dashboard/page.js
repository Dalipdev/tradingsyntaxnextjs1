// app/dashboard/notifications/page.js

'use client'

import { useContext, useEffect, useState, useCallback, useMemo, useTransition } from 'react'
import { UserContext } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import AnimationWrapper from '@/lib/page-animation'
import Loader from '@/components/loader.component'
import NoDataMessage from '@/components/nodata.component'
import LoadMoreDataBtn from '@/components/load-more.component'
import NotificationCard from '@/components/notification-card.component'
import { filterPaginationData } from '@/lib/filter-pagination-data'

const FILTERS = ['all', 'like', 'comment', 'reply']

const DashboardNotificationsPage = () => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    userAuth: { access_token, new_notification_available } = {},
    setUserAuth,
  } = useContext(UserContext)

  const [notifications, setNotifications] = useState(null)
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to signin immediately if not authenticated without leaving a
  // stale dashboard entry in the history stack.
  useEffect(() => {
    if (access_token === null) {
      router.replace('/signin')
    }
  }, [access_token, router])

  const fetchNotifications = useCallback(
    async ({ page = 1, deletedDocCount = 0 } = {}) => {
      if (!access_token) return

      setIsLoading(true)

      try {
        // FIX: the Express server defines this route as POST /notifications
        // (see server.post("/notifications", verifyJWT, ...)). The old
        // "/get-notifications" path doesn't exist on the backend, so every
        // request 404'd, threw, and the page fell back to an empty/error
        // state instead of ever loading real data.
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/notifications`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${access_token}`,
            },
            body: JSON.stringify({
              page,
              filter,
              deletedDocCount,
            }),
            cache: 'no-store',
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const { notifications: fetchedNotifications } = await response.json()

        const formattedData = await filterPaginationData({
          state: page > 1 ? notifications : null,
          data: fetchedNotifications,
          page,
          countRoute: '/all-notifications-count',
          data_to_send: { filter },
          user: access_token,
        })

        startTransition(() => {
          setNotifications(formattedData)
        })

        // Clear the "new notification" dot once the list has been viewed
        if (new_notification_available && setUserAuth) {
          setUserAuth((prev) => ({ ...prev, new_notification_available: false }))
        }
      } catch (err) {
        console.error('Error fetching notifications:', err)
        startTransition(() => {
          setNotifications({ results: [], totalDocs: 0 })
        })
      } finally {
        setIsLoading(false)
      }
    },
    [access_token, filter, notifications, new_notification_available, setUserAuth]
  )

  // Initial load + refetch whenever the filter changes
  useEffect(() => {
    if (!access_token) return
    setNotifications(null)
    fetchNotifications({ page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access_token, filter])

  const handleFilterChange = useCallback((newFilter) => {
    if (newFilter === filter) return
    setFilter(newFilter)
  }, [filter])

  const notificationState = useMemo(
    () => ({ notifications, setNotifications }),
    [notifications]
  )

  const notificationsList = useMemo(() => {
    if (notifications == null) return <Loader />

    if (!notifications.results.length) {
      return <NoDataMessage message="No notifications yet" />
    }

    return (
      <>
        {notifications.results.map((notification, i) => (
          <AnimationWrapper
            key={notification._id || i}
            transition={{ duration: 0.6, delay: i * 0.04 }}
          >
            <NotificationCard
              data={notification}
              index={i}
              notificationState={notificationState}
            />
          </AnimationWrapper>
        ))}
        <LoadMoreDataBtn
          state={notifications}
          fetchDataFun={fetchNotifications}
          disabled={isLoading || isPending}
        />
      </>
    )
  }, [notifications, notificationState, fetchNotifications, isLoading, isPending])

  if (access_token === null) {
    return (
      <div className="ts-dash-loading-screen">
        <Loader />
      </div>
    )
  }

  return (
    <AnimationWrapper>
      <section className="ts-dash-section">
        <div className="ts-dash-header">
          <h1 className="ts-dash-title">Notifications</h1>
          {(isLoading || isPending) && (
            <div className="ts-dash-loading-pill">
              <span className="ts-dash-spinner" aria-hidden="true" />
              Loading
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap mb-6" role="tablist" aria-label="Filter notifications">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => handleFilterChange(f)}
              className={`tag capitalize ${filter === f ? 'active' : ''}`}
              type="button"
            >
              {f}
            </button>
          ))}
        </div>

        {notificationsList}
      </section>
    </AnimationWrapper>
  )
}

export default DashboardNotificationsPage