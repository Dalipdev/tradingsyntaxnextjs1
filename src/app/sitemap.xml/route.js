// src/app/sitemap.xml/route.js
// Advanced sitemap.xml route handler — matches actual backend API contract
// Blogs: POST /search-blogs (body params, returns { blogs })
// Users: GET /all-users (returns { users })

const SERVER_DOMAIN = process.env.NEXT_PUBLIC_SERVER_DOMAIN || 'https://api.tradingsyntax.com'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com').replace(/\/$/, '')

const MAX_URLS = 50000 // Google's per-file cap
const BLOG_FETCH_LIMIT = 5000 // backend's /search-blogs applies this as a single-page .limit()

// Safety-net revalidation window. On-demand revalidation (via /api/revalidate)
// should make this fire almost never in practice — this just guarantees the
// sitemap can never be stale for more than 5 minutes even if a webhook is missed.
export const revalidate = 300

export async function GET() {
  try {
    const [blogs, users] = await Promise.all([fetchBlogs(), fetchUsers()])

    console.log(`Sitemap build: ${blogs.length} blogs, ${users.length} users found`)

    // --- Static pages ---
    // Only publicly indexable pages belong here. Keep private/auth pages
    // (e.g. /dashboard) out — block them in robots.txt instead.
    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily', lastmod: '2026-01-01' },
      { path: '/blog', priority: '0.9', changefreq: 'daily', lastmod: '2026-01-01' },
      { path: '/search', priority: '0.7', changefreq: 'weekly', lastmod: '2026-01-01' },
    ]

    const staticEntries = staticPages.map(
      (page) => `  <url>
    <loc>${escapeXml(SITE_URL + page.path)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )

    // --- Blog entries ---
    // Backend returns: blog_id, title, des, banner, activity, tags, publishedAt
    const blogEntries = blogs
      .filter((blog) => blog?.blog_id)
      .slice(0, MAX_URLS)
      .map((blog) => {
        const lastmod = safeDate(blog.publishedAt)
        const bannerUrl = typeof blog.banner === 'string' ? blog.banner.trim() : ''
        const bannerImage = bannerUrl
          ? `    <image:image>
      <image:loc>${escapeXml(bannerUrl)}</image:loc>
      <image:title>${escapeXml(blog.title || 'Blog Post')}</image:title>
    </image:image>\n`
          : ''

        return `  <url>
    <loc>${escapeXml(`${SITE_URL}/blog/${blog.blog_id}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${bannerImage}  </url>`
      })

    // --- User profile entries ---
    // Backend returns: personal_info.username, updatedAt
    const userEntries = users
      .filter((user) => user?.personal_info?.username || user?.username)
      .slice(0, MAX_URLS)
      .map((user) => {
        const username = user.personal_info?.username || user.username
        const lastmod = safeDate(user.updatedAt)

        return `  <url>
    <loc>${escapeXml(`${SITE_URL}/user/${username}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
      })

    const allEntries = [...staticEntries, ...blogEntries, ...userEntries]

    if (allEntries.length > MAX_URLS) {
      console.warn(
        `Sitemap has ${allEntries.length} URLs, exceeding the ${MAX_URLS} limit. Split into a sitemap index.`
      )
    }

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allEntries.slice(0, MAX_URLS).join('\n')}
</urlset>`

    return new Response(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // Matches the shortened revalidate window above. CDN can serve a
        // stale copy for up to 5 min while revalidating in the background.
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap.xml:', error)

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
        'Cache-Control': 'public, s-maxage=300',
      },
    })
  }
}

// Backend contract: POST /search-blogs, body params (not query string!),
// returns { blogs: [...] }. No tag/query/author = matches all non-draft blogs.
async function fetchBlogs() {
  try {
    const response = await fetch(`${SERVER_DOMAIN}/search-blogs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: 1,
        limit: BLOG_FETCH_LIMIT,
      }),
      cache: 'no-store', // always hit the backend fresh — don't reuse a cached fetch response
      signal: AbortSignal.timeout(20000), // Render free tier can be slow on cold DB queries
    })

    if (!response.ok) {
      console.error(
        `fetchBlogs failed: ${response.status} ${response.statusText}`,
        await safeText(response)
      )
      return []
    }

    const data = await response.json()
    return Array.isArray(data?.blogs) ? data.blogs : []
  } catch (error) {
    console.error('Error fetching blogs:', error.name, error.message)
    return []
  }
}

// Backend contract: GET /all-users, returns { users: [...] }
async function fetchUsers() {
  try {
    const response = await fetch(`${SERVER_DOMAIN}/all-users`, {
      cache: 'no-store', // always hit the backend fresh
      signal: AbortSignal.timeout(20000),
    })

    if (!response.ok) {
      console.error(
        `fetchUsers failed: ${response.status} ${response.statusText}`,
        await safeText(response)
      )
      return []
    }

    const data = await response.json()
    return Array.isArray(data?.users) ? data.users : []
  } catch (error) {
    console.error('Error fetching users:', error.name, error.message)
    return []
  }
}

async function safeText(response) {
  try {
    return await response.text()
  } catch {
    return '<unreadable body>'
  }
}

function safeDate(value) {
  const d = value ? new Date(value) : null
  if (!d || isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0]
  }
  return d.toISOString().split('T')[0]
}

function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
