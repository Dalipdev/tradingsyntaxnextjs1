// Google Analytics and Tracking Setup
// To use this, add your Google Analytics ID to your .env.local file
// NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-id-here

import Script from 'next/script'

export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

  if (!gaId) {
    return null
  }

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              send_page_view: true,
            });
          `,
        }}
      />
    </>
  )
}

// Bing UET Tracking
export function BingUetTracking() {
  const uetId = process.env.NEXT_PUBLIC_BING_UET_ID

  if (!uetId) {
    return null
  }

  return (
    <Script
      id="bing-uet"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(w,d){var s=d.createElement('script');s.async=true;s.src='//bat.bing.com/bat.js';var s2=d.getElementsByTagName('script')[0];s2.parentNode.insertBefore(s,s2);})(window,document);
          window.uetQueue = window.uetQueue || [];
          window.uetQueue.push("event", "${uetId}", {"event_category":"page_view"});
        `,
      }}
    />
  )
}

// Meta Pixel (Facebook)
export function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

  if (!pixelId) {
    return null
  }

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  )
}