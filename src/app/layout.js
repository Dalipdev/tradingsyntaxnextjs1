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

export const metadata = {
  title: 'TradingSyntax — Smart Money Concepts, Forex & Market Analysis',
  description:
    'Institutional-grade trading insights: smart money concepts, forex price action, crypto analysis, and market structure.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingsyntax.com'
  ),
}

// FIX: theme is now applied to BOTH <html> AND <body> before paint.
// Previously this only set data-theme on document.documentElement
// (<html>), but the dark-mode CSS override in BlogPageClient.js
// (and possibly other components) targets `body[data-theme="dark"]`.
// Since <body> never got the attribute on initial load, that CSS
// never matched until the theme toggle ran client-side and set it
// on both elements — which is why toggling "fixed" the fade.
const themeScript = `
(function() {
  try {
    var stored = sessionStorage.getItem('theme');
    var theme = stored === 'dark' || stored === 'light' ? stored : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        <BingUetTracking />
        <MetaPixel />
      </head>
      <body suppressHydrationWarning>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: themeScript
          }}
        />
        <Providers>
          <main className="site-main" id="main-content">
            {children}
          </main>
          <ConditionalFooter />
          <Navbar />
        </Providers>
      </body>
    </html>
  )
}