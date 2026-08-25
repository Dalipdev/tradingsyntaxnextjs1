"use client";
// app/blog/[blog_id]/BlogPageClient.js

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import AnimationWrapper from "@/lib/page-animation";
import Link from "next/link";
import Image from "next/image";
import { getDay } from "@/lib/date";
import { BlogContext } from "@/lib/blog-context";
import BlogInteraction from "@/components/blog-interaction.component";
import BlogContent from "@/components/blog-content.component";
import NewsletterWidget from "@/components/Newsletterwidget";
import { subscribeToNewsletter } from "@/lib/newsletter";
import CommentContainer from "@/components/comments.component";
import Masthead from "@/components/Masthead";

const REFRESH_TIMEOUT = 10000;
const WORDS_PER_MINUTE = 200;

const normalizeBlogContent = (content) => {
  if (content == null) return null;
  if (typeof content === "string") {
    try { content = JSON.parse(content); } catch { return null; }
  }
  if (Array.isArray(content)) return content[0] || null;
  if (typeof content === "object" && Array.isArray(content.blocks)) return content;
  return null;
};

const estimateReadingTime = (blocks) => {
  const text = blocks
    .map((b) => b?.data?.text || b?.data?.caption || "")
    .join(" ")
    .replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};

/* Inline icons — thin, precise, no icon package needed */
const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);
const DiamondDivider = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M5 0L10 5L5 10L0 5Z" fill="currentColor" />
  </svg>
);

function DeferredVisible({ children, rootMargin = "300px" }) {
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || typeof window === "undefined") return;

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

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function BlogPageClient({ initialBlog, similarBlogsSlot, blog_id }) {
  const [blog, setBlog]                       = useState({ ...initialBlog, comments: { results: [] } });
  const [islikedByUser, setlikedByUser]       = useState(false);
  const [commentsWrapper, setCommentsWrapper] = useState(false);
  const [totalParentCommentLoaded,
         setTotalParentCommentLoaded]         = useState(0);

  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  const hasFetchedFresh = useRef(true);
  const articleRef = useRef(null);

  const refreshBlogData = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), REFRESH_TIMEOUT);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/get-blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blog_id }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const { blog: freshBlog } = await res.json();
      setBlog(prev => ({ ...prev, activity: freshBlog.activity }));
      return freshBlog.activity;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name !== "AbortError") console.error("[refreshBlogData]", err);
      return null;
    }
  }, [blog_id]);

  const contextValue = useMemo(() => ({
    blog, setBlog,
    islikedByUser, setlikedByUser,
    commentsWrapper, setCommentsWrapper,
    totalParentCommentLoaded, setTotalParentCommentLoaded,
    refreshBlogData,
  }), [blog, islikedByUser, commentsWrapper, totalParentCommentLoaded, refreshBlogData]);

  const {
    title      = "",
    content,
    banner     = "",
    author,
    publishedAt = "",
    tags       = [],
  } = blog;

  const {
    fullname                  = "",
    username: author_username = "",
    profile_img               = "",
  } = author?.personal_info ?? {};

  const blogContent   = normalizeBlogContent(content);
  const contentBlocks = blogContent?.blocks || [];
  const newsletterAfterIndex = contentBlocks.length > 1
    ? Math.floor(contentBlocks.length / 2) - 1
    : -1;
  const readingMinutes = useMemo(() => estimateReadingTime(contentBlocks), [contentBlocks]);
  const initials = fullname ? fullname.trim().charAt(0).toUpperCase() : "?";

  // Reading progress tracked against the article's own scroll span
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height - viewportH;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      setReadProgress(Math.min(100, Math.max(0, pct)));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [contentBlocks.length]);

  // ── THEME SYNC GUARD ──────────────────────────────────────────────
  // Belt-and-suspenders fix for the faded-text bug: if something sets
  // data-theme="dark" on <body> (or a class-based dark mode like
  // next-themes' .dark on <html>) but the underlying <body>/<html>
  // background wasn't updated by whatever owns that, the fixed
  // .blog-bg-layer (z-index: -1) can end up rendering *behind* a
  // stray opaque body background — leaving dark-mode ink colors
  // (pale cream/gold) on a white canvas. This effect forces <body>
  // and <html> to always paint transparent so .blog-root's own
  // background layers are what's actually visible, regardless of
  // what any other stylesheet does.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.background;
    const prevBodyBg = body.style.background;
    html.style.background = "transparent";
    body.style.background = "transparent";
    return () => {
      html.style.background = prevHtmlBg;
      body.style.background = prevBodyBg;
    };
  }, []);

  return (
    <BlogContext.Provider value={contextValue}>
      <style suppressHydrationWarning>{`
        /*
          Editorial skin for long-form articles, bi-tonal: true black
          ground with white ink in dark mode, true white ground with
          black ink in light mode. Gold stays the constant accent so
          the brand reads the same in both; blue stays the read-time
          signal.
        */
        .blog-root {
          --gold:          #C9A24B;
          --gold-bright:   #E8C777;
          --gold-dim:      rgba(201,162,75,0.12);
          --gold-dim-2:    rgba(201,162,75,0.06);
          --blue:          #5B9BD5;
          --blue-bright:   #8EC1EA;
          --blue-dim:      rgba(91,155,213,0.14);

          --serif: 'Fraunces', 'Canela', Georgia, 'Times New Roman', serif;
          --sans:  'Inter', 'Söhne', system-ui, -apple-system, sans-serif;
          --mono:  'JetBrains Mono', 'IBM Plex Mono', 'Courier New', monospace;

          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          position: relative;
          isolation: isolate; /* FIX: gives .blog-root its own stacking
                                  context so the -1 z-index bg layer is
                                  always compared against *this*
                                  element's own background, never a
                                  stray body/html background painted
                                  outside of it. */

          /* Default = light. Matches the rest of the site and prevents
             a dark flash before the theme class lands on <html>. */
          color-scheme: light;
          --lux-bg:        #FFFFFF;
          --lux-bg-2:      #FAFAFA;
          --lux-surface:   #FFFFFF;
          --lux-surface-2: #F2F2F2;
          --lux-ink:       #000000;
          --lux-ink-2:     #2B2B2B;
          --lux-ink-4:     #6E6E6E;
          --lux-rule:      rgba(201,162,75,0.35);
          --lux-rule-soft: rgba(0,0,0,0.10);
          --overlay-from:  rgba(255,255,255,0);
          --overlay-to:    rgba(255,255,255,0.92);
          --banner-caption-bg: rgba(255,255,255,0.7);

          /* FIX: paint the background on .blog-root itself (not just
             the fixed layer below), so text is guaranteed to sit on
             the correct color even if the fixed layer's stacking
             gets clobbered by something upstream. */
          background: var(--lux-bg);
        }

        /* ── Dark mode override — matches the same body[data-theme]
               attribute used everywhere else in the app (globals.css,
               HomeClientContent.module.css, Masthead), so the blog
               page never falls out of sync with the site's real
               theme state. ── */
        body[data-theme="dark"] .blog-root {
          color-scheme: dark;
          --lux-bg:        #000000;
          --lux-bg-2:      #0A0A0A;
          --lux-surface:   #121212;
          --lux-surface-2: #191919;
          --lux-ink:       #FFFFFF;
          --lux-ink-2:     #D4D2CC;
          --lux-ink-4:     #8A8880;
          --lux-rule:      rgba(201,162,75,0.18);
          --lux-rule-soft: rgba(255,255,255,0.08);
          --overlay-from:  rgba(0,0,0,0);
          --overlay-to:    rgba(0,0,0,0.88);
          --banner-caption-bg: rgba(0,0,0,0.5);
        }

        /* FIX: also honor a class-based dark mode (e.g. next-themes'
           default of putting class="dark" on <html>), in case that's
           actually what's toggling in this app instead of, or in
           addition to, body[data-theme="dark"]. Harmless no-op if
           you don't use this pattern. */
        html.dark .blog-root,
        :root.dark .blog-root {
          color-scheme: dark;
          --lux-bg:        #000000;
          --lux-bg-2:      #0A0A0A;
          --lux-surface:   #121212;
          --lux-surface-2: #191919;
          --lux-ink:       #FFFFFF;
          --lux-ink-2:     #D4D2CC;
          --lux-ink-4:     #8A8880;
          --lux-rule:      rgba(201,162,75,0.18);
          --lux-rule-soft: rgba(255,255,255,0.08);
          --overlay-from:  rgba(0,0,0,0);
          --overlay-to:    rgba(0,0,0,0.88);
          --banner-caption-bg: rgba(0,0,0,0.5);
        }

        /* ── Full-bleed background, pinned behind every child ── */
        .blog-bg-layer {
          position: fixed;
          inset: 0;
          z-index: -1;
          background: var(--lux-bg);
          pointer-events: none;
        }

        /* ── Reading progress ── */
        .blog-progress-track {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--lux-rule-soft);
          z-index: 60;
          pointer-events: none;
        }
        .blog-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold), var(--gold-bright));
          box-shadow: 0 0 8px rgba(201,162,75,0.6);
          transition: width 120ms ease-out;
        }

        .blog-page-shell {
          /* FIX: explicit solid background here too (not just the
             radial gradients layered on top of var(--lux-bg)) — this
             is a normal in-flow element, so its background is
             guaranteed to render above <body>, independent of any
             z-index/stacking-context ambiguity from the fixed layer. */
          background:
            radial-gradient(1100px 500px at 15% -8%, var(--gold-dim), transparent 60%),
            radial-gradient(900px 500px at 100% 10%, var(--gold-dim-2), transparent 55%),
            var(--lux-bg);
          min-height: 100vh;
          position: relative;
          display: flow-root;
        }
        .blog-page-col {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 20px;
          box-sizing: border-box;
        }
        @media (min-width: 640px)  { .blog-page-col { padding: 0 28px; } }
        @media (min-width: 768px)  { .blog-page-col { padding: 0 36px; } }
        @media (min-width: 1024px) { .blog-page-col { padding: 0; } }

        /* ── Banner ── */
        .blog-banner-wrap {
          max-width: 980px;
          margin: 48px auto 0;
          padding: 0 20px;
          box-sizing: border-box;
        }
        @media (min-width: 640px)  { .blog-banner-wrap { padding: 0 28px; } }
        @media (min-width: 1024px) { .blog-banner-wrap { padding: 0 40px; } }

        .blog-banner-inner {
          position: relative;
          aspect-ratio: 16/9;
          width: 100%;
          overflow: hidden;
          border-radius: 4px;
          background: var(--lux-surface);
          border: 1px solid var(--lux-rule);
          box-shadow:
            0 30px 70px -25px rgba(0,0,0,0.5),
            0 0 0 1px rgba(201,162,75,0.06),
            0 0 60px -10px rgba(201,162,75,0.08);
        }
        .blog-banner-inner img { filter: saturate(0.92) contrast(1.05); }
        .blog-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, var(--overlay-from) 35%, var(--overlay-to) 100%);
          pointer-events: none;
        }
        .blog-banner-frame {
          position: absolute;
          inset: 10px;
          border: 1px solid rgba(201,162,75,0.35);
          pointer-events: none;
        }
        .blog-banner-caption {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          padding: 18px 22px;
        }
        .blog-banner-caption-badge {
          font-family: var(--sans);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #0B0B0C;
          background: linear-gradient(120deg, var(--gold-bright), var(--gold));
          padding: 6px 13px;
          border-radius: 2px;
        }
        .blog-banner-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--sans);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--lux-ink-4);
          background: linear-gradient(160deg, var(--lux-surface) 0%, var(--lux-bg-2) 100%);
        }

        /* ── Header ── */
        .blog-header { margin-top: 56px; margin-bottom: 0; }

        .blog-eyebrow-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 22px;
        }
        .blog-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--sans);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold-bright);
          background: var(--gold-dim);
          border: 1px solid rgba(201,162,75,0.3);
          padding: 6px 12px;
          border-radius: 2px;
        }
        .blog-tag-chip {
          font-family: var(--sans);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--lux-ink-4);
          border: 1px solid var(--lux-rule-soft);
          padding: 5px 11px;
          border-radius: 2px;
          transition: all 180ms ease;
        }
        .blog-tag-chip:hover {
          color: var(--gold-bright);
          border-color: rgba(201,162,75,0.4);
          background: var(--gold-dim-2);
        }

        /* ── Title reveal animation ── */
        @keyframes blogTitleReveal {
          0% {
            opacity: 0;
            transform: translateY(18px);
            filter: blur(6px);
          }
          60% {
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0px);
          }
        }
        @keyframes blogTitleRuleGrow {
          0% { width: 0; opacity: 0; }
          100% { width: 28px; opacity: 1; }
        }

        .blog-title {
          font-family: var(--serif);
          font-size: clamp(2.1rem, 4.8vw, 3.6rem);
          font-weight: 600;
          line-height: 1.08;
          letter-spacing: -0.02em;
          color: var(--lux-ink);
          margin-bottom: 30px;
          -webkit-font-smoothing: antialiased;
          animation: blogTitleReveal 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 120ms;
        }
        .blog-title-rule {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--gold);
          margin-bottom: 24px;
        }
        .blog-title-rule::before,
        .blog-title-rule::after {
          content: "";
          height: 1px;
          width: 28px;
          background: linear-gradient(90deg, var(--gold), transparent);
          animation: blogTitleRuleGrow 700ms ease-out both;
        }
        .blog-title-rule::after {
          transform: scaleX(-1);
          animation-delay: 80ms;
        }

        .blog-byline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          padding: 18px 20px;
          background: linear-gradient(135deg, var(--lux-surface), var(--lux-bg-2));
          border: 1px solid var(--lux-rule);
          border-radius: 6px;
          margin-bottom: 10px;
          position: relative;
        }
        .blog-byline::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
          opacity: 0.5;
        }
        .blog-byline-left { display: flex; align-items: center; gap: 13px; }

        .blog-byline-avatar {
          position: relative;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          border-radius: 50%;
          overflow: hidden;
          background: var(--lux-surface-2);
          border: 1.5px solid var(--gold);
          box-shadow: 0 0 0 3px rgba(201,162,75,0.12), 0 0 20px -6px rgba(201,162,75,0.4);
        }
        .blog-byline-avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--serif);
          font-weight: 600;
          font-size: 17px;
          color: var(--gold-bright);
          background: var(--gold-dim);
        }

        .blog-byline-name {
          font-family: var(--sans);
          font-size: 13.5px;
          font-weight: 700;
          color: var(--lux-ink);
          margin: 0 0 3px;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .blog-byline-username {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--lux-ink-4);
          text-decoration: none;
          transition: color 150ms ease;
        }
        .blog-byline-username:hover { color: var(--gold-bright); }

        .blog-byline-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .blog-byline-date,
        .blog-byline-readtime {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--lux-ink-4);
          letter-spacing: 0.03em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .blog-byline-readtime { color: var(--blue-bright); }

        .blog-interaction {
          padding: 14px 0 10px;
          border-bottom: 1px solid var(--lux-rule-soft);
        }

        /* ── Body ── */
        .blog-body { padding-top: 20px; }
        .blog-body p,
        .blog-body li {
          font-family: var(--sans);
          font-size: 17px;
          line-height: 1.85;
          color: var(--lux-ink-2);
          font-weight: 400;
        }
        .blog-body h1, .blog-body h2, .blog-body h3 {
          font-family: var(--serif);
          font-weight: 600;
          color: var(--lux-ink);
          letter-spacing: -0.015em;
          scroll-margin-top: 90px;
        }
        .blog-body h2 {
          margin-top: 3em;
        }
        .blog-body img {
          border-radius: 4px;
          border: 1px solid var(--lux-rule);
          box-shadow: 0 20px 44px -20px rgba(0,0,0,0.6);
        }
        .blog-body blockquote {
          position: relative;
          border-left: 2px solid var(--gold);
          background: linear-gradient(135deg, var(--gold-dim-2), transparent);
          padding: 20px 26px 20px 50px;
          border-radius: 0 6px 6px 0;
          font-family: var(--serif);
          font-style: italic;
          font-weight: 500;
          font-size: 1.1em;
          color: var(--lux-ink);
        }
        .blog-body blockquote::before {
          content: "“";
          position: absolute;
          left: 14px;
          top: 6px;
          font-family: var(--serif);
          font-size: 2.4em;
          font-style: normal;
          color: var(--gold);
          line-height: 1;
          opacity: 0.85;
        }
        .blog-body a {
          color: var(--gold-bright);
          text-decoration: underline;
          text-decoration-color: rgba(201,162,75,0.35);
          text-underline-offset: 3px;
        }
        .blog-body code {
          font-family: var(--mono);
          background: var(--lux-surface);
          border: 1px solid var(--lux-rule-soft);
          padding: 2px 6px;
          border-radius: 3px;
          color: var(--gold-bright);
          font-size: 0.9em;
        }

        .blog-section-rule {
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 56px 0 0;
          color: var(--gold);
        }
        .blog-section-rule::before,
        .blog-section-rule::after {
          content: "";
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--lux-rule));
        }
        .blog-section-rule::after { transform: scaleX(-1); }
        .blog-section-rule > * { margin: 0 16px; }

        .blog-similar { margin-top: 36px; padding-bottom: 72px; }
        .blog-similar-heading {
          font-family: var(--sans);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold-bright);
          margin-bottom: 4px;
          text-align: center;
        }

        /* ── Newsletter block wrapper ── */
        .blog-newsletter-wrap {
          margin: 3.4rem 0;
          padding: 2.4rem 2.2rem;
          background: var(--lux-surface-2);
          border: 1px solid var(--lux-rule);
          border-radius: 6px;
          position: relative;
          overflow: hidden;
        }
        .blog-newsletter-wrap::before {
          content: "";
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--gold), var(--gold-bright));
        }

        @media (prefers-reduced-motion: reduce) {
          .blog-title,
          .blog-title-rule::before,
          .blog-title-rule::after {
            animation: none;
          }
        }
      `}</style>

      <div className="blog-root">
        <div className="blog-bg-layer" aria-hidden="true" />
        <div className="blog-progress-track">
          <div className="blog-progress-fill" style={{ width: `${readProgress}%` }} />
        </div>

        <Masthead variant="blog" />

        <DeferredVisible rootMargin="200px">
          <CommentContainer />
        </DeferredVisible>

        <AnimationWrapper>
          <div className="blog-page-shell">

            {/* ── Banner ── */}
            <div className="blog-banner-wrap">
              <div className="blog-banner-inner">
                {banner && !bannerError ? (
                  <Image
                    src={banner}
                    alt={title}
                    fill
                    priority
                    quality={95}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 980px"
                    className="object-cover"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                    onError={() => setBannerError(true)}
                  />
                ) : (
                  <div className="blog-banner-fallback" aria-hidden="true">
                    {bannerError ? "Image unavailable" : ""}
                  </div>
                )}
                {banner && !bannerError && (
                  <>
                    <div className="blog-banner-overlay" aria-hidden="true" />
                    <div className="blog-banner-frame" aria-hidden="true" />
                    <div className="blog-banner-caption">
                      <span className="blog-banner-caption-badge">
                        {tags?.[0] || "Analysis"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Article ── */}
            <article
              ref={articleRef}
              itemScope
              itemType="https://schema.org/Article"
              className="blog-page-col"
            >
              <meta itemProp="headline"      content={title} />
              <meta itemProp="datePublished" content={publishedAt} />
              <meta itemProp="image"         content={banner} />
              <span itemProp="author" itemScope itemType="https://schema.org/Person" style={{ display: "none" }}>
                <meta itemProp="name" content={fullname} />
              </span>

              {/* ── Header ── */}
              <header className="blog-header">
                <div className="blog-eyebrow-row">
                  <span className="blog-eyebrow">TradingSyntax · Analysis</span>
                  {tags.slice(0, 3).map((t) => (
                    <span className="blog-tag-chip" key={t}>{t}</span>
                  ))}
                </div>

                <div className="blog-title-rule" aria-hidden="true">
                  <DiamondDivider />
                </div>
                <h1 className="blog-title" itemProp="name">{title}</h1>

                <div className="blog-byline">
                  <div className="blog-byline-left">
                    <div className="blog-byline-avatar">
                      {profile_img && !avatarError ? (
                        <Image
                          src={profile_img}
                          alt={fullname}
                          fill
                          quality={100}
                          sizes="92px"
                          style={{ objectFit: "cover" }}
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div className="blog-byline-avatar-fallback">{initials}</div>
                      )}
                    </div>
                    <div>
                      <p className="blog-byline-name">{fullname}</p>
                      <Link href={`/user/${author_username}`} className="blog-byline-username">
                        @{author_username}
                      </Link>
                    </div>
                  </div>
                  <div className="blog-byline-right">
                    <time dateTime={publishedAt} className="blog-byline-date">
                      <CalendarIcon /> {getDay(publishedAt)}
                    </time>
                    <span className="blog-byline-readtime">
                      <ClockIcon /> {readingMinutes} MIN READ
                    </span>
                  </div>
                </div>
              </header>

              {/* ── Top interactions ── */}
              <div className="blog-interaction">
                <BlogInteraction />
              </div>

              {/* ── Article body ── */}
              <div className="blog-body" itemProp="articleBody">
                {contentBlocks.map((block, i) => (
                  <span key={i}>
                    <BlogContent block={block} isFirst={i === 0} />
                    {i === newsletterAfterIndex && (
                      <DeferredVisible rootMargin="300px">
                        <div className="blog-newsletter-wrap">
                          <NewsletterWidget
                            headingId="article-newsletter-heading"
                            onSubmit={subscribeToNewsletter}
                          />
                        </div>
                      </DeferredVisible>
                    )}
                  </span>
                ))}
              </div>

              {/* ── Bottom interactions ── */}
              <div style={{ padding: "10px 0 16px", borderTop: "1px solid var(--lux-rule-soft)" }}>
                <BlogInteraction />
              </div>

              {/* ── Similar blogs ── */}
              <hr className="blog-section-rule" />
              {similarBlogsSlot}
            </article>

          </div>
        </AnimationWrapper>
      </div>
    </BlogContext.Provider>
  );
}