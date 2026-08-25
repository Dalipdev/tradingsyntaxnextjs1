// Performance monitoring and Web Vitals tracking
export function reportWebVitals(metric) {
  // Send to your analytics service
  const body = JSON.stringify(metric)
  
  // Use navigator.sendBeacon if available (preferred method)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', body)
  } else {
    // Fallback to fetch
    fetch('/api/analytics', { 
      method: 'POST',
      body,
      keepalive: true,
    }).catch(err => console.log('Error reporting metric:', err))
  }
}

// Monitor Core Web Vitals
if (typeof window !== 'undefined' && 'web-vital' in window) {
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(reportWebVitals)
    getFID(reportWebVitals)
    getFCP(reportWebVitals)
    getLCP(reportWebVitals)
    getTTFB(reportWebVitals)
  }).catch(err => console.log('Error loading web vitals:', err))
}

// Performance Observer for resource timing
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('Resource:', {
          name: entry.name,
          duration: entry.duration,
          size: entry.transferSize,
        })
      }
    })
    
    observer.observe({ entryTypes: ['resource', 'navigation', 'paint'] })
  } catch (error) {
    console.log('Performance monitoring not supported:', error)
  }
}

// Mark navigation timing
export function getNavigationTiming() {
  if (typeof window === 'undefined') return null
  
  const perfData = window.performance?.timing
  if (!perfData) return null

  return {
    dns: perfData.domainLookupEnd - perfData.domainLookupStart,
    tcp: perfData.connectEnd - perfData.connectStart,
    ttfb: perfData.responseStart - perfData.requestStart,
    download: perfData.responseEnd - perfData.responseStart,
    domInteractive: perfData.domInteractive - perfData.fetchStart,
    domComplete: perfData.domComplete - perfData.fetchStart,
    loadComplete: perfData.loadEventEnd - perfData.fetchStart,
  }
}
