// RSS Feed generator
export async function GET(request) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'
  
  try {
    const blogs = await fetchLatestBlogs(50)
    
    const rssItems = blogs
      .map(blog => `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <description><![CDATA[${blog.description}]]></description>
      <link>${baseUrl}/blog/${blog.slug}</link>
      <guid>${baseUrl}/blog/${blog.slug}</guid>
      <pubDate>${new Date(blog.publishedAt).toUTCString()}</pubDate>
      ${blog.banner ? `<image url="${blog.banner}" />` : ''}
      <category>${blog.category || 'Trading'}</category>
      ${blog.authorName ? `<author>${blog.authorEmail || 'noreply@tradingsyntax.com'} (${blog.authorName})</author>` : ''}
    </item>
    `)
      .join('')

    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>TradingSyntax - Smart Money Concepts & Trading Analysis</title>
    <link>${baseUrl}</link>
    <description>Discover smart money concepts, forex trading, crypto analysis, and price action strategies on TradingSyntax.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>TradingSyntax</title>
      <link>${baseUrl}</link>
    </image>
    <copyright>© ${new Date().getFullYear()} TradingSyntax. All rights reserved.</copyright>
    ${rssItems}
  </channel>
</rss>`

    return new Response(rssContent, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}

async function fetchLatestBlogs(limit = 50) {
  try {
    // Replace with your actual database/API call
    const blogs = [
      {
        title: 'Introduction to Trading Market Concepts',
        description: 'Learn the basics of smart money concepts in trading',
        slug: 'intro-smart-money-concepts',
        banner: 'https://example.com/blog-banner.jpg',
        publishedAt: new Date().toISOString(),
        category: 'Trading',
        authorName: 'Trading Expert',
        authorEmail: 'author@tradingsyntax.com',
      },
    ]
    return blogs
  } catch (error) {
    console.error('Error fetching latest blogs:', error)
    return []
  }
}
