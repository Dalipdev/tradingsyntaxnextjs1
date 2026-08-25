// Schema Helper - Generate various structured data schemas
export const SCHEMAS = {
  // Organization Schema
  organization: (data = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name || 'TradingSyntax',
    url: data.url || 'https://tradingsyntax.com',
    logo: data.logo || 'https://tradingsyntax.com/logo.png',
    description: data.description || 'Smart Money Concepts, Forex & Market Analysis Platform',
    foundingDate: data.foundingDate || '2023',
    sameAs: data.sameAs || [
      'https://twitter.com/tradingsyntax',
      'https://facebook.com/tradingsyntax',
      'https://instagram.com/tradingsyntax',
      'https://youtube.com/@tradingsyntax',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: data.email || 'support@tradingsyntax.com',
      url: data.contactUrl || 'https://tradingsyntax.com/support',
    },
    address: data.address || {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
  }),

  // Person Schema
  person: (data) => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
    url: data.url,
    image: data.image,
    description: data.description,
    sameAs: data.sameAs || [],
    affiliation: {
      '@type': 'Organization',
      name: 'TradingSyntax',
    },
  }),

  // BlogPosting Schema
  blogPosting: (data) => ({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.headline,
    description: data.description,
    image: data.image,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
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
        url: 'https://tradingsyntax.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url,
    },
    wordCount: data.wordCount,
    articleBody: data.articleBody?.substring(0, 200),
    articleSection: data.articleSection || 'Trading',
    keywords: data.keywords?.join(', '),
  }),

  // FAQ Schema
  faqPage: (data) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs?.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })) || [],
  }),

  // LocalBusiness Schema
  localBusiness: (data) => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.name || 'TradingSyntax',
    image: data.image,
    url: data.url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.streetAddress,
      addressLocality: data.city,
      addressRegion: data.state,
      postalCode: data.postalCode,
      addressCountry: data.country,
    },
    telephone: data.telephone,
    email: data.email,
    priceRange: data.priceRange,
  }),

  // Event Schema
  event: (data) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    eventAttendanceMode: data.attendanceMode || 'OnlineEventAttendanceMode',
    eventStatus: data.eventStatus || 'EventScheduled',
    location: {
      '@type': 'VirtualLocation',
      url: data.url,
    },
    organizer: {
      '@type': 'Organization',
      name: 'TradingSyntax',
      url: data.organizerUrl || 'https://tradingsyntax.com',
    },
  }),

  // Course Schema (for educational content)
  course: (data) => ({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: data.name,
    description: data.description,
    image: data.image,
    url: data.url,
    provider: {
      '@type': 'Organization',
      name: 'TradingSyntax',
      sameAs: 'https://tradingsyntax.com',
    },
    aggregateRating: data.aggregateRating && {
      '@type': 'AggregateRating',
      ratingValue: data.aggregateRating.value,
      ratingCount: data.aggregateRating.count,
    },
  }),

  // BreadcrumbList Schema
  breadcrumbs: (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),

  // VideoObject Schema
  video: (data) => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: data.name,
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
    uploadDate: data.uploadDate,
    duration: data.duration,
    contentUrl: data.contentUrl,
    embedUrl: data.embedUrl,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'http://schema.org/WatchAction',
      userInteractionCount: data.viewCount || 0,
    },
  }),

  // WebSite Schema - for site search
  website: (data = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: data.url || 'https://tradingsyntax.com',
    name: data.name || 'TradingSyntax',
    description: data.description || 'Smart Money Concepts & Forex Trading',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: data.searchUrl || 'https://tradingsyntax.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }),

  // AggregateOffer Schema (for products/services)
  offer: (data) => ({
    '@context': 'https://schema.org',
    '@type': 'Offer',
    url: data.url,
    priceCurrency: data.priceCurrency || 'USD',
    price: data.price,
    priceValidUntil: data.priceValidUntil,
    availability: data.availability || 'InStock',
    seller: {
      '@type': 'Organization',
      name: 'TradingSyntax',
    },
  }),
}

// Helper to generate multiple schemas
export function generateMultipleSchemas(...schemas) {
  return schemas.map(schema => ({
    __html: JSON.stringify(schema)
  }))
}

// Helper to create a linked schema (chain multiple schemas)
export function linkSchemas(schemas) {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  }
}
