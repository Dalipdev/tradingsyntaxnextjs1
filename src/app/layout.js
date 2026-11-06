
import Script from 'next/script'
import Providers from '@/components/Providers'
import {
  GoogleAnalytics,
  BingUetTracking,
  MetaPixel
} from '@/components/Analytics'
import Navbar from '@/components/navbar.component'
import ConditionalFooter from '@/components/ConditionalFooter'
import './globals.css'

// ==========================================
// WEBSITE METADATA
// ==========================================

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'

export const metadata = {
  metadataBase: new URL(SITE_URL),

  applicationName: 'TradingSyntax',

  title: {
    default: 'TradingSyntax — Smart Money Concepts, Forex & Market Analysis',
    template: '%s | TradingSyntax'
  },

  description:
    'Institutional-grade trading insights: smart money concepts, forex price action, crypto analysis, and market structure.',

  alternates: {
    canonical: '/'
  },

  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'TradingSyntax',
    title:
      'TradingSyntax — Smart Money Concepts, Forex & Market Analysis',
    description:
      'Institutional-grade trading insights: smart money concepts, forex price action, crypto analysis, and market structure.',
    locale: 'en_US'
  },

  twitter: {
    card: 'summary_large_image',
    title:
      'TradingSyntax — Smart Money Concepts, Forex & Market Analysis',
    description:
      'Institutional-grade trading insights: smart money concepts, forex price action, crypto analysis, and market structure.'
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  }
}

// ==========================================
// GOOGLE WEBSITE STRUCTURED DATA
// ==========================================

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TradingSyntax',
  alternateName: [
    'Trading Syntax',
    'TradingSyntax.com'
  ],
  url: 'https://tradingsyntax.com/'
}

// ==========================================
// THEME INITIALIZATION
// ==========================================

const themeScript = `
(function() {
  try {
    var stored = sessionStorage.getItem('theme');

    var theme =
      stored === 'dark' || stored === 'light'
        ? stored
        : (
            window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
          );

    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

  } catch (e) {}
})();
`

// ==========================================
// ROOT LAYOUT
// ==========================================

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>

      <head>
        {/* Google Analytics */}
        <GoogleAnalytics />

        {/* Bing Webmaster Tracking */}
        <BingUetTracking />

        {/* Meta Pixel */}
        <MetaPixel />

        {/* Google Site Name Schema */}
        <script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema)
          }}
        />
      </head>

      <body suppressHydrationWarning>

        {/* Theme Script */}
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: themeScript
          }}
        />

        <Providers>

          <main
            className="site-main"
            id="main-content"
          >
            {children}
          </main>

          <ConditionalFooter />

          <Navbar />

        </Providers>

      </body>
    </html>
  )
}
