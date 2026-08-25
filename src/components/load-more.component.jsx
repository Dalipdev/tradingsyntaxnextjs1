'use client'

import { useState, memo, useCallback } from 'react'
import styles from '../app/HomeClientContent.module.css'

const LoadMoreDataBtn = memo(({ state, fetchDataFun, disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false)

  if (!state || !state.results || !Array.isArray(state.results)) return null

  const { results, page = 1, totalDocs = 0 } = state

  const hasMore = results.length < totalDocs

  if (!hasMore) return null

  const handleLoadMore = useCallback(async () => {
    if (isLoading || disabled) return
    setIsLoading(true)
    try {
      await fetchDataFun({ page: page + 1 })
    } catch (error) {
      console.error('Error loading more:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, disabled, fetchDataFun, page])

  return (
    <button
      onClick={handleLoadMore}
      disabled={isLoading || disabled}
      className={styles.loadMoreBtn}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <span className={styles.loadMoreSpinner} aria-hidden="true" />
          Loading…
        </>
      ) : (
        'Load More'
      )}
    </button>
  )
})

LoadMoreDataBtn.displayName = 'LoadMoreDataBtn'

export default LoadMoreDataBtn