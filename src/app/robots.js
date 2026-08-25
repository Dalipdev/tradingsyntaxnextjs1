// robots.js - Next.js metadata file format (alternative)
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/editor', '/signin', '/signup', '/settings', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1,
      },
    ],
    sitemap: [
      'https://tradingsyntax.com/sitemap.xml',
      'https://tradingsyntax.com/api/sitemap/blogs',
      'https://tradingsyntax.com/api/sitemap/users',
    ],
    host: 'https://tradingsyntax.com',
  }
}
