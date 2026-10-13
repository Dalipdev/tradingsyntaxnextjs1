// app/robots.js  (or src/app/robots.js)
// Served automatically at https://tradingsyntax.com/robots.txt

const BASE_URL = 'https://tradingsyntax.com'

// Private / low-value areas that should never be crawled
const PRIVATE_PATHS = [
  '/dashboard',
  '/editor',
  '/signin',
  '/signup',
  '/settings',
  '/api/',
]

// Parameter and duplicate-URL patterns that waste crawl budget.
// Remove any that your site doesn't use.
const CRAWL_WASTE = [
  '/*?*utm_',
  '/*?*sessionid=',
  '/*?*sort=',
  '/*?*filter=',
  '/*?*replytocom=',
  '/*?*ref=',
  '/search?',
]

// Must stay crawlable even though /api/ is blocked
const ALWAYS_ALLOW = ['/api/sitemap/']

// Named groups do NOT inherit from "*", so every group repeats the rules.
const sharedRules = {
  allow: ['/', ...ALWAYS_ALLOW],
  disallow: [...PRIVATE_PATHS, ...CRAWL_WASTE],
}

export default function robots() {
  return {
    rules: [
      // Default for all crawlers
      {
        userAgent: '*',
        ...sharedRules,
      },

      // Google (crawl-delay is ignored by Google, so it is omitted)
      {
        userAgent: 'Googlebot',
        ...sharedRules,
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/'],
        disallow: PRIVATE_PATHS,
      },

      // Bing / Microsoft (honors crawl-delay)
      {
        userAgent: 'Bingbot',
        ...sharedRules,
        crawlDelay: 1,
      },

      // Other major search engines
      { userAgent: 'DuckDuckBot', ...sharedRules },
      { userAgent: 'Applebot', ...sharedRules },

      // Aggressive SEO-tool scrapers: no ranking benefit, heavy server load
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'BLEXBot'],
        disallow: ['/'],
      },

      // AI training crawlers: block to keep content out of training data.
      // Delete this block if you WANT visibility in AI products.
      {
        userAgent: [
          'GPTBot',
          'CCBot',
          'Google-Extended',
          'anthropic-ai',
          'ClaudeBot',
          'Bytespider',
          'PerplexityBot',
        ],
        disallow: ['/'],
      },
    ],

    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/api/sitemap/blogs`,
      `${BASE_URL}/api/sitemap/users`,
    ],
    // `host` intentionally removed: Yandex-only and deprecated.
  }
}
