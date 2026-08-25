// Analytics endpoint to track Web Vitals and custom events
export async function POST(request) {
  try {
    const data = await request.json()

    // You can send this data to your analytics service
    // Examples: Mixpanel, Amplitude, custom database, etc.
    
    console.log('Analytics event:', {
      timestamp: new Date().toISOString(),
      ...data,
    })

    // Send to your analytics database or service
    // await saveAnalytics(data)

    return Response.json({ 
      success: true,
      message: 'Analytics tracked successfully'
    })
  } catch (error) {
    console.error('Error tracking analytics:', error)
    return Response.json({ 
      success: false,
      error: 'Failed to track analytics'
    }, { status: 500 })
  }
}
