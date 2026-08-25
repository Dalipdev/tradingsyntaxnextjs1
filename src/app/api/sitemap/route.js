// Dynamic sitemap.xml generator API route
const SERVER_DOMAIN = process.env.NEXT_PUBLIC_SERVER_DOMAIN || 'https://api.tradingsyntax.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'

export const revalidate = 3600 // Cache for 1 hour

export async function GET(request) {
  try {
    // Fetch blogs and users in parallel
    const [blogs, users] = await Promise.all([
      fetchBlogs(),
      fetchUsers(),
    ])

    // Static pages with priority
    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/blog', priority: '0.9', changefreq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/search', priority: '0.8', changefreq: 'weekly', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/dashboard', priority: '0.6', changefreq: 'weekly', lastmod: new Date().toISOString().split('T')[0] },
    ]

    // Generate static page entries
    const staticEntries = staticPages
      .map(page => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
      .join('\n')

    // Generate blog entries
    const blogEntries = blogs
      .filter(blog => blog.slug && blog.publishedAt)
      .map(blog => {
        const lastmod = blog.publishedAt ? new Date(blog.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        const bannerImage = blog.banner ? `    <image:image>
      <image:loc>${blog.banner}</image:loc>
      <image:title>${escapeXml(blog.title)}</image:title>
    </image:image>\n` : ''
        
        return `  <url>
    <loc>${SITE_URL}/blog/${blog.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${bannerImage}  </url>`
      })
      .join('\n')

    // Generate user profile entries
    const userEntries = users
      .filter(user => user.username || (user.personal_info && user.personal_info.username))
      .map(user => {
        const username = user.personal_info?.username || user.username
        const lastmod = user.updatedAt ? new Date(user.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        
        return `  <url>
    <loc>${SITE_URL}/user/${username}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
      })
      .join('\n')

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
${staticEntries}
${blogEntries}
${userEntries}
</urlset>`

    return new Response(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Return a basic sitemap on error to avoid complete failure
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`

    return new Response(fallbackXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  }
}

async function fetchBlogs() {
  try {
    const response = await fetch(`${SERVER_DOMAIN}/search-blogs?limit=10000&sort=-publishedAt`, {
      timeout: 10000,
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch blogs: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    return Array.isArray(data.blogs) ? data.blogs : []
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error.message)
    return []
  }
}

async function fetchUsers() {
  try {
    const response = await fetch(`${SERVER_DOMAIN}/all-users`, {
      timeout: 10000,
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch users: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    return Array.isArray(data.users) ? data.users : []
  } catch (error) {
    console.error('Error fetching users for sitemap:', error.message)
    return []
  }
}

// Escape XML special characters
function escapeXml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
