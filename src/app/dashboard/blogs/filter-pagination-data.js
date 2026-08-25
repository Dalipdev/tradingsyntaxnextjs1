// lib/filter-pagination-data.js

export const filterPaginationData = async ({
  state,
  data,
  page,
  countRoute,
  data_to_send = {},
  user = undefined,
}) => {
  let obj

  // Get headers
  const headers = {
    'Content-Type': 'application/json',
  }

  if (user) {
    headers['Authorization'] = `Bearer ${user}`
  }

  // If state exists and we're loading more (page > 1)
  if (state !== null && page > 1) {
    obj = {
      ...state,
      results: [...state.results, ...data],
      page,
    }
  } else {
    // First page or fresh load - fetch total count
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}${countRoute}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data_to_send),
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const { totalDocs } = await response.json()

      obj = {
        results: data,
        page: 1,
        totalDocs,
      }
    } catch (err) {
      console.error('Error fetching count:', err)
      obj = {
        results: data,
        page: 1,
        totalDocs: 0,
      }
    }
  }

  return obj
}