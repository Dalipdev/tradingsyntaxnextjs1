"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./Footer.module.css";

const SpaceshipLaunch = dynamic(
  () =>
    import("./Spaceshiplaunch").catch((e) => {
      console.error("[SpaceshipLaunch] Failed to load:", e);
      return () => null;
    }),
  { ssr: false }
);

function DeferredVisible({ children, rootMargin = "250px" }) {
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

// ─── Navigation Data ──────────────────────────────────────────────────────────

const COL1 = {
  heading: "MAGIC",
  links: [
    { label: "Services", href: "/calendar/economic" },
    { label: "Process", href: "/calendar/earnings" },
    { label: "Works", href: "/calendar/dividends" },
  ],
};

const COL2 = {
  heading: "PEOPLE",
  links: [
    { label: "About", href: "/features" },
    { label: "Blog", href: "/pricing" },
    { label: "Testimonials", href: "/market-data" },
    { label: "Careers", href: "/gift" },
    { label: "Contact", href: "/trading" },
  ],
};

const COL3 = {
  heading: "SOCIALS",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/tradingsyntax/" },
    { label: "Instagram", href: "https://www.instagram.com/tradingsyntax?igsi=c3htNTA0ZmZieGgz" },
    { label: "X.com", href: "https://x.com/tradingsyntax" },
    { label: "YouTube", href: "https://youtube.com/@tradingsyntax?si=b6W1BzP2B1YhAk2y" },
  ],
};

const COL4 = {
  heading: "ORBITAL HUB",
  lines: [
    "subspace@tradingsyntax.io",
    "Comms: Array-7 // Quantum Band",
    "Sector 4, Kepler-186f Orbit,",
    "Milky Way - Andromeda Convergence",
  ],
};

// ─── Social icons ─────────────────────────────────────────────────────────────

const SOCIAL = [
  {
    label: "X (Twitter)",
    href: "https://x.com/tradingsyntax",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14} aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61590449082307",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14} aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@tradingsyntax?si=b6W1BzP2B1YhAk2y",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14} aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/tradingsyntax?igsi=c3htNTA0ZmZieGgz",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14} aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204 013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/tradingsyntax/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14} aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "https://t.me/fxalerts777_bot",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14} aria-hidden="true">
        <path d="M23.95 4.57c-.16-.66-.8-1.05-1.45-.89L1.55 9.47c-.69.19-1.13.88-1.01 1.59.12.71.75 1.25 1.47 1.27l5.62.17 2.09 6.1c.2.59.74.99 1.36 1.02h.07c.59 0 1.13-.34 1.39-.87l2.53-5.16 5.21 3.84c.38.28.89.35 1.33.17.44-.17.77-.56.87-1.02L23.98 5c.03-.15.02-.29-.03-.43zM7.96 11.87l10.67-5.94-8.34 7.91-.36 3.82-1.97-5.79z" />
      </svg>
    ),
  },
  {
    label: "Reddit",
    href: "https://www.reddit.com/u/tradingsyntaxx/s/hUwnPxvBa7",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14} aria-hidden="true">
        <path d="M24 12c0-1.1-.9-2-2-2-.53 0-1.01.21-1.37.55-1.35-.92-3.18-1.52-5.22-1.59l1.1-3.47 2.97.69a1.5 1.5 0 1 0 .35-1.02l-3.59-.83a.5.5 0 0 0-.6.34l-1.34 4.24c-2.11.04-4.01.64-5.4 1.58A1.98 1.98 0 0 0 7 10a2 2 0 1 0-1.63 3.15c0 3.02 3.01 5.47 6.73 5.47s6.73-2.45 6.73-5.47A2 2 0 0 0 24 12zM8.5 13.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm7 3.12c-.74.74-2 .99-3.4.99s-2.66-.25-3.4-.99a.5.5 0 1 1 .71-.71c.49.49 1.46.7 2.69.7s2.2-.21 2.69-.7a.5.5 0 0 1 .71.71zm-.5-3.12a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
      </svg>
    ),
  },
  {
    label: "Threads",
    href: "https://www.threads.com/@tradingsyntax",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14} aria-hidden="true">
        <path d="M17.5 11.5c-.1-.05-.2-.1-.3-.14-.18-3.28-1.98-5.16-4.99-5.18h-.04c-1.8 0-3.31.77-4.24 2.17l1.67 1.15c.7-1.05 1.79-1.28 2.57-1.28h.03c.98.01 1.72.29 2.2.83.35.4.58.94.7 1.63-.87-.15-1.82-.19-2.83-.13-2.85.17-4.68 1.79-4.56 4.03.06 1.14.63 2.12 1.6 2.77.82.55 1.88.82 2.98.76 1.45-.08 2.59-.64 3.38-1.66.6-.78.98-1.79 1.14-3.06.68.41 1.19.95 1.47 1.6.48 1.11.51 2.93-.98 4.41-1.31 1.31-2.88 1.87-5.25 1.89-2.63-.02-4.62-.87-5.92-2.53-1.22-1.56-1.85-3.8-1.87-6.66.02-2.86.65-5.1 1.87-6.66 1.3-1.66 3.29-2.51 5.92-2.53 2.65.02 4.68.88 6.02 2.55.66.82 1.15 1.83 1.47 2.99l1.85-.49c-.39-1.44-1-2.7-1.83-3.73C16.83 1.06 14.28 0 11.17 0h-.02C8.06.02 5.55 1.08 3.85 3.06 2.29 4.87 1.5 7.44 1.48 10.63v.02c.02 3.19.81 5.76 2.37 7.57 1.7 1.98 4.21 3.03 7.32 3.05h.02c2.84-.02 4.94-.75 6.62-2.42 2.19-2.19 2.13-4.94 1.4-6.63-.51-1.19-1.5-2.15-2.71-2.72zm-4.63 4.53c-1.09.06-2.24-.42-2.29-1.46-.04-.77.55-1.63 2.36-1.74.21-.01.41-.02.61-.02.66 0 1.28.06 1.85.19-.21 2.61-1.44 2.96-2.53 3.03z" />
      </svg>
    ),
  },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function NavCol({ col }) {
  return (
    <div className={styles.navCol}>
      <span className={styles.navHeading}>{col.heading}</span>
      {col.links?.map((l) => (
        <Link key={l.href} href={l.href} className={styles.navLink}>
          {l.label}
        </Link>
      ))}
      {col.lines?.map((line, i) => (
        <span key={i} className={styles.navText}>
          {line}
        </span>
      ))}
    </div>
  );
}

function SocialIcons() {
  return (
    <div className={styles.socialRow}>
      {SOCIAL.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className={styles.socialLink}
        >
          {s.icon}
        </Link>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Footer() {
  const wordmarkRef = useRef(null);   // wrap div — used for the scroll-in reveal
  const titleStageRef = useRef(null); // .titleStage — the box the text must fit inside
  const wordTextRef = useRef(null);   // the actual <span> that renders "彡 TRADINGSYNTAX 彡"
  const [play, setPlay] = useState(false);

  // Reveal + signature-animation trigger (unchanged behavior, now
  // also drives the sparkline draw-on instead of the old craft flight)
  useEffect(() => {
    const el = wordmarkRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlay(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fit-to-container: measures the actual rendered width of
  // "彡 TRADINGSYNTAX 彡" and scales it down with transform: scale()
  // until it exactly fits .titleStage. Guaranteed no clipping on
  // any screen width, unlike a fixed clamp()/vw font-size guess.
  useLayoutEffect(() => {
    const container = titleStageRef.current;
    const textEl = wordTextRef.current;
    if (!container || !textEl) return;

    const minScale = 0.2; // never shrink below 20% of natural size
    const paddingPx = 12; // small breathing room on each side

    const fit = () => {
      textEl.style.transform = "scale(1)";
      // eslint-disable-next-line no-unused-expressions
      textEl.offsetWidth; // force reflow for an accurate measurement

      const containerWidth = container.clientWidth - paddingPx * 2;
      const textWidth = textEl.scrollWidth;
      if (textWidth <= 0 || containerWidth <= 0) return;

      let scale = containerWidth / textWidth;
      scale = Math.min(1, Math.max(minScale, scale));
      textEl.style.transform = `scale(${scale})`;
    };

    const resizeObserver = new ResizeObserver(() => fit());
    resizeObserver.observe(container);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fit);
    }

    fit();

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <footer className={styles.footer} role="contentinfo">
      {/* ── Brand wordmark ── */}
      <div ref={wordmarkRef} className={styles.wordmarkWrap}>
        <div className={styles.titleStage} ref={titleStageRef}>
          {/* Signature element: a sparkline that draws itself once
              on scroll-into-view, ending in a live-data dot — the
              same visual language as the site's ticker "live" dot,
              in place of the previous moon/spaceship motif. */}
          <svg
            className={`${styles.signalLine} ${play ? styles.signalPlaying : ""}`}
            viewBox="0 0 600 60"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className={styles.signalPath}
              d="M0,42 L70,42 L110,18 L150,46 L190,12 L230,34 L270,8 L600,8"
              pathLength="1"
            />
            <circle className={styles.signalDot} cx="600" cy="8" r="4" />
          </svg>

          <Link href="/" className={styles.wordmarkLink} aria-label="TradingSyntax home">
            {/* Outer span: owns the CSS reveal animation (opacity + translateY) */}
            <span className={`${styles.wordmark} ${play ? styles.wordmarkReveal : ""}`}>
              {/* Inner span: the actual text. fitWordmark's scale-to-fit
                  transform is applied to THIS element, kept separate from
                  the outer span so the reveal animation's transform and
                  the fit's scale() transform never collide. */}
              <span ref={wordTextRef} className={styles.wordmarkFit}>
                彡 TRADINGSYNTAX 彡
              </span>
            </span>
          </Link>
        </div>

        {/* Reuses the exact tagline already established on the
            masthead, so the footer reads as the same publication. */}
        <span className={styles.wordmarkTagline}>
          Quantitative Architecture · Macro Portfolio Analysis · Institutional Intelligence
        </span>
      </div>

      {/* ── Navigation grid ── */}
      <div className={styles.navGrid}>
        <NavCol col={COL1} />
        <NavCol col={COL2} />
        <NavCol col={COL3} />

        <div className={styles.navCol}>
          <span className={styles.navHeading}>{COL4.heading}</span>
          {COL4.lines.map((line, i) => (
            <span key={i} className={styles.navText}>
              {line}
            </span>
          ))}
          <div className={styles.studioSocials}>
            <SocialIcons />
          </div>
        </div>
      </div>

      {/* ── Legal bar ── */}
      <div className={styles.legalBar}>
        <span className={styles.legalCopy}>COPYRIGHT © 2026</span>
        <span className={styles.legalTag}>
          ✦&nbsp; WE ARE <strong>TRADINGSYNTAX</strong>
        </span>
      </div>

      {/* ── Dynamic Spaceship Launch Bar ── */}
      <DeferredVisible rootMargin="400px">
        <SpaceshipLaunch />
      </DeferredVisible>
    </footer>
  );
}