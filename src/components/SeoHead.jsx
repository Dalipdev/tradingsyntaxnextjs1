// SEO Head Component with all necessary metadata
import { ORGANIZATION_SCHEMA, generateJsonLd } from '@/lib/seo-utils'

export default function SeoHead({
  title,
  description,
  image,
  url,
  type = 'website',
  author,
  publishedDate,
  modifiedDate,
  keywords,
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'
  const canonicalUrl = url || baseUrl

  const articleSchema = type === 'article' && publishedDate ? generateJsonLd('article', {
    title,
    description,
    image,
    url: canonicalUrl,
    publishedDate,
    modifiedDate,
    authorName: author,
    authorUrl: `${baseUrl}/user/${author}`,
  }) : null

  return (
    <>
      {/* Primary Meta Tags */}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords.join(', ')} />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="TradingSyntax" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      {image && <meta property="twitter:image" content={image} />}
      <meta property="twitter:creator" content="@tradingsyntax" />

      {/* Article specific */}
      {publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}
      {author && <meta property="article:author" content={author} />}

      {/* Additional SEO */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="TradingSyntax" />
      <meta name="copyright" content="© TradingSyntax. All rights reserved." />
      <meta name="language" content="English" />

      {/* Structured Data - JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
      />
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}

      {/* Favicon and Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />

      {/* Preconnect to external resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      <link rel="dns-prefetch" href="https://mfjbivbyugqqidonfkoa.supabase.co" />
    </>
  )
}