'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/app/HomeClientContent.module.css';

/* ─────────────────────────────────────────────
   SOCIAL LINKS
───────────────────────────────────────────── */
const SOCIAL_LINKS = [
  {
    id: 'twitter',
    label: 'X / Twitter',
    href: 'https://x.com/tradingsyntax',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/tradingsyntax/',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61590449082307',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
  },
  {
    id: 'reddit',
    label: 'Reddit',
    href: 'https://www.reddit.com/u/tradingsyntaxx/s/hUwnPxvBa7',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.35-4.24 3.71.79c.04.97.85 1.74 1.84 1.74 1.02 0 1.85-.83 1.85-1.85S20.4 2.62 19.38 2.62c-.83 0-1.53.55-1.77 1.3L13.5 3.1c-.26-.06-.52.09-.6.35l-1.54 4.83c-2.5.03-4.75.66-6.4 1.67A2.99 2.99 0 002.5 8.5c-1.65 0-3 1.35-3 3 0 1.22.75 2.27 1.8 2.71-.05.26-.09.52-.09.79 0 3.73 4.43 6.75 9.88 6.75 5.46 0 9.88-3.02 9.88-6.75 0-.27-.04-.53-.08-.78 1.04-.45 1.78-1.49 1.78-2.72zM6.5 13.5c0-1.02.83-1.85 1.85-1.85s1.85.83 1.85 1.85c0 1.02-.83 1.85-1.85 1.85S6.5 14.52 6.5 13.5zm9.56 3.9c-1.28 1.28-3.7 1.33-4.06 1.33s-2.78-.05-4.06-1.33c-.2-.2-.2-.51 0-.71.2-.2.51-.2.71 0 .97.97 2.71 1.02 3.35 1.02s2.38-.05 3.35-1.02c.2-.2.51-.2.71 0 .2.2.2.51 0 .71zm-1.01-2.05c-.1 0-.19-.01-.29-.04-.99-.25-1.5-.78-1.7-.98-.2-.2-.2-.51 0-.71.2-.2.51-.2.71 0 .09.09.47.41 1.23.6 1.03.26 1.52-.16 1.73-.39.2-.2.51-.17.71.03.2.2.17.51-.03.71-.24.23-.74.78-1.86.78zm1.61-1.35c-1.02 0-1.85-.83-1.85-1.85s.83-1.85 1.85-1.85 1.85.83 1.85 1.85-.83 1.85-1.85 1.85z" />
      </svg>
    ),
  },
  {
    id: 'telegram',
    label: 'Telegram',
    href: 'https://t.me/fxalerts777_bot',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://youtube.com/@tradingsyntax?si=b6W1BzP2B1YhAk2y',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/tradingsyntax?igsi=c3htNTA0ZmZieGgz',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    id: 'threads',
    label: 'Threads',
    href: 'https://www.threads.com/@tradingsyntax',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 11.5c-.1-.05-.2-.1-.3-.14-.18-3.28-1.98-5.16-4.99-5.18h-.04c-1.8 0-3.31.77-4.24 2.17l1.67 1.15c.7-1.05 1.79-1.28 2.57-1.28h.03c.98.01 1.72.29 2.2.83.35.4.58.94.7 1.63-.87-.15-1.82-.19-2.83-.13-2.85.17-4.68 1.79-4.56 4.03.06 1.14.63 2.12 1.6 2.77.82.55 1.88.82 2.98.76 1.45-.08 2.59-.64 3.38-1.66.6-.78.98-1.79 1.14-3.06.68.41 1.19.95 1.47 1.6.48 1.11.51 2.93-.98 4.41-1.31 1.31-2.88 1.87-5.25 1.89-2.63-.02-4.62-.87-5.92-2.53-1.22-1.56-1.85-3.8-1.87-6.66.02-2.86.65-5.1 1.87-6.66 1.3-1.66 3.29-2.51 5.92-2.53 2.65.02 4.68.88 6.02 2.55.66.82 1.15 1.83 1.47 2.99l1.85-.49c-.39-1.44-1-2.7-1.83-3.73C16.83 1.06 14.28 0 11.17 0h-.02C8.06.02 5.55 1.08 3.85 3.06 2.29 4.87 1.5 7.44 1.48 10.63v.02c.02 3.19.81 5.76 2.37 7.57 1.7 1.98 4.21 3.03 7.32 3.05h.02c2.84-.02 4.94-.75 6.62-2.42 2.19-2.19 2.13-4.94 1.4-6.63-.51-1.19-1.5-2.15-2.71-2.72zm-4.63 4.53c-1.09.06-2.24-.42-2.29-1.46-.04-.77.55-1.63 2.36-1.74.21-.01.41-.02.61-.02.66 0 1.28.06 1.85.19-.21 2.61-1.44 2.96-2.53 3.03z" />
      </svg>
    ),
  },
];

const TICKER_MARKETS = [
  { sym: 'EUR/USD', val: '1.0847',    chg: '+0.12%', up: true  },
  { sym: 'GBP/USD', val: '1.2731',    chg: '-0.08%', up: false },
  { sym: 'XAU/USD', val: '2,318.40',  chg: '+0.34%', up: true  },
  { sym: 'BTC/USD', val: '67,420.00', chg: '+1.82%', up: true  },
  { sym: 'S&P 500', val: '5,308.12',  chg: '+0.22%', up: true  },
  { sym: 'DJIA',    val: '39,114.00', chg: '-0.11%', up: false },
  { sym: 'NASDAQ',  val: '18,642.50', chg: '+0.41%', up: true  },
  { sym: 'USD/JPY', val: '156.32',    chg: '+0.19%', up: true  },
  { sym: 'WTI OIL', val: '79.42',     chg: '-0.66%', up: false },
  { sym: 'US 10Y',  val: '4.51%',     chg: '+0.03%', up: true  },
];

/* ─────────────────────────────────────────────
   TICKER BAR
───────────────────────────────────────────── */
function TickerBar() {
  return (
    <div className={styles.tickerWrap} aria-label="Live Market Feeds" role="region">
      <div className={styles.tickerLabel}>
        <span className={styles.tickerDot} />
        <span>Live</span>
      </div>
      <div className={styles.tickerTrack}>
        <div className={styles.tickerInner}>
          {[...TICKER_MARKETS, ...TICKER_MARKETS].map((t, i) => (
            <div key={i} className={styles.tickerItem}>
              <span className={styles.tickerSym}>{t.sym}</span>
              <span className={styles.tickerVal}>{t.val}</span>
              <span className={t.up ? styles.tickUp : styles.tickDn}>
                {t.up ? '▲' : '▼'} {t.chg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SOCIAL BAR
───────────────────────────────────────────── */
function SocialBar() {
  return (
    <div className={styles.socialBar}>
      <div className={styles.socialIcons}>
        <span className={styles.socialLabel}>Follow</span>
        <span className={styles.socialDivider} />
        {SOCIAL_LINKS.map((s) => (
          <a
            key={s.id}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialIcon}
            aria-label={s.label}
            title={s.label}
          >
            {s.icon}
          </a>
        ))}
      </div>

      <a
        href="https://search.google.com/search-console/about"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.trendBtn}
        aria-label="Add TradingSyntax to Google"
        title="Add TradingSyntax to Google"
      >
        <span className={styles.trendBtnDot} />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className={styles.trendBtnLabel}>Add on Google</span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </a>
    </div>
  );
}

export default function Masthead({ variant = 'home', showTicker = true }) {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    );
  }, []);

  const rootClass = variant === 'blog' ? styles.mastheadRoot : styles.masthead;

  return (
    <header className={rootClass} role="banner">
      {/* Top ribbon — date + edition */}
      <div className={styles.mastheadRibbon}>
        <span suppressHydrationWarning>{dateStr}</span>
        <span className={styles.mastheadEdition}>Global Institutional Edition</span>
      </div>

      {/* Logo block */}
      <div className={styles.mastheadBody}>
        <div className={styles.mastheadMetaLine}>
          <span className={styles.mastheadMetaDash} />
          Journal of Financial Market Structure
          <span className={styles.mastheadMetaDash} />
        </div>
        <Link href="/" className={styles.mastheadLogoLink}>
          <h1 className={styles.mastheadTitle}>TradingSyntax</h1>
        </Link>
        <p className={styles.mastheadTagline}>
          Quantitative Architecture &middot; Macro Portfolio Analysis &middot; Institutional Intelligence
        </p>
      </div>

      {showTicker && <TickerBar />}

      {/* Social bar */}
      <SocialBar />
    </header>
  );
}

export { Masthead };