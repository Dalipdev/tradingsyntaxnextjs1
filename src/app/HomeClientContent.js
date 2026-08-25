'use client';

import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './HomeClientContent.module.css';
import AnimationWrapper from '@/lib/page-animation';
import LoadMoreDataBtn from '@/components/load-more.component';
import Loader from '@/components/loader.component';
import NoDataMessage from '@/components/nodata.component';
import NewsletterWidget from '@/components/Newsletterwidget';
import Masthead from '@/components/Masthead';

// ─── Lazy-load error fallback ─────────────────────────────────────────────
// FIX: both lazy components below previously caught a failed dynamic
// import() and returned `{ default: () => null }` — meaning any load
// failure (slow/unstable connection, dev-server chunk hiccup over a
// LAN IP, transient network blip) rendered as *nothing at all*: no
// error, no retry, just missing content with no way to tell the user
// even knew something failed. That's indistinguishable from "it's just
// slow" or "it's broken", which is exactly the confusing symptom of a
// component silently not appearing on some networks/devices. This
// fallback surfaces a real, visible message plus a retry action instead.
function LazyLoadError({ label, onRetry }) {
  return (
    <div
      style={{
        padding: '32px 20px',
        textAlign: 'center',
        border: '1px dashed var(--color-border-strong)',
        borderRadius: 4,
        color: 'var(--color-text-faint)',
        fontSize: 13,
        fontFamily: 'var(--font-body, inherit)',
      }}
    >
      <p style={{ margin: '0 0 10px' }}>
        {label} couldn&rsquo;t load. This usually means a slow or unstable connection.
      </p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: '8px 18px',
          borderRadius: 999,
          border: '1px solid var(--color-accent)',
          background: 'transparent',
          color: 'var(--color-accent)',
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}

// ─── Lazy imports ─────────────────────────────────────────────────────────────
const COTReport = lazy(() =>
  import('./COTReport').catch(e => {
    console.error('[COTReport] Failed to load:', e);
    return {
      default: () => (
        <LazyLoadError
          label="Commitment of Traders report"
          onRetry={() => window.location.reload()}
        />
      ),
    };
  })
);

// ─── Module-level cache ─────────────────────────────────────────────────────
let trendingBlogsCache     = null;
let trendingBlogsCacheTime = 0;
const TRENDING_CACHE_DURATION = 5 * 60 * 1000;
const FETCH_TIMEOUT           = 30_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatData(data, currentPage = 1) {
  if (!data) return { results: [], page: 1, totalDocs: 0 };
  if (data.results && Array.isArray(data.results))
    return { results: data.results, page: data.page || currentPage, totalDocs: data.totalDocs ?? 0 };
  if (data.blogs && Array.isArray(data.blogs))
    return { results: data.blogs, page: data.page || currentPage, totalDocs: data.totalDocs ?? 0 };
  if (Array.isArray(data))
    return { results: data, page: 1, totalDocs: data.length };
  return { results: [], page: 1, totalDocs: 0 };
}

async function fetchJson(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    if (err.name !== 'AbortError') console.error('[fetch] Error:', url, err.message);
    return null;
  }
}

function extractList(data) {
  if (!data) return null;
  if (Array.isArray(data))               return data;
  if (Array.isArray(data.blogs))         return data.blogs;
  if (Array.isArray(data.results))       return data.results;
  if (Array.isArray(data.data))          return data.data;
  if (Array.isArray(data.data?.blogs))   return data.data.blogs;
  if (Array.isArray(data.data?.results)) return data.data.results;
  return null;
}

// ─── Static data ──────────────────────────────────────────────────────────────
const CATEGORY_META = {
  'institutional-trading': { label: 'Institutional Flow',  section: 'Markets' },
  'price-action':          { label: 'Price Action',        section: 'Technical Analysis' },
  'stocks':                { label: 'Macro Equities',      section: 'Global Markets' },
  'smart-trading-tools':   { label: 'Quantitative Tools',  section: 'Financial Tech' },
  'forex':                 { label: 'Foreign Exchange',    section: 'Currencies' },
  'Ai-in-finance':         { label: 'Algorithmic Systems', section: 'Innovation' },
  'crypto':                { label: 'Digital Assets',      section: 'Decentralized Finance' },
  'trading-strategy':      { label: 'Risk Architecture',   section: 'Editorial & Opinion' },
  'scripts':               { label: 'Pine-Scripts',        section: 'Pine-Scripts & Strategies' },
};

// ─── Economic Calendar data ─────────────────────────────────────────────────
const CONFIRMED_ECONOMIC_EVENTS = [
  { date: '2026-07-28', label: 'FOMC Meeting (Day 1)',        tag: 'high',   region: 'US' },
  { date: '2026-07-29', label: 'FOMC Rate Decision',           tag: 'high',   region: 'US' },
  { date: '2026-08-07', label: 'Employment Situation (NFP)',   tag: 'high',   region: 'US' },
  { date: '2026-08-12', label: 'Consumer Price Index (CPI)',   tag: 'high',   region: 'US' },
  { date: '2026-08-13', label: 'Producer Price Index (PPI)',   tag: 'medium', region: 'US' },
  { date: '2026-09-04', label: 'Employment Situation (NFP)',   tag: 'high',   region: 'US' },
  { date: '2026-09-10', label: 'Producer Price Index (PPI)',   tag: 'medium', region: 'US' },
  { date: '2026-09-11', label: 'Consumer Price Index (CPI)',   tag: 'high',   region: 'US' },
  { date: '2026-09-15', label: 'FOMC Meeting (Day 1)',         tag: 'high',   region: 'US' },
  { date: '2026-09-16', label: 'FOMC Rate Decision + SEP',     tag: 'high',   region: 'US' },
  { date: '2026-10-02', label: 'Employment Situation (NFP)',   tag: 'high',   region: 'US' },
  { date: '2026-10-14', label: 'Consumer Price Index (CPI)',   tag: 'high',   region: 'US' },
  { date: '2026-10-15', label: 'Producer Price Index (PPI)',   tag: 'medium', region: 'US' },
  { date: '2026-10-27', label: 'FOMC Meeting (Day 1)',         tag: 'high',   region: 'US' },
  { date: '2026-10-28', label: 'FOMC Rate Decision',           tag: 'high',   region: 'US' },
  { date: '2026-11-06', label: 'Employment Situation (NFP)',   tag: 'high',   region: 'US' },
  { date: '2026-11-10', label: 'Consumer Price Index (CPI)',   tag: 'high',   region: 'US' },
  { date: '2026-11-13', label: 'Producer Price Index (PPI)',   tag: 'medium', region: 'US' },
  { date: '2026-12-04', label: 'Employment Situation (NFP)',   tag: 'high',   region: 'US' },
  { date: '2026-12-08', label: 'FOMC Meeting (Day 1)',         tag: 'high',   region: 'US' },
  { date: '2026-12-09', label: 'FOMC Rate Decision + SEP',     tag: 'high',   region: 'US' },
  { date: '2026-12-10', label: 'Consumer Price Index (CPI)',   tag: 'high',   region: 'US' },
  { date: '2026-12-15', label: 'Producer Price Index (PPI)',   tag: 'medium', region: 'US' },
];

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function firstWeekdayOfMonth(year, month, weekday) {
  const d = new Date(Date.UTC(year, month, 1));
  const diff = (weekday - d.getUTCDay() + 7) % 7;
  d.setUTCDate(1 + diff);
  return d;
}

function nthWeekdayOfMonth(year, month, weekday, n) {
  const d = firstWeekdayOfMonth(year, month, weekday);
  d.setUTCDate(d.getUTCDate() + (n - 1) * 7);
  return d;
}

function generateEstimatedEvents(monthsAhead = 12) {
  const events = [];
  const now = new Date();
  const startYear = now.getUTCFullYear();
  const startMonth = now.getUTCMonth();

  for (let m = 0; m <= monthsAhead; m++) {
    const year = startYear + Math.floor((startMonth + m) / 12);
    const month = (startMonth + m) % 12;

    events.push({
      date: toISODate(firstWeekdayOfMonth(year, month, 5)),
      label: 'Employment Situation (NFP)',
      tag: 'high',
      region: 'US',
      estimated: true,
    });
    events.push({
      date: toISODate(nthWeekdayOfMonth(year, month, 3, 2)),
      label: 'Consumer Price Index (CPI)',
      tag: 'high',
      region: 'US',
      estimated: true,
    });
    events.push({
      date: toISODate(nthWeekdayOfMonth(year, month, 4, 2)),
      label: 'Producer Price Index (PPI)',
      tag: 'medium',
      region: 'US',
      estimated: true,
    });
  }
  return events;
}

function formatEventDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return {
    day:   d.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'UTC' }),
    month: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
    full:  d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }),
  };
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00Z');
  const today  = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return Math.round((target - todayUTC) / 86_400_000);
}

const MARKET_STRIP = [
  { label: 'S&P 500',   val: '5,308', sub: '+11.6 pts', chg: '+0.22%', up: true  },
  { label: 'US 10Y',    val: '4.51%', sub: 'Yield',     chg: '+0.03%', up: true  },
  { label: 'DXY Index', val: '104.62',sub: '',           chg: '-0.14%', up: false },
  { label: 'Gold (XAU)',val: '2,318', sub: 'USD/oz',    chg: '+0.34%', up: true  },
  { label: 'BTC / USD', val: '67,420',sub: '',           chg: '+1.82%', up: true  },
  { label: 'VIX',       val: '13.42', sub: 'Low Regime', chg: '-0.80%', up: false },
];

// ─── Blog field resolvers ─────────────────────────────────────────────────────
function resolveBlogItem(blog) { return blog?.blog || blog || {}; }

function getAuthorName(blog) {
  const item = resolveBlogItem(blog);
  return item?.author?.personal_info?.fullname
    || item?.author?.personal_info?.username
    || 'TradingSyntax Editorial';
}

function getBlogTag(blog) {
  const item = resolveBlogItem(blog);
  return item?.tags?.[0] || item?.topic || '';
}

function getBlogBanner(blog) {
  const item = resolveBlogItem(blog);
  const raw = item?.banner ?? item?.bannerUrl ?? item?.image ?? null;
  const url = typeof raw === 'string' ? raw.trim() : (raw?.url ? String(raw.url).trim() : '');
  if (!url) return null;
  const isUsable = /^https?:\/\//i.test(url) || url.startsWith('/');
  if (!isUsable) {
    console.warn('[ArticleCard] Ignoring non-absolute banner URL:', url);
    return null;
  }
  return url;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
  } catch { return ''; }
}

function getReadTime(blog) {
  const words = blog?.content?.blocks?.reduce(
    (acc, b) => acc + (b?.data?.text?.split(' ')?.length || 0), 0
  ) || 0;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function getBlogUrl(blog) {
  const item = blog?.blog || blog;
  if (!item) return '#';
  return item.blog_id ? `/blog/${item.blog_id}`
    : item._id        ? `/blog/${item._id}`
    : item.id         ? `/blog/${item.id}`
    : '#';
}

// ─── MarketStrip ──────────────────────────────────────────────────────────────
function MarketStrip() {
  return (
    <div className={styles.marketStrip} role="region" aria-label="Market snapshot">
      {MARKET_STRIP.map((m) => (
        <div key={m.label} className={styles.stripItem}>
          <div className={styles.stripLabel}>{m.label}</div>
          <div className={styles.stripValue}>{m.val}</div>
          <div className={styles.stripMeta}>
            <span className={m.up ? styles.stripUp : styles.stripDn}>
              {m.up ? '▲' : '▼'} {m.chg}
            </span>
            {m.sub && <span className={styles.stripSub}>&nbsp;{m.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SectionNav ───────────────────────────────────────────────────────────────
function SectionNav({ pageState, categories, onSelect }) {
  return (
    <nav className={styles.sectionNav} aria-label="Editorial Sections">
      <div className={styles.sectionNavInner}>
        <button
          suppressHydrationWarning
          className={`${styles.navTab} ${pageState === 'home' ? styles.navTabActive : ''}`}
          onClick={() => onSelect('home')}
        >
          Latest
        </button>
        {categories.map(cat => (
          <button
            suppressHydrationWarning
            key={cat}
            className={`${styles.navTab} ${pageState === cat ? styles.navTabActive : ''}`}
            onClick={() => onSelect(cat)}
          >
            {CATEGORY_META[cat]?.label || cat}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── ArticleCard ──────────────────────────────────────────────────────────────
// By design, only the first three articles (the lead hero + the two
// secondary cards) carry imagery. Everything from index 3 onward renders
// as a text-only "ledger" row — see .articleCompact* in the stylesheet.
// This keeps exactly three images on screen at once instead of a wall of
// small, competing thumbnails.
function ArticleCard({ blog, index }) {
  const isLead      = index === 0;
  const isSecondary = index === 1 || index === 2;
  const tag         = getBlogTag(blog);
  const author      = getAuthorName(blog);
  const date        = formatDate(blog?.publishedAt || blog?.createdAt);
  const readTime    = getReadTime(blog);
  const href        = getBlogUrl(blog);
  const imgSrc      = getBlogBanner(blog);
  const section     = CATEGORY_META[tag]?.section || 'Executive Briefing';
  const catLabel    = CATEGORY_META[tag]?.label || tag;

  const [imgFailed, setImgFailed] = useState(false);
  const showImage = (isLead || isSecondary) && imgSrc && !imgFailed;

  if (isLead) {
    return (
      <AnimationWrapper transition={{ duration: 0.2, delay: 0 }}>
        <article className={styles.articleLead}>
          <Link href={href} className={styles.articleLeadLink}>
            <div className={styles.articleLeadContent}>
              <div className={styles.articleEyebrow}>
                <span className={styles.articleSectionTag}>{section}</span>
                {catLabel && (
                  <>
                    <span className={styles.eyebrowSep}>·</span>
                    <span className={styles.articleCategoryLabel}>{catLabel}</span>
                  </>
                )}
              </div>
              <h2 className={styles.articleLeadTitle}>{blog?.title || 'Untitled Report'}</h2>
              {blog?.des && <p className={styles.articleLeadDeck}>{blog.des}</p>}
              <div className={styles.bylineRow}>
                <span className={styles.bylineAuthor}>By {author}</span>
                <span className={styles.bylineSep}>·</span>
                <time suppressHydrationWarning dateTime={blog?.publishedAt || blog?.createdAt}>{date}</time>
                <span className={styles.bylineSep}>·</span>
                <span>{readTime}</span>
              </div>
            </div>
            <div className={styles.articleLeadImageWrap}>
              {showImage ? (
                <Image
                  src={imgSrc}
                  alt={blog?.title || 'Lead article image'}
                  fill
                  priority
                  unoptimized
                  className={styles.articleImg}
                  sizes="(max-width: 640px) 100vw, 40vw"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className={styles.articleImgPlaceholder} />
              )}
            </div>
          </Link>
        </article>
      </AnimationWrapper>
    );
  }

  if (isSecondary) {
    return (
      <AnimationWrapper transition={{ duration: 0.2, delay: index * 0.05 }}>
        <article className={styles.articleSecondary}>
          <Link href={href} className={styles.articleSecondaryLink}>
            <div className={styles.articleThumbWrap}>
              {showImage ? (
                <Image
                  src={imgSrc}
                  alt={blog?.title || 'Article thumbnail'}
                  fill
                  unoptimized
                  priority={index === 1}
                  className={styles.articleImg}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className={styles.articleImgPlaceholder} />
              )}
            </div>
            <div className={styles.articleSecondaryContent}>
              <div className={styles.articleEyebrow}>
                <span className={styles.articleSectionTag}>{section}</span>
                {catLabel && (
                  <>
                    <span className={styles.eyebrowSep}>·</span>
                    <span className={styles.articleCategoryLabel}>{catLabel}</span>
                  </>
                )}
              </div>
              <h2 className={styles.articleSecondaryTitle}>{blog?.title || 'Untitled Report'}</h2>
              {blog?.des && <p className={styles.articleSecondaryDeck}>{blog.des}</p>}
              <div className={styles.bylineRow}>
                <span className={styles.bylineAuthor}>By {author}</span>
                <span className={styles.bylineSep}>·</span>
                <time suppressHydrationWarning dateTime={blog?.publishedAt || blog?.createdAt}>{date}</time>
                <span className={styles.bylineSep}>·</span>
                <span>{readTime}</span>
              </div>
            </div>
          </Link>
        </article>
      </AnimationWrapper>
    );
  }

  // ── Ledger row (index 3+) — text only, no image ──────────────────────
  return (
    <AnimationWrapper transition={{ duration: 0.2, delay: 0 }}>
      <article className={styles.articleCompact}>
        <Link href={href} className={styles.articleCompactLink}>
          <div className={styles.articleCompactMeta}>
            <span className={styles.articleSectionTag}>{section}</span>
          </div>
          <div className={styles.articleCompactBody}>
            <h2 className={styles.articleCompactTitle}>{blog?.title || 'Untitled Report'}</h2>
            <div className={styles.bylineRow}>
              <span className={styles.bylineAuthor}>By {author}</span>
              <span className={styles.bylineSep}>·</span>
              <time suppressHydrationWarning dateTime={blog?.publishedAt || blog?.createdAt}>{date}</time>
            </div>
          </div>
        </Link>
      </article>
    </AnimationWrapper>
  );
}

// ─── MinimalArticle ───────────────────────────────────────────────────────────
function MinimalArticle({ blog, index }) {
  const item    = blog?.blog || blog;
  const tag     = getBlogTag(item);
  const author  = getAuthorName(item);
  const href    = getBlogUrl(item);
  const title   = item?.title || item?.headline || item?.name || 'Market Update';
  const section = CATEGORY_META[tag]?.section || 'Analysis';

  return (
    <div className={styles.trendItem}>
      <span className={styles.trendNum}>{String(index + 1).padStart(2, '0')}</span>
      <div className={styles.trendContent}>
        <Link href={href} className={styles.trendLink}>
          <span className={styles.trendTag}>{section}</span>
          <h4 className={styles.trendTitle}>{title}</h4>
          <span className={styles.trendAuthor}>By {author}</span>
        </Link>
      </div>
    </div>
  );
}

// ─── SidebarMarketsWidget → Economic Calendar ──────────────────────────────
function SidebarMarketsWidget() {
  const upcoming = useMemo(() => {
    const confirmedKeys = new Set(
      CONFIRMED_ECONOMIC_EVENTS.map(ev => `${ev.date.slice(0, 7)}:${ev.label}`)
    );
    const estimated = generateEstimatedEvents(12).filter(
      ev => !confirmedKeys.has(`${ev.date.slice(0, 7)}:${ev.label}`)
    );
    return [...CONFIRMED_ECONOMIC_EVENTS, ...estimated]
      .map(ev => ({ ...ev, daysAway: daysUntil(ev.date) }))
      .filter(ev => ev.daysAway >= 0)
      .sort((a, b) => a.daysAway - b.daysAway)
      .slice(0, 8);
  }, []);

  // FIX: 'medium' previously fell back to var(--brass, #C9A227). Since
  // --brass is now a near-white monochrome token (not the old gold), the
  // CSS var resolves and the fallback #C9A227 never gets a chance to
  // apply — so the "medium priority" dot rendered near-invisible on the
  // light sidebar. Using a plain hex value here keeps it visible and
  // theme-independent, since it's a semantic status color rather than a
  // brand accent that should follow light/dark mode.
  const tagColor = (tag) =>
    tag === 'high'   ? 'var(--color-market-down, #E24B4A)'
  : tag === 'medium' ? '#C9A227'
  : 'var(--color-text-secondary)';

  return (
    <section className={styles.sidebarWidget} aria-labelledby="sidebar-market-heading">
      <div className={styles.widgetHeaderRow}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className={styles.widgetEyebrow}>Macro Calendar</span>
          <h3 id="sidebar-market-heading" className={styles.widgetTitle}>Economic Calendar</h3>
        </div>
      </div>

      <div
        aria-live="off"
        style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}
      >
        {upcoming.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '8px 0' }}>
            No upcoming events on the calendar.
          </p>
        ) : (
          upcoming.map((ev, i) => {
            const { day, month } = formatEventDate(ev.date);
            const isToday = ev.daysAway === 0;
            return (
              <div
                key={ev.date + ev.label + i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 0',
                  borderBottom: i < upcoming.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
                }}
              >
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  minWidth: 34, lineHeight: 1.1,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {day}
                  </span>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: 0.4 }}>
                    {month}
                  </span>
                </div>

                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: tagColor(ev.tag),
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12.5, color: 'var(--color-text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {ev.label}{ev.estimated ? ' (Est.)' : ''}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                    {isToday ? 'Today' : ev.daysAway === 1 ? 'Tomorrow' : `In ${ev.daysAway} days`} · {ev.region}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 10, textAlign: 'right' }}>
        Fed &amp; BLS release calendar
      </p>
    </section>
  );
}

// ─── Parse helpers ──────────────────────────────────────────
function parseBlogs(initialBlogs) {
  if (!initialBlogs) return { results: [], page: 1, totalDocs: 0 };
  if (initialBlogs.results && Array.isArray(initialBlogs.results)) return initialBlogs;
  if (initialBlogs.blogs && Array.isArray(initialBlogs.blogs))
    return { results: initialBlogs.blogs, page: initialBlogs.page || 1, totalDocs: initialBlogs.totalDocs ?? initialBlogs.blogs.length };
  if (Array.isArray(initialBlogs))
    return { results: initialBlogs, page: 1, totalDocs: initialBlogs.length };
  return { results: [], page: 1, totalDocs: 0 };
}

function parseTrending(initialTrending) {
  if (!initialTrending) return [];
  const list = extractList(initialTrending);
  return list || [];
}

function DeferredVisible({ children, rootMargin = '200px' }) {
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return;

    const node = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return <div ref={ref}>{shouldRender ? children : null}</div>;
}

// ─── HomeClientContent ────────────────────────────────────────────────────────
export default function HomeClientContent({ initialBlogs, initialTrending, serverReady = false }) {
  const parsedBlogs    = useMemo(() => parseBlogs(initialBlogs),       []);  // eslint-disable-line
  const parsedTrending = useMemo(() => parseTrending(initialTrending), []);  // eslint-disable-line
  const hasInitialData = parsedBlogs.results.length > 0;

  const [blogs,             setBlogs]             = useState(parsedBlogs);
  const [trendingBlogs,     setTrendingBlogs]     = useState(
    trendingBlogsCache ?? parsedTrending
  );
  const [pageState,         setPageState]         = useState('home');
  const [isMounted,         setIsMounted]         = useState(false);
  const [isLoading,         setIsLoading]         = useState(!hasInitialData);

  const [isTrendingLoading, setIsTrendingLoading] = useState(
    parsedTrending.length === 0 && !trendingBlogsCache
  );

  const feedRef    = useRef(null);
  const categories = useMemo(() => Object.keys(CATEGORY_META), []);
  const SERVER     = process.env.NEXT_PUBLIC_SERVER_DOMAIN;

  const fetchLatestBlogs = useCallback(async ({ page = 1 }) => {
    if (!SERVER) { setIsLoading(false); return; }
    if (page === 1) setIsLoading(true);
    const data = await fetchJson(
      `${SERVER}/latest-blogs`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page }) }
    );
    if (!data) { if (page === 1) setIsLoading(false); return; }
    const fmt = formatData(data, page);
    setBlogs(prev => ({
      results:   page === 1 ? fmt.results : [...(prev?.results || []), ...fmt.results],
      page,
      totalDocs: fmt.totalDocs,
    }));
    if (page === 1) setIsLoading(false);
  }, [SERVER]);

  const fetchBlogsByCategory = useCallback(async ({ page = 1 }) => {
    if (!SERVER) { setIsLoading(false); return; }
    if (page === 1) setIsLoading(true);
    const data = await fetchJson(
      `${SERVER}/search-blogs`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag: pageState, page }) }
    );
    if (!data) { if (page === 1) setIsLoading(false); return; }
    const fmt = formatData(data, page);
    setBlogs(prev => ({
      results:   page === 1 ? fmt.results : [...(prev?.results || []), ...fmt.results],
      page,
      totalDocs: fmt.totalDocs,
    }));
    if (page === 1) setIsLoading(false);
  }, [SERVER, pageState]);

  const fetchTrendingBlogs = useCallback(async () => {
    const now = Date.now();
    if (trendingBlogsCache && (now - trendingBlogsCacheTime) < TRENDING_CACHE_DURATION) {
      setTrendingBlogs(trendingBlogsCache);
      setIsTrendingLoading(false);
      return;
    }
    if (parsedTrending.length > 0) {
      setIsTrendingLoading(false);
      if (!SERVER) return;
      const data = await fetchJson(`${SERVER}/trending-blogs`);
      const list = extractList(data);
      if (list?.length) {
        trendingBlogsCache     = list;
        trendingBlogsCacheTime = now;
        setTrendingBlogs(list);
      }
      return;
    }
    setIsTrendingLoading(true);
    if (!SERVER) { setIsTrendingLoading(false); return; }
    const data = await fetchJson(`${SERVER}/trending-blogs`);
    const list = extractList(data);
    if (list?.length) {
      trendingBlogsCache     = list;
      trendingBlogsCacheTime = Date.now();
      setTrendingBlogs(list);
    }
    setIsTrendingLoading(false);
  }, [SERVER, parsedTrending.length]);

  useEffect(() => {
    setIsMounted(true);
    const needsBlogs    = !hasInitialData || !serverReady;
    const needsTrending = parsedTrending.length === 0 || !trendingBlogsCache ||
                          (Date.now() - trendingBlogsCacheTime) >= TRENDING_CACHE_DURATION;
    const tasks = [];
    if (needsBlogs)    tasks.push(fetchLatestBlogs({ page: 1 }));
    if (needsTrending) tasks.push(fetchTrendingBlogs());
    if (tasks.length) Promise.all(tasks);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!isMounted) return;
    setIsLoading(true);
    if (pageState === 'home') fetchLatestBlogs({ page: 1 });
    else fetchBlogsByCategory({ page: 1 });
  }, [pageState]); // eslint-disable-line

  const handleCategorySelect = useCallback((cat) => {
    setPageState(prev => prev === cat ? 'home' : cat);
  }, []);

  const handleNewsletterSubmit = useCallback(async (email) => {
    if (!SERVER) throw new Error('Subscription service is unavailable right now.');
    const res = await fetchJson(`${SERVER}/newsletter-subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res) throw new Error('Could not subscribe right now. Please try again.');
  }, [SERVER]);

  const currentLabel = pageState === 'home'
    ? 'Latest Briefings'
    : CATEGORY_META[pageState]?.label || pageState.replace(/-/g, ' ');

  const leadBlog        = blogs?.results?.[0] || null;
  const secondaryBlogs   = blogs?.results?.slice(1, 3) || [];
  const compactBlogs     = blogs?.results?.slice(3)    || [];

  return (
    <div className={styles.editorialOuter}>
      <Masthead variant="home" />
      <MarketStrip />
      <SectionNav pageState={pageState} categories={categories} onSelect={handleCategorySelect} />

      <div className={styles.pageBody} ref={feedRef}>
        <main className={styles.mainFeed} role="main" id="main-content">
          <div className={styles.feedHeader}>
            <h2 className={styles.feedTitle}>{currentLabel}</h2>
            <span className={styles.feedMeta}>
              {pageState !== 'home' ? (
                <button
                  suppressHydrationWarning
                  onClick={() => setPageState('home')}
                  className={styles.backBtn}
                  aria-label="Return to latest news index"
                >
                  ← View All Briefings
                </button>
              ) : (
                <span className={styles.feedMetaLive}>
                  <span className={styles.liveDot} />
                  Institutional Research Desk · Updated continuously
                </span>
              )}
            </span>
          </div>

          <div aria-live="polite" aria-busy={isLoading}>
            {isLoading ? (
              <div className={styles.loaderWrap}><Loader /></div>
            ) : blogs?.results?.length ? (
              <>
                {leadBlog && (
                  <ArticleCard
                    key={leadBlog._id || leadBlog.blog_id || 'lead'}
                    blog={leadBlog}
                    index={0}
                  />
                )}

                {secondaryBlogs.length > 0 && (
                  <div className={styles.secondaryGrid}>
                    {secondaryBlogs.map((blog, i) => (
                      <ArticleCard
                        key={blog._id || blog.blog_id || i + 1}
                        blog={blog}
                        index={i + 1}
                      />
                    ))}
                  </div>
                )}

                {compactBlogs.length > 0 && (
                  <div className={styles.compactGrid}>
                    {compactBlogs.map((blog, i) => (
                      <ArticleCard key={blog._id || blog.blog_id || i} blog={blog} index={i + 3} />
                    ))}
                  </div>
                )}
                <div className={styles.loadMoreWrap}>
                  <LoadMoreDataBtn
                    state={blogs}
                    fetchDataFun={pageState === 'home' ? fetchLatestBlogs : fetchBlogsByCategory}
                  />
                </div>
              </>
            ) : (
              <NoDataMessage message="System context update empty. No analytical entries found." />
            )}
          </div>
        </main>

        <NewsletterWidget
          headingId="mobile-news-heading"
          className={styles.mobileNewsletter}
          onSubmit={handleNewsletterSubmit}
        />

        <aside className={styles.sidebar} aria-label="Analytical Sidebar">
          <SidebarMarketsWidget />
          <hr className={styles.editorialRule} />

          <section aria-labelledby="trending-heading" className={styles.sidebarWidget}>
            <div className={styles.widgetHeader}>
              <span className={styles.widgetEyebrow}>Most Circulated</span>
              <h3 id="trending-heading" className={styles.widgetTitle}>Trending Intelligence</h3>
            </div>
            <div aria-live="polite" aria-busy={isTrendingLoading}>
              {isTrendingLoading ? (
                <Loader />
              ) : trendingBlogs?.length ? (
                trendingBlogs.map((blog, i) => (
                  <MinimalArticle key={blog._id || blog.blog_id || i} blog={blog} index={i} />
                ))
              ) : (
                <NoDataMessage message="No active historical distribution records." />
              )}
            </div>
          </section>

          <hr className={styles.editorialRule} />
          <NewsletterWidget
            headingId="sidebar-news-heading"
            className={styles.desktopNewsletter}
            onSubmit={handleNewsletterSubmit}
          />
        </aside>
      </div>

      <div className={styles.cotFullWidthRow}>
        <DeferredVisible rootMargin="300px">
          <Suspense fallback={<Loader />}>
            <COTReport />
          </Suspense>
        </DeferredVisible>
      </div>
    </div>
  );
}