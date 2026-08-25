"use client";

import React, { memo, useMemo, useEffect, useRef, useState, useCallback } from "react";
import NewsletterWidget from "@/components/Newsletterwidget";
import { subscribeToNewsletter } from "@/lib/newsletter";

/* ─────────────────────────────────────────────
   FONT LOADER — non-blocking <link>, injected once
   FIX: previously this used @import inside the <style>
   tag below. @import forces the browser to fetch the
   external stylesheet before ANY rule in that same
   <style> block can apply — including the ts-p / ts-h2 /
   ts-li-text color rules. That's why text rendered
   "faded" (falling back to inherited/default color) until
   something (like a theme toggle) forced a style
   recalculation after the font fetch had finished.
   Moving font loading to a <link> tag decouples it from
   the CSS rule application entirely.
───────────────────────────────────────────── */
const FONT_LINK_ID = "ts-google-fonts-link";
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600;1,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,300;1,8..60,400;1,8..60,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap";

const useGoogleFonts = () => {
  useEffect(function () {
    if (typeof document === "undefined") return;
    if (document.getElementById(FONT_LINK_ID)) return; // already injected, no-op

    // Preconnect hints (optional but speeds up the actual font fetch)
    var preconnect1 = document.createElement("link");
    preconnect1.rel = "preconnect";
    preconnect1.href = "https://fonts.googleapis.com";
    document.head.appendChild(preconnect1);

    var preconnect2 = document.createElement("link");
    preconnect2.rel = "preconnect";
    preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "anonymous";
    document.head.appendChild(preconnect2);

    var link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
};

/* ─────────────────────────────────────────────
   FONT + GLOBAL STYLES
   NOTE: @import removed on purpose — see FontLoader above.
───────────────────────────────────────────── */
const FontLoader = () => {
  useGoogleFonts();

  return (
    <style suppressHydrationWarning>{`
    :root, [data-theme='light'] {
      --ts-bg:         #FAFAF8; --ts-surface:    #FFFFFF;
      --ts-surface-2:  #F5F4F0; --ts-surface-3:  #EDECE7;
      --ts-ink-1:      #0D0D0C; --ts-ink-2:      #1E1E1C;
      --ts-ink-3:      #3A3A37; --ts-ink-4:      #6B6B67;
      --ts-ink-5:      #9D9D98; --ts-ink-6:      #C8C8C2;
      --ts-rule:       rgba(0,0,0,0.07);
      --ts-rule-2:     rgba(0,0,0,0.04);
      --ts-gold:       #B07E2A; --ts-gold-2:     #D4A843;
      --ts-gold-bg:    rgba(176,126,42,0.07);
      --ts-green:      #0F6E56; --ts-red:        #C0392B;
      --ts-blue:       #1A56A0;
      --ts-shimmer-1:  #EDECE7; --ts-shimmer-2:  #E2E1DC;
    }
    [data-theme='dark'] {
      --ts-bg:         #0E0E0D; --ts-surface:    #161614;
      --ts-surface-2:  #1E1E1C; --ts-surface-3:  #252522;
      --ts-ink-1:      #F2F0E8; --ts-ink-2:      #D8D6CE;
      --ts-ink-3:      #A8A69E; --ts-ink-4:      #6E6D68;
      --ts-ink-5:      #4A4A46; --ts-ink-6:      #2E2E2B;
      --ts-rule:       rgba(255,255,255,0.07);
      --ts-rule-2:     rgba(255,255,255,0.04);
      --ts-gold:       #D4A843; --ts-gold-2:     #E8C06A;
      --ts-gold-bg:    rgba(212,168,67,0.08);
      --ts-green:      #1DB882; --ts-red:        #E55B4D;
      --ts-blue:       #5B9BD5;
      --ts-shimmer-1:  #1E1E1C; --ts-shimmer-2:  #252522;
    }

    /* Skeleton shimmer */
    @keyframes ts-shimmer {
      0%   { background-position: -700px 0; }
      100% { background-position:  700px 0; }
    }
    .ts-stub {
      border-radius: 4px;
      background: linear-gradient(
        90deg,
        var(--ts-shimmer-1) 25%,
        var(--ts-shimmer-2) 50%,
        var(--ts-shimmer-1) 75%
      );
      background-size: 700px 100%;
      animation: ts-shimmer 1.5s infinite linear;
    }

    /* Entrance animation — ensures fallback visibility if keyframes fail */
    @keyframes ts-fade-up {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
    .ts-animate {
      opacity: 1 !important;
    }
    .ts-do-animate {
      animation: ts-fade-up 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Reading progress bar */
    .ts-progress-bar {
      position: sticky;
      top: 0; left: 0; right: 0;
      height: 2.5px;
      background: var(--ts-rule, rgba(0,0,0,0.07));
      z-index: 100;
    }
    .ts-progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, var(--ts-gold, #B07E2A), var(--ts-gold-2, #D4A843));
      transition: width 0.12s linear;
      border-radius: 0 2px 2px 0;
    }

    /* Drop cap */
    .ts-dropcap::first-letter {
      float: left;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 4.8rem;
      font-weight: 900;
      line-height: 0.78;
      margin: 0.1em 0.12em 0 0;
      color: var(--ts-gold, #B07E2A);
      letter-spacing: -0.03em;
      padding-top: 0.06em;
    }

    /* Paragraph */
    .ts-p {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: clamp(1.0625rem, 1.35vw, 1.175rem);
      font-weight: 400;
      line-height: 1.88;
      color: var(--ts-ink-2, #1E1E1C);
      margin: 0 0 1.5rem;
      text-align: justify;
      text-justify: inter-word;
      text-align-last: left;
      hyphens: auto;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphenate-limit-chars: 6 3 3;
      overflow-wrap: break-word;
      word-break: normal;
      -webkit-font-smoothing: antialiased;
      letter-spacing: 0.005em;
    }

    /* Headings */
    .ts-h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.55rem, 2.8vw, 2.1rem);
      font-weight: 800;
      color: var(--ts-ink-1, #0D0D0C);
      margin: 3.2rem 0 1rem;
      line-height: 1.18;
      letter-spacing: -0.025em;
      position: relative;
      padding-bottom: 0.85rem;
    }
    .ts-h2::after {
      content: '';
      position: absolute; bottom: 0; left: 0;
      width: 2rem; height: 2px;
      background: linear-gradient(90deg, var(--ts-gold, #B07E2A), var(--ts-gold-2, #D4A843));
      border-radius: 2px;
      transition: width 0.55s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ts-h2:hover::after { width: 100%; }

    .ts-h3 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.1rem, 1.9vw, 1.45rem);
      font-weight: 700;
      font-style: italic;
      color: var(--ts-ink-1, #0D0D0C);
      margin: 2.4rem 0 0.75rem;
      line-height: 1.3;
      letter-spacing: -0.012em;
    }

    /* Figure / image */
    .ts-figure { margin: 2.8rem -20px; }
    @media (min-width: 640px)  { .ts-figure { margin: 3rem -28px; } }
    @media (min-width: 768px)  { .ts-figure { margin: 3rem -36px; } }
    @media (min-width: 1024px) { .ts-figure { margin: 3rem 0; } }

    .ts-figure-inner {
      position: relative; overflow: hidden;
      border-radius: 3px; background: var(--ts-surface-3, #EDECE7);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.05);
    }
    .ts-figure-inner::after {
      content: ''; position: absolute; inset: 0;
      border: 1px solid var(--ts-rule, rgba(0,0,0,0.07)); border-radius: 3px;
      pointer-events: none; z-index: 2;
    }
    .ts-figure img {
      width: 100%; height: auto; display: block;
      transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s ease;
      filter: saturate(0.9) brightness(1.01);
    }
    .ts-figure:hover img { transform: scale(1.018); filter: saturate(1.05) brightness(1.0); }

    .ts-figure-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(10,10,8,0.7) 0%, rgba(10,10,8,0.15) 40%, transparent 70%);
      opacity: 0; transition: opacity 0.55s ease; z-index: 1;
    }
    .ts-figure:hover .ts-figure-overlay { opacity: 1; }

    .ts-figure-caption-hover {
      position: absolute; bottom: 0; left: 0; right: 0;
      z-index: 3; padding: 1.2rem 1.4rem;
      transform: translateY(8px); opacity: 0;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ts-figure:hover .ts-figure-caption-hover { opacity: 1; transform: translateY(0); }

    .ts-figcaption {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.78rem; font-weight: 400;
      letter-spacing: 0.02em; color: var(--ts-ink-4, #6B6B67);
      text-align: center; margin-top: 0.8rem;
      padding: 0 0.5rem; line-height: 1.55; font-style: italic;
    }

    /* Blockquote */
    .ts-quote {
      position: relative; margin: 3rem 0;
      padding: 2rem 2.2rem 2rem 2.6rem;
      border-left: 3px solid var(--ts-gold, #B07E2A);
      background: var(--ts-gold-bg, rgba(176,126,42,0.07)); border-radius: 0 4px 4px 0;
    }
    .ts-quote::before {
      content: "\u201C"; position: absolute; top: -0.6rem; left: 1.4rem;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 5rem; font-weight: 900;
      color: var(--ts-gold, #B07E2A); opacity: 0.2; line-height: 1; pointer-events: none;
    }
    .ts-quote-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.05rem, 1.8vw, 1.3rem);
      font-style: italic; font-weight: 500; line-height: 1.72;
      color: var(--ts-ink-2, #1E1E1C); position: relative; letter-spacing: 0.005em;
    }
    .ts-quote-cite {
      display: flex; align-items: center; gap: 10px; margin-top: 1rem;
      font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase; color: var(--ts-gold, #B07E2A);
    }
    .ts-quote-cite::before {
      content: ''; display: inline-block; width: 20px; height: 1px;
      background: var(--ts-gold, #B07E2A); opacity: 0.5;
    }

    /* Lists */
    .ts-ol { list-style: none; margin: 1.6rem 0 2rem; padding: 0; counter-reset: ts-ol; }
    .ts-ul { list-style: none; margin: 1.6rem 0 2rem; padding: 0; }

    .ts-li-ol {
      counter-increment: ts-ol;
      display: grid; grid-template-columns: 2.4rem 1fr;
      gap: 0 0.9rem; margin-bottom: 0.95rem; align-items: baseline;
    }
    .ts-li-ol::before {
      content: counter(ts-ol, decimal-leading-zero);
      font-family: 'DM Sans', sans-serif; font-size: 0.72rem;
      font-weight: 600; color: var(--ts-gold, #B07E2A); letter-spacing: 0.06em; padding-top: 0.28rem;
    }
    .ts-li-ul {
      display: grid; grid-template-columns: 1.4rem 1fr;
      gap: 0 0.7rem; margin-bottom: 0.85rem; align-items: baseline;
    }
    .ts-li-ul::before {
      content: '\u2014'; font-family: 'Playfair Display', Georgia, serif;
      color: var(--ts-gold, #B07E2A); font-size: 0.9rem; font-weight: 400;
    }
    .ts-li-text {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: clamp(0.975rem, 1.3vw, 1.075rem);
      line-height: 1.8;
      color: var(--ts-ink-2, #1E1E1C);
      text-align: justify;
      text-justify: inter-word;
      text-align-last: left;
      hyphens: auto;
      -webkit-hyphens: auto;
      overflow-wrap: break-word;
      -webkit-font-smoothing: antialiased;
    }

    /* Section rule */
    .ts-rule { display: flex; align-items: center; gap: 0.9rem; margin: 3.2rem 0; }
    .ts-rule::before, .ts-rule::after {
      content: ''; flex: 1; height: 1px;
      background: linear-gradient(90deg, transparent, var(--ts-rule, rgba(0,0,0,0.07)) 30%, var(--ts-rule, rgba(0,0,0,0.07)) 70%, transparent);
    }
    .ts-rule-ornament {
      font-family: 'Playfair Display', serif; font-size: 0.65rem;
      letter-spacing: 0.55em; color: var(--ts-gold, #B07E2A); opacity: 0.55; padding-left: 0.55em;
    }

    /* Code block */
    .ts-code-wrap {
      margin: 2rem 0; border-radius: 6px; overflow: hidden;
      border: 1px solid var(--ts-rule, rgba(0,0,0,0.07)); box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }
    .ts-code-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 16px; background: var(--ts-surface-3, #EDECE7); border-bottom: 1px solid var(--ts-rule, rgba(0,0,0,0.07));
    }
    .ts-code-lang {
      font-family: 'DM Sans', sans-serif; font-size: 0.7rem;
      font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ts-gold, #B07E2A);
    }
    .ts-code-dots { display: flex; gap: 5px; }
    .ts-code-dots span { width: 9px; height: 9px; border-radius: 50%; background: var(--ts-ink-6, #C8C8C2); display: block; }
    .ts-code-body {
      background: var(--ts-surface-2, #F5F4F0); padding: 1.3rem 1.5rem; overflow-x: auto;
      font-family: 'JetBrains Mono', ui-monospace, 'Courier New', monospace;
      font-size: 0.875rem; line-height: 1.7; color: var(--ts-ink-2, #1E1E1C);
      white-space: pre-wrap; word-break: break-word; -webkit-font-smoothing: antialiased;
    }
    .ts-code-body code { display: block; color: inherit; }

    /* Explicit dark ink color fallbacks */
    /* Ensure heading links (and title anchors) inherit their parent heading color
       so they don't display the global link blue in dark theme. */
    .ts-h1 a,
    .ts-h2 a,
    .ts-h3 a,
    .articleLeadTitle a,
    h1 a,
    h2 a,
    h3 a {
      color: inherit !important;
      text-decoration: none !important;
    }

    .ts-p,
    .ts-li-text {
      color: var(--ts-ink-2, #1E1E1C) !important;
    }
    .ts-p *,
    .ts-li-text * {
      color: inherit !important;
    }
    .ts-p strong,
    .ts-li-text strong {
      color: var(--ts-ink-1, #0D0D0C) !important;
    }
    .ts-p em,
    .ts-li-text em {
      color: var(--ts-ink-3, #3A3A37) !important;
    }
    .ts-p a,
    .ts-li-text a {
      color: var(--ts-blue, #1A56A0) !important;
    }
    .ts-p a:hover,
    .ts-li-text a:hover {
      color: var(--ts-ink-1, #0D0D0C) !important;
    }

    .ts-h2,
    .ts-h3,
    .ts-quote-text {
      color: var(--ts-ink-1, #0D0D0C) !important;
    }
    .ts-h2 *,
    .ts-h3 *,
    .ts-quote-text * {
      color: inherit !important;
    }

    .ts-dropcap::first-letter {
      color: var(--ts-gold, #B07E2A) !important;
    }

    .ts-code-body::-webkit-scrollbar       { height: 4px; }
    .ts-code-body::-webkit-scrollbar-track { background: transparent; }
    .ts-code-body::-webkit-scrollbar-thumb { background: var(--ts-ink-6, #C8C8C2); border-radius: 2px; }

    /* ── Newsletter block container ── */
    .ts-news {
      margin: 3.4rem 0;
      padding: 2.4rem 2.2rem;
      background: var(--ts-surface-2, #F5F4F0);
      border: 1px solid var(--ts-rule, rgba(0,0,0,0.07));
      border-radius: 6px;
      position: relative;
      overflow: hidden;
    }
    .ts-news::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, var(--ts-gold, #B07E2A), var(--ts-gold-2, #D4A843));
    }
  `}</style>
  );
};

/* ─────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────── */
const SkeletonLine = ({ width, height, mb }) => (
  <div
    className="ts-stub"
    style={{
      width: width || "100%",
      height: height || 14,
      marginBottom: mb !== undefined ? mb : 10,
      borderRadius: 4,
    }}
  />
);

const SkeletonBlock = ({ type }) => {
  if (type === "paragraph") return (
    <div style={{ marginBottom: "1.5rem" }}>
      <SkeletonLine width="100%" height={14} mb={10} />
      <SkeletonLine width="100%" height={14} mb={10} />
      <SkeletonLine width="72%"  height={14} mb={0} />
    </div>
  );
  if (type === "header") return (
    <div style={{ marginBottom: "1rem", marginTop: "2.4rem" }}>
      <SkeletonLine width="65%" height={28} mb={0} />
    </div>
  );
  if (type === "image") return (
    <div style={{ margin: "2.8rem 0" }}>
      <SkeletonLine width="100%" height={220} mb={10} />
      <SkeletonLine width="40%"  height={12}  mb={0} />
    </div>
  );
  if (type === "quote") return (
    <div style={{ margin: "3rem 0", paddingLeft: "1.6rem", borderLeft: "3px solid var(--ts-shimmer-2)" }}>
      <SkeletonLine width="100%" height={14} mb={10} />
      <SkeletonLine width="85%"  height={14} mb={10} />
      <SkeletonLine width="30%"  height={11} mb={0} />
    </div>
  );
  if (type === "list") return (
    <div style={{ margin: "1.6rem 0" }}>
      {[100, 88, 76].map(function(w, i) {
        return (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
            <SkeletonLine width="20px" height={10} mb={0} />
            <SkeletonLine width={w + "%"} height={13} mb={0} />
          </div>
        );
      })}
    </div>
  );
  return null;
};

const ArticleSkeleton = () => (
  <>
    <SkeletonBlock type="paragraph" />
    <SkeletonBlock type="paragraph" />
    <SkeletonBlock type="image" />
    <SkeletonBlock type="header" />
    <SkeletonBlock type="paragraph" />
    <SkeletonBlock type="quote" />
    <SkeletonBlock type="header" />
    <SkeletonBlock type="list" />
    <SkeletonBlock type="paragraph" />
  </>
);

/* ─────────────────────────────────────────────
   ANIMATED WRAPPER — triggers on scroll into view
───────────────────────────────────────────── */
const AnimatedBlock = ({ children, delay }) => {
  const ref = useRef(null);

  const forceVisible = useCallback(function() {
    var el = ref.current;
    if (!el) return;
    el.style.animation = "none";
    el.style.opacity = "1";
    void el.offsetHeight;
  }, []);

  const handleAnimationEnd = useCallback(function() {
    forceVisible();
  }, [forceVisible]);

  useEffect(function() {
    var totalMs = 650 + (delay || 0) + 150;
    var timer = setTimeout(forceVisible, totalMs);
    return function() { clearTimeout(timer); };
  }, [delay, forceVisible]);

  return (
    <div
      ref={ref}
      className="ts-animate ts-do-animate"
      style={{ animationDelay: (delay || 0) + "ms" }}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────────
   READING PROGRESS BAR
───────────────────────────────────────────── */
export const ReadingProgressBar = ({ contentRef }) => {
  const fillRef = useRef(null);

  useEffect(function() {
    function update() {
      var el = contentRef.current;
      var fill = fillRef.current;
      if (!el || !fill) return;
      var rect = el.getBoundingClientRect();
      var total = el.offsetHeight - window.innerHeight;
      var scrolled = Math.max(0, -rect.top);
      fill.style.width = Math.min(100, (scrolled / Math.max(1, total)) * 100) + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    return function() { window.removeEventListener("scroll", update); };
  }, [contentRef]);

  return (
    <div className="ts-progress-bar">
      <div className="ts-progress-fill" ref={fillRef} />
    </div>
  );
};

/* ─────────────────────────────────────────────
   BLOCK COMPONENTS
───────────────────────────────────────────── */
const CodeBlock = memo(function CodeBlock({ code, language }) {
  return (
    <div className="ts-code-wrap">
      <div className="ts-code-header">
        <span className="ts-code-lang">{language || "code"}</span>
        <div className="ts-code-dots"><span /><span /><span /></div>
      </div>
      <div className="ts-code-body"><code>{code}</code></div>
    </div>
  );
});
CodeBlock.displayName = "CodeBlock";

const ImgBlock = memo(function ImgBlock({ url, caption }) {
  var imageUrl = useMemo(function() {
    if (!url) return "";
    try { return new URL(url).href; } catch (e) { return url; }
  }, [url]);

  return (
    <figure className="ts-figure">
      <div className="ts-figure-inner">
        <img
          src={imageUrl}
          alt={caption || "Article image"}
          loading="lazy"
          decoding="async"
          width={720}
          height={405}
        />
        <div className="ts-figure-overlay" />
        {caption && (
          <div className="ts-figure-caption-hover">
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", fontWeight: 400,
              color: "rgba(242,240,232,0.85)", letterSpacing: "0.02em", lineHeight: 1.5, fontStyle: "italic",
            }}>
              {caption}
            </p>
          </div>
        )}
      </div>
      {caption && <figcaption className="ts-figcaption">{caption}</figcaption>}
    </figure>
  );
});
ImgBlock.displayName = "ImgBlock";

const QuoteBlock = memo(function QuoteBlock({ quote, caption }) {
  return (
    <blockquote className="ts-quote">
      <p className="ts-quote-text">{quote}</p>
      {caption && <cite className="ts-quote-cite">{caption}</cite>}
    </blockquote>
  );
});
QuoteBlock.displayName = "QuoteBlock";

const ListBlock = memo(function ListBlock({ style, items }) {
  if (style === "ordered") {
    return (
      <ol className="ts-ol">
        {(items || []).map(function(item, i) {
          return (
            <li key={i} className="ts-li-ol">
              <span className="ts-li-text" dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <ul className="ts-ul">
      {(items || []).map(function(item, i) {
        return (
          <li key={i} className="ts-li-ul">
            <span className="ts-li-text" dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        );
      })}
    </ul>
  );
});
ListBlock.displayName = "ListBlock";

const SectionRule = function() {
  return (
    <div className="ts-rule" aria-hidden="true">
      <span className="ts-rule-ornament">✦ ✦ ✦</span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN BlogContent COMPONENT
───────────────────────────────────────────── */
const BlogContent = function({ block, isFirst, isLoading, animationDelay }) {
  isFirst = isFirst || false;
  isLoading = isLoading || false;
  animationDelay = animationDelay || 0;

  if (isLoading) {
    return (
      <>
        {isFirst && <FontLoader />}
        <ArticleSkeleton />
      </>
    );
  }

  var type = block.type;
  var data = block.data;

  var renderBlock = function() {
    switch (type) {
      case "paragraph":
        return (
          <p
            className={"ts-p" + (isFirst ? " ts-dropcap" : "")}
            dangerouslySetInnerHTML={{ __html: data.text || "" }}
          />
        );

      case "header":
        if (data.level === 3) {
          return <h3 className="ts-h3" dangerouslySetInnerHTML={{ __html: data.text || "" }} />;
        }
        return <h2 className="ts-h2" dangerouslySetInnerHTML={{ __html: data.text || "" }} />;

      case "image":
        return <ImgBlock url={data.file && data.file.url} caption={data.caption} />;

      case "quote":
        return <QuoteBlock quote={data.text || ""} caption={data.caption} />;

      case "code":
        return <CodeBlock code={data.code || data.text || ""} language={data.language} />;

      case "list":
        return <ListBlock style={data.style || "unordered"} items={data.items || []} />;

      case "delimiter":
        return <SectionRule />;

      case "newsletter":
        return (
          <div className="ts-news">
            <NewsletterWidget
              headingId="article-newsletter-heading"
              eyebrow={data.eyebrow ?? "Executive Intelligence"}
              title={data.title ?? "The Briefing Desk"}
              description={data.description ?? "Institutional order flow mechanics, alpha generation models, and macro updates directly to your terminal."}
              placeholder={data.placeholder ?? "trader@institution.com"}
              buttonText={data.buttonText ?? "Register For Access"}
              finePrint={data.finePrint ?? "Distributed without advertising. Unsubscribe anytime."}
              onSubmit={subscribeToNewsletter}
            />
          </div>
        );

      default:
        if (data && data.text) return <p className="ts-p" dangerouslySetInnerHTML={{ __html: data.text }} />;
        if (data && data.code) return <CodeBlock code={data.code} language={data.language} />;
        return null;
    }
  };

  var rendered = renderBlock();
  if (!rendered) return null;

  return (
    <>
      {isFirst && <FontLoader />}
      <AnimatedBlock delay={animationDelay}>
        {rendered}
      </AnimatedBlock>
    </>
  );
};

export default React.memo(BlogContent);