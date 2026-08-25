// Constants and utilities for SEO
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'

export const SITE_NAME = 'TradingSyntax'
export const SITE_DESCRIPTION = 'Discover smart money concepts, forex trading, crypto analysis, and price action strategies on TradingSyntax.'

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/tradingsyntax',
  facebook: 'https://facebook.com/tradingsyntax',
  instagram: 'https://instagram.com/tradingsyntax',
  youtube: 'https://youtube.com/@tradingsyntax',
  linkedin: 'https://linkedin.com/company/tradingsyntax',
}

export const CONTACT_EMAIL = 'support@tradingsyntax.com'
export const SUPPORT_URL = `${BASE_URL}/support`

export const CANONICAL_PAGES = {
  home: `${BASE_URL}/`,
  blog: `${BASE_URL}/blog`,
  search: `${BASE_URL}/search`,
  dashboard: `${BASE_URL}/dashboard`,
  profile: (userId) => `${BASE_URL}/user/${userId}`,
  blogPost: (slug) => `${BASE_URL}/blog/${slug}`,
}

// Common keywords for different content types
export const KEYWORDS = {
  general: ['trading', 'forex', 'crypto', 'market analysis', 'price action'],
  blog: ['trading strategies', 'market analysis', 'trading signals', 'forex trading'],
  education: ['learn trading', 'trading course', 'trading tutorial', 'trading for beginners'],
  technical: ['technical analysis', 'chart patterns', 'moving averages', 'RSI', 'MACD'],
}

// Change frequencies for sitemaps
export const CHANGE_FREQUENCIES = {
  always: 'always',
  hourly: 'hourly',
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  yearly: 'yearly',
  never: 'never',
}

// Priority levels for sitemaps (0.0 - 1.0)
export const PRIORITIES = {
  critical: '1.0',
  high: '0.9',
  medium: '0.6',
  low: '0.3',
  minimal: '0.1',
}

// Image sizes for optimization
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 400, height: 300 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 630 },
  xlarge: { width: 1920, height: 1080 },
}

// Video optimization defaults
export const VIDEO_DEFAULTS = {
  platform: 'youtube',
  duration: 300,
}

// Cache durations
export const CACHE_DURATIONS = {
  short: 'public, s-maxage=300, stale-while-revalidate=600',
  medium: 'public, s-maxage=3600, stale-while-revalidate=86400',
  long: 'public, s-maxage=86400, stale-while-revalidate=604800',
  veryLong: 'public, s-maxage=604800, immutable',
}
