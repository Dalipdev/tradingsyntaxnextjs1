// Blog Post Metadata Generator
export function generateBlogMetadata(blog) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'
  const blogUrl = `${baseUrl}/blog/${blog.slug}`
  
  return {
    title: blog.title,
    description: blog.description || blog.title,
    keywords: blog.tags || ['trading', 'forex', 'market analysis'],
    authors: [{ name: blog.authorName }],
    creator: blog.authorName,
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: blogUrl,
      title: blog.title,
      description: blog.description,
      images: [
        {
          url: blog.banner || `${baseUrl}/default-blog-banner.png`,
          width: 1200,
          height: 630,
          alt: blog.title,
          type: 'image/png',
        },
      ],
      site_name: 'TradingSyntax',
      authors: [blog.authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.description,
      images: [blog.banner || `${baseUrl}/default-blog-banner.png`],
      creator: '@tradingsyntax',
    },
    article: {
      published_time: blog.publishedAt,
      modified_time: blog.updatedAt,
      authors: [blog.authorName],
      tags: blog.tags || [],
      section: 'Trading & Finance',
    },
    alternates: {
      canonical: blogUrl,
    },
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  }
}

export function generateBlogStructuredData(blog) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${baseUrl}/blog/${blog.slug}#article`,
    headline: blog.title,
    description: blog.description,
    image: [blog.banner || `${baseUrl}/default-blog-banner.png`],
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    author: {
      '@type': 'Person',
      name: blog.authorName,
      url: `${baseUrl}/user/${blog.authorId}`,
      image: blog.authorImage,
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
    isPartOf: {
      '@type': 'Blog',
      name: 'TradingSyntax Blog',
      url: `${baseUrl}/blog`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${blog.slug}`,
    },
    keywords: blog.tags?.join(', ') || 'trading, forex, market analysis',
    articleBody: blog.content?.substring(0, 1000) || '',
  }
}
