// Search metadata endpoint - Returns search suggestions for SEO
export async function GET(request) {
  const searchParams = new URL(request.url).searchParams
  const query = searchParams.get('q')?.toLowerCase()

  if (!query || query.length < 2) {
    return Response.json({ 
      suggestions: [],
      error: 'Query too short'
    }, { status: 400 })
  }

  try {
    // Get search suggestions from your database
    const suggestions = await getSearchSuggestions(query)

    return Response.json({
      query,
      suggestions: suggestions.slice(0, 10),
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return Response.json({ 
      error: 'Internal server error'
    }, { status: 500 })
  }
}

async function getSearchSuggestions(query) {
  // Replace with your actual database query
  // This might search through blog titles, tags, and categories
  const suggestions = [
    `${query} trading`,
    `${query} forex`,
    `${query} analysis`,
    `${query} signals`,
  ]
  
  return suggestions
}
