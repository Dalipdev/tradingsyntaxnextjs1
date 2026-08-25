// ODS (Open Directory Search) friendly metadata endpoint
export async function GET(request) {
  return Response.json({
    title: 'TradingSyntax - Smart Money Concepts & Forex Trading',
    description: 'Discover smart money concepts, forex trading, crypto analysis, and price action strategies.',
    url: 'https://tradingsyntax.com',
    image: 'https://tradingsyntax.com/og-image.png',
    author: 'TradingSyntax Team',
    category: 'Finance, Trading, Education',
    keywords: [
      'trading',
      'forex',
      'crypto',
      'price action',
      'smart money concepts',
      'market analysis'
    ],
    social: {
      twitter: '@tradingsyntax',
      facebook: 'tradingsyntax',
      instagram: 'tradingsyntax',
      youtube: '@tradingsyntax'
    },
    contact: {
      email: 'support@tradingsyntax.com',
      support_url: 'https://tradingsyntax.com/support'
    }
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
