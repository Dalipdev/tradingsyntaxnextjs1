// Breadcrumb component for better SEO navigation
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Breadcrumbs() {
  const pathname = usePathname()

  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs = [
      { title: 'Home', path: '/' }
    ]

    let currentPath = ''
    paths.forEach((path, index) => {
      currentPath += `/${path}`
      const title = formatBreadcrumbTitle(path)
      breadcrumbs.push({
        title,
        path: currentPath,
        final: index === paths.length - 1
      })
    })

    return breadcrumbs
  }

  const formatBreadcrumbTitle = (path) => {
    return path
      .replace(/[-_]/g, ' ')
      .replace(/^\w/, char => char.toUpperCase())
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const breadcrumbs = generateBreadcrumbs()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.title,
      item: `https://tradingsyntax.com${crumb.path}`
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="flex flex-wrap gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-2">
              {crumb.final ? (
                <span className="text-gray-600 dark:text-gray-400">{crumb.title}</span>
              ) : (
                <>
                  <Link href={crumb.path} className="text-blue-600 hover:underline">
                    {crumb.title}
                  </Link>
                  <span className="text-gray-400">/</span>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}