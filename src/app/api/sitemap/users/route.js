// Sitemap for user profiles
export async function GET(request) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'

  try {
    // Fetch users from your database
    const users = await fetchAllUsers()

    const userEntries = users
      .slice(0, 50000) // Google sitemap limit
      .map((user) => `
    <url>
      <loc>${baseUrl}/user/${user.id}</loc>
      <lastmod>${user.updatedAt || new Date().toISOString().split('T')[0]}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>
    `)
      .join('')

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${userEntries}
</urlset>`

    return new Response(xmlContent, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('Error generating users sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}

async function fetchAllUsers() {
  try {
    // Replace this with your actual database/API call
    const users = []
    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}
