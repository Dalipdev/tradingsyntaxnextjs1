// app/dashboard/notifications/page.js

'use client'

import { useContext, useEffect, useState, useCallback, useMemo, useTransition } from 'react'
import { UserContext } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import AnimationWrapper from '@/lib/page-animation'
import Loader from '@/components/loader.component'
import NoDataMessage from '@/components/nodata.component'
import NotificationCard from '@/components/notification-card.component'

const NotificationsPage = () => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const { userAuth: { access_token } } = useContext(UserContext)
  
  const [notifications, setNotifications] = useState({ 
    results: null, 
    totalDocs: 0,
    page: 1 
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Redirect to signin immediately if not authenticated without leaving a
  // stale dashboard entry in the browser history.
  useEffect(() => {
    if (access_token === null) {
      router.replace('/signin')
    }
  }, [access_token, router])

  // Optimized fetch with native fetch API
  const fetchNotifications = useCallback(async ({ page = 1 } = {}) => {
    if (!access_token) return

    // Prevent duplicate requests
    if (loading && page === 1) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/user-notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
          },
          body: JSON.stringify({ page }),
          cache: 'no-store', // Always get fresh notifications
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Handle different response structures
      const results = data.notifications || data.results || data || []
      const totalDocs = data.totalDocs || (Array.isArray(results) ? results.length : 0)

      // Update state with transition for smoother UI
      startTransition(() => {
        setNotifications(prev => ({
          results: page === 1 ? results : [...(prev.results || []), ...results],
          totalDocs,
          page,
        }))
      })

    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err.message)
      
      startTransition(() => {
        setNotifications({ results: [], totalDocs: 0, page: 1 })
      })
    } finally {
      setLoading(false)
    }
  }, [access_token, loading])

  // Load more notifications
  const loadMoreNotifications = useCallback(() => {
    if (notifications.results && notifications.results.length < notifications.totalDocs) {
      fetchNotifications({ page: notifications.page + 1 })
    }
  }, [notifications, fetchNotifications])

  // Initial load - only fetch once
  useEffect(() => {
    if (access_token && notifications.results === null) {
      fetchNotifications({ page: 1 })
    }
  }, [access_token]) // Minimal dependencies

  // Mark all as read function
  const markAllAsRead = useCallback(async () => {
    if (!access_token || !notifications.results?.length) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/mark-all-notifications-read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
          },
        }
      )

      if (response.ok) {
        // Update all notifications to seen
        startTransition(() => {
          setNotifications(prev => ({
            ...prev,
            results: prev.results.map(n => ({ ...n, seen: true }))
          }))
        })
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  }, [access_token, notifications.results])

  // Memoized notification list to prevent unnecessary re-renders
  const notificationsList = useMemo(() => {
    if (loading && notifications.results === null) {
      return <Loader />
    }

    if (error) {
      return (
        <NoDataMessage message={`Error loading notifications: ${error}`}>
          <button
            onClick={() => fetchNotifications({ page: 1 })}
            className="mt-4 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </NoDataMessage>
      )
    }

    if (!notifications.results || !notifications.results.length) {
      return <NoDataMessage message="No notifications yet" />
    }

    return (
      <div className="bg-white rounded-lg">
        {notifications.results.map((notification, i) => (
          <AnimationWrapper 
            key={notification._id || i} 
            transition={{ duration: 0.5, delay: i * 0.02 }}
          >
            <NotificationCard 
              data={notification} 
              index={i} 
              notificationState={{ notifications, setNotifications }} 
            />
          </AnimationWrapper>
        ))}

        {/* Load More Button */}
        {notifications.results.length < notifications.totalDocs && (
          <div className="flex justify-center py-4 border-t border-gray-200">
            <button
              onClick={loadMoreNotifications}
              disabled={loading || isPending}
              className="text-dark-grey p-2 px-4 hover:bg-grey/30 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                `Load More (${notifications.totalDocs - notifications.results.length} remaining)`
              )}
            </button>
          </div>
        )}
      </div>
    )
  }, [notifications, loading, error, isPending, fetchNotifications, loadMoreNotifications])

  // Check if there are unread notifications
  const unreadCount = useMemo(() => {
    return notifications.results?.filter(n => !n.seen).length || 0
  }, [notifications.results])

  // Show loader during auth check
  if (access_token === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <AnimationWrapper>
      <section className="w-full max-w-6xl mx-auto px-4 md:px-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="max-md:hidden">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-dark-grey hover:text-black transition-colors"
            >
              Mark all as read
            </button>
          )}

          {(loading || isPending) && notifications.results !== null && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              Updating...
            </div>
          )}
        </div>

        {notificationsList}
      </section>
    </AnimationWrapper>
  )
}

export default NotificationsPage