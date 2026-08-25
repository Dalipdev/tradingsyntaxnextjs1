// Sitemap for blog posts
export async function GET(request) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'

  try {
    // Fetch blogs from your database
    const blogs = await fetchAllBlogs()

    const blogEntries = blogs
      .slice(0, 50000) // Google sitemap limit
      .map((blog) => `
    <url>
      <loc>${baseUrl}/blog/${blog.slug}</loc>
      <lastmod>${blog.updatedAt || new Date().toISOString().split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
      ${
        blog.banner
          ? `<image:image>
        <image:loc>${blog.banner}</image:loc>
        <image:title>${escapeXml(blog.title)}</image:title>
        <image:caption>${escapeXml(blog.description || '')}</image:caption>
      </image:image>`
          : ''
      }
    </url>
    `)
      .join('')

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${blogEntries}
</urlset>`

    return new Response(xmlContent, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating blogs sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}

async function fetchAllBlogs() {
  try {
    // Replace this with your actual database/API call
    // Example structure:
    const blogs = [
      {
        slug: 'smart-money-concepts-guide',
        title: 'Smart Money Concepts Guide',
        description: 'A comprehensive guide to understanding smart money concepts',
        banner: 'https://example.com/blog-banner.jpg',
        updatedAt: new Date().toISOString().split('T')[0],
      },
    ]
    return blogs
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return []
  }
}

function escapeXml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
