import axios from "axios";

/**
 * Filters and paginates data with server-side total count
 * @param {Object} options - Configuration options
 * @param {boolean} options.create_new_arr - Whether to create a new array or append
 * @param {Object|null} options.state - Current pagination state
 * @param {Array} options.data - New data to add
 * @param {number} options.page - Current page number
 * @param {string} options.countRoute - API route to get total count
 * @param {Object} options.data_to_send - Data to send with count request
 * @param {string} options.user - Access token for authentication
 * @returns {Promise<Object>} Pagination object with results, page, and totalDocs
 */
export const filterPaginationData = async ({ 
  create_new_arr = false, 
  state, 
  data, 
  page, 
  countRoute, 
  data_to_send = {}, 
  user = undefined 
}) => {
  try {
    let obj;

    // ✅ IMPROVED: Build headers object more cleanly
    const headers = user ? {
      headers: {
        'Authorization': `Bearer ${user}`
      }
    } : {};

    // ✅ IMPROVED: Validate input data
    if (!Array.isArray(data)) {
      console.error('filterPaginationData: data must be an array', data);
      return state || { results: [], page: 1, totalDocs: 0 };
    }

    // ✅ IMPROVED: Better condition logic
    if (state && !create_new_arr) {
      // ✅ ADD: Prevent duplicate entries
      const existingIds = new Set(state.results.map(item => item._id || item.id));
      const newData = data.filter(item => !existingIds.has(item._id || item.id));
      
      obj = { 
        ...state, 
        results: [...state.results, ...newData], 
        page: page 
      };
    } else {
      // ✅ IMPROVED: Better error handling and validation
      if (!countRoute) {
        console.error('filterPaginationData: countRoute is required for new pagination');
        return { results: data, page: 1, totalDocs: data.length };
      }

      try {
        const { data: { totalDocs } } = await axios.post(
          process.env.NEXT_PUBLIC_SERVER_DOMAIN + countRoute, 
          data_to_send, 
          {
            ...headers,
            timeout: 10000  // ✅ ADD: 10 second timeout
          }
        );

        // ✅ ADD: Validate totalDocs
        const validTotalDocs = typeof totalDocs === 'number' && totalDocs >= 0 
          ? totalDocs 
          : data.length;

        obj = { 
          results: data, 
          page: 1, 
          totalDocs: validTotalDocs 
        };

      } catch (err) {
        console.error('filterPaginationData: Failed to fetch total count', err);
        
        // ✅ IMPROVED: Return partial data on error instead of nothing
        obj = { 
          results: data, 
          page: 1, 
          totalDocs: data.length,  // ✅ ADD: Use data length as fallback
          error: err.response?.data?.error || 'Failed to fetch total count'
        };
      }
    }

    return obj;

  } catch (err) {
    console.error('filterPaginationData: Unexpected error', err);
    
    // ✅ ADD: Return safe fallback on any error
    return state || { 
      results: data || [], 
      page: 1, 
      totalDocs: 0,
      error: 'Unexpected error occurred'
    };
  }
};

// ✅ ADD: Helper function to check if more data is available
export const hasMoreData = (paginationState) => {
  if (!paginationState || !paginationState.results) return false;
  
  const { results, totalDocs } = paginationState;
  return results.length < totalDocs;
};

// ✅ ADD: Helper function to get current page info
export const getPaginationInfo = (paginationState) => {
  if (!paginationState) {
    return {
      currentPage: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
      itemsLoaded: 0,
      totalItems: 0
    };
  }

  const { results = [], page = 1, totalDocs = 0 } = paginationState;
  const itemsPerPage = results.length / page || 10;  // Estimate items per page
  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  return {
    currentPage: page,
    totalPages,
    hasNext: hasMoreData(paginationState),
    hasPrevious: page > 1,
    itemsLoaded: results.length,
    totalItems: totalDocs,
    percentageLoaded: totalDocs > 0 
      ? Math.round((results.length / totalDocs) * 100) 
      : 0
  };
};

// ✅ ADD: Helper to reset pagination
export const resetPagination = () => ({
  results: [],
  page: 1,
  totalDocs: 0
});

// ✅ ADD: Helper to merge pagination states (useful for tabs)
export const mergePaginationStates = (states = []) => {
  const allResults = states.flatMap(state => state?.results || []);
  const totalDocs = states.reduce((sum, state) => sum + (state?.totalDocs || 0), 0);
  
  // ✅ ADD: Remove duplicates by ID
  const uniqueResults = Array.from(
    new Map(allResults.map(item => [item._id || item.id, item])).values()
  );
  
  return {
    results: uniqueResults,
    page: 1,
    totalDocs
  };
};

// ✅ ADD: Optimized version for client-side filtering
export const filterPaginationDataLocal = ({ 
  state, 
  data, 
  page, 
  itemsPerPage = 10,
  create_new_arr = false 
}) => {
  if (!Array.isArray(data)) {
    console.error('filterPaginationDataLocal: data must be an array');
    return { results: [], page: 1, totalDocs: 0 };
  }

  if (state && !create_new_arr) {
    // ✅ ADD: Prevent duplicates
    const existingIds = new Set(state.results.map(item => item._id || item.id));
    const newData = data.filter(item => !existingIds.has(item._id || item.id));
    
    return {
      ...state,
      results: [...state.results, ...newData],
      page
    };
  }

  return {
    results: data.slice(0, itemsPerPage),
    page: 1,
    totalDocs: data.length
  };
};