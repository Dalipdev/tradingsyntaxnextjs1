// SEO Utilities for TradingSyntax

export const generateCanonicalUrl = (path) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'
  return `${baseUrl}${path}`
}

export const generateJsonLd = (type, data) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'
  
  switch(type) {
    case 'article':
      return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': data.url,
        headline: data.title,
        description: data.description,
        image: data.image || `${baseUrl}/og-image.png`,
        datePublished: data.publishedDate,
        dateModified: data.modifiedDate,
        author: {
          '@type': 'Person',
          name: data.authorName,
          url: data.authorUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'TradingSyntax',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`,
            width: 250,
            height: 60,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': data.url,
        },
      }
    
    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'TradingSyntax',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        description: 'Smart Money Concepts, Forex & Market Analysis',
        sameAs: [
          'https://twitter.com/tradingsyntax',
          'https://facebook.com/tradingsyntax',
          'https://instagram.com/tradingsyntax',
          'https://youtube.com/@tradingsyntax',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
          email: 'support@tradingsyntax.com',
        },
      }
    
    case 'person':
      return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: data.name,
        url: data.url,
        image: data.profileImage,
        description: data.bio,
      }
    
    case 'breadcrumb':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data.items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }
    
    default:
      return null
  }
}

export const generateMetadata = (params) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'
  
  return {
    title: params.title,
    description: params.description || 'Discover smart money concepts, forex trading, and market analysis on TradingSyntax.',
    keywords: params.keywords || ['trading', 'forex', 'stocks', 'crypto', 'market analysis'],
    robots: params.robots || 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    openGraph: {
      type: params.ogType || 'website',
      locale: 'en_US',
      url: params.url || baseUrl,
      title: params.ogTitle || params.title,
      description: params.ogDescription || params.description,
      images: [
        {
          url: params.ogImage || `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: params.title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: params.title,
      description: params.description,
      images: [params.ogImage || `${baseUrl}/og-image.png`],
      creator: '@tradingsyntax',
    },
    canonical: params.canonical || `${baseUrl}${params.path}`,
  }
}

export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TradingSyntax',
  url: 'https://tradingsyntax.com',
  logo: 'https://tradingsyntax.com/logo.png',
  description: 'Smart Money Concepts, Forex & Market Analysis Platform',
  sameAs: [
    'https://twitter.com/tradingsyntax',
    'https://facebook.com/tradingsyntax',
    'https://instagram.com/tradingsyntax',
    'https://youtube.com/@tradingsyntax',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    email: 'support@tradingsyntax.com',
  },
}
