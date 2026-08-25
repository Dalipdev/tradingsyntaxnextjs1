"use client";
import { useEffect, useRef, useCallback, useMemo } from "react";

export default function SpaceshipLaunch() {
  const STARS = useMemo(() => 
    Array.from({ length: 90 }, (_, i) => ({
      id: i,
      top: Math.random() * 92,
      left: Math.random() * 100,
      size: Math.random() * 2.4 + 0.5,
      dur: (Math.random() * 2 + 1.5).toFixed(1),
      delay: (Math.random() * 3).toFixed(1),
      opacity: (Math.random() * 0.5 + 0.15).toFixed(2),
    })),
    []
  );
  const wrapRef    = useRef(null);
  const sceneRef   = useRef(null); // wraps everything that needs to scale with container height
  const shipRef    = useRef(null);
  const exhaustRef = useRef(null);
  const trailRef   = useRef(null);
  const glowRef    = useRef(null);
  const heatRef    = useRef(null);
  const tagRef     = useRef(null);
  const smoke1Ref  = useRef(null);
  const smoke2Ref  = useRef(null);
  const smoke3Ref  = useRef(null);
  const hasLaunched = useRef(false);

  const triggerLaunch = useCallback(() => {
    [shipRef, exhaustRef, trailRef, glowRef, heatRef, tagRef, smoke1Ref, smoke2Ref, smoke3Ref]
      .forEach(r => { if (r.current) r.current.style.animationPlayState = "running"; });
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      /* Ship rises STRAIGHT UP then gently leans right — stays visible at top */
      @keyframes sv-launch {
        0%   { transform: translateX(-50%) translateY(0px)    rotate(0deg);   opacity: 1; }
        10%  { transform: translateX(-50%) translateY(-40px)  rotate(0deg);   opacity: 1; }
        40%  { transform: translateX(-46%) translateY(-140px) rotate(-6deg);  opacity: 1; }
        70%  { transform: translateX(-40%) translateY(-240px) rotate(-10deg); opacity: 1; }
        90%  { transform: translateX(-36%) translateY(-310px) rotate(-12deg); opacity: 0.75; }
        100% { transform: translateX(-34%) translateY(-1200px) rotate(-12deg); opacity: 0; }
      }
      /* Trail grows from ground level upward, aligned with ship path */
      @keyframes sv-trail {
        0%   { height: 0;     opacity: 0;    transform: translateX(-50%) rotate(0deg);   }
        10%  { height: 45px;  opacity: 0.85; transform: translateX(-50%) rotate(0deg);   }
        40%  { height: 155px; opacity: 0.72; transform: translateX(-50%) rotate(-6deg);  }
        70%  { height: 255px; opacity: 0.5;  transform: translateX(-50%) rotate(-10deg); }
        90%  { height: 325px; opacity: 0.28; transform: translateX(-50%) rotate(-12deg); }
        100% { height: 345px; opacity: 0.15; transform: translateX(-50%) rotate(-12deg); }
      }
      @keyframes sv-glow {
        0%   { opacity: 0;    transform: translateX(-50%) scaleX(0.4) scaleY(0.5); }
        10%  { opacity: 1;    transform: translateX(-50%) scaleX(1.3) scaleY(1);   }
        35%  { opacity: 0.6; transform: translateX(-50%) scaleX(1.1) scaleY(0.9); }
        65%  { opacity: 0.2; transform: translateX(-50%) scaleX(0.9) scaleY(0.7); }
        100% { opacity: 0;    transform: translateX(-50%) scaleX(0.5) scaleY(0.4); }
      }
      @keyframes sv-heat {
        0%   { opacity: 0;    transform: translateX(-50%) scaleX(0.5); }
        15%  { opacity: 0.4; transform: translateX(-50%) scaleX(1);   }
        100% { opacity: 0;    transform: translateX(-50%) scaleX(1.8) translateY(-30px); }
      }
      @keyframes sv-flame {
        0%   { transform: scaleX(1)    scaleY(1);    }
        100% { transform: scaleX(1.35) scaleY(1.2);  }
      }
      @keyframes sv-tagline {
        from { opacity: 0; transform: translate(-50%, -44px); }
        to   { opacity: 1; transform: translate(-50%, -50%);  }
      }
      @keyframes sv-twinkle {
        0%, 100% { opacity: 0.15; }
        50%      { opacity: 1;    }
      }
      @keyframes sv-smoke {
        0%   { opacity: 0.35; transform: scale(1)    translateY(0);    }
        100% { opacity: 0;    transform: scale(2.5) translateY(-80px); }
      }
      .sv-launch-wrap {
        height: clamp(56px, 6vw, 92px) !important;
        max-height: 92px !important;
        min-height: 56px !important;
        flex: 0 0 auto !important;
        align-self: flex-start !important;
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const target = wrapRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !hasLaunched.current) {
            hasLaunched.current = true;
            triggerLaunch();
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [triggerLaunch]);

  useEffect(() => {
    const container = wrapRef.current;
    const scene = sceneRef.current;
    if (!container || !scene) return;

    const DESIGN_HEIGHT = 92; 
    const MIN_SCALE = 0.22;
    let resizeTimeoutId;
    let lastScale = 1;

    const applyScale = () => {
      const h = container.getBoundingClientRect().height;
      if (!h) return;
      const scale = Math.min(1, Math.max(MIN_SCALE, h / DESIGN_HEIGHT));
      
      // Only update if scale actually changed (reduce reflows)
      if (Math.abs(scale - lastScale) > 0.01) {
        lastScale = scale;
        scene.style.transform = `scale(${scale}) translateZ(0)`;
        scene.style.willChange = "transform";
        container.style.setProperty("--sv-scale", scale);
      }
    };

    applyScale();

    // Debounce resize to avoid excessive updates
    const handleResize = () => {
      clearTimeout(resizeTimeoutId);
      resizeTimeoutId = requestAnimationFrame(applyScale);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      clearTimeout(resizeTimeoutId);
      ro.disconnect();
      window.removeEventListener("resize", handleResize);
      scene.style.willChange = "auto";
    };
  }, []);

  const DUR  = "4.8s";
  const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";

  return (
    <div
      ref={wrapRef}
      className="sv-launch-wrap relative w-full overflow-hidden border-t"
      style={{
        borderColor: "var(--color-border)",
        height: "clamp(56px, 6vw, 92px)",
        /* Fixed: Replaced bright blue gradient with a dark, deep cosmic void palette */
        background: "linear-gradient(to top, #060713 0%, #03040a 40%, #020205 100%)",
      }}
    >
      {/* ── Stars ── */}
      {STARS.map(s => (
        <span 
          key={s.id} 
          suppressHydrationWarning
          style={{
            position: "absolute",
            top: `${s.top}%`, left: `${s.left}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            borderRadius: "50%", background: "white",
            opacity: s.opacity,
            animation: `sv-twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }} 
        />
      ))}

      {/* ── Moon ── */}
      <div style={{
        position: "absolute", top: "12%", right: "14%",
        width: 32, height: 32, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #e8f0ff, #a0b8d8)",
        boxShadow: "0 0 18px rgba(180,210,255,0.35)",
      }}>
        <div style={{
          position: "absolute", top: 6, right: 7, width: 7, height: 7,
          borderRadius: "50%", background: "rgba(130,160,200,0.4)",
        }} />
      </div>

      {/* ── Horizon glow ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 100,
        /* Muted to match the deep black space environment */
        background: "linear-gradient(to top, rgba(15,24,54,0.4) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Ground ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 22,
        background: "linear-gradient(to top, #060810 0%, #0c1222 80%, transparent 100%)",
      }} />

      {/* ── Scaled scene ── */}
      <div
        ref={sceneRef}
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 100%",
          willChange: "transform",
        }}
      >
        {/* ── Ground blast glow ── */}
        <div ref={glowRef} style={{
          position: "absolute", bottom: -10, left: "50%",
          width: 120, height: 65,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(255,150,50,0.75) 0%, rgba(255,80,10,0.4) 45%, transparent 80%)",
          animation: `sv-glow ${DUR} ${EASE} forwards`,
          animationPlayState: "paused",
          opacity: 0,
        }} />

        {/* ── Heat ripple ── */}
        <div ref={heatRef} style={{
          position: "absolute", bottom: 16, left: "50%",
          width: 140, height: 30,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(255,200,50,0.25) 0%, transparent 70%)",
          animation: `sv-heat ${DUR} ${EASE} forwards`,
          animationPlayState: "paused",
          opacity: 0,
        }} />

        {/* ── Smoke puffs ── */}
        {[
          { ref: smoke1Ref, delay: "0.3s", w: 40, h: 40, dx: -12 },
          { ref: smoke2Ref, delay: "0.6s", w: 28, h: 28, dx:   8 },
          { ref: smoke3Ref, delay: "0.9s", w: 34, h: 34, dx: -36 },
        ].map(({ ref, delay, w, h, dx }, i) => (
          <div key={i} ref={ref} style={{
            position: "absolute", bottom: 20, left: "50%",
            transform: `translateX(${dx}px)`,
            width: w, height: h, borderRadius: "50%",
            background: "rgba(180,160,120,0.18)",
            animation: `sv-smoke ${DUR} ${delay} ease forwards`,
            animationPlayState: "paused",
            opacity: 0,
          }} />
        ))}

        {/* ── Trail ── */}
        <div ref={trailRef} style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: 4,
          height: 0,
          borderRadius: 2,
          transformOrigin: "bottom center",
          background:"linear-gradient(to bottom, transparent 0%, rgba(160,210,255,0.55) 30%, rgba(255,170,70,0.5) 72%, rgba(255,100,20,0.2) 100%)",
          animation: `sv-trail ${DUR} ${EASE} forwards`,
          animationPlayState: "paused",
        }} />

        {/* ── Ship + exhaust ── */}
        <div ref={shipRef} style={{
          position: "absolute",
          bottom: 14,
          left: "50%",
          transformOrigin: "center bottom",
          animation: `sv-launch ${DUR} ${EASE} forwards`,
          animationPlayState: "paused",
          transform: "translateX(-50%) translateY(0px) rotate(0deg)",
        }}>
          {/* Exhaust flame */}
          <div ref={exhaustRef} style={{
            position: "absolute",
            bottom: 0, left: "50%",
            transform: "translateX(-50%)",
            transformOrigin: "50% 0%",
            animation: `sv-flame 0.11s ease-in-out infinite alternate`,
          }}>
            <svg width="28" height="58" viewBox="0 0 28 58" fill="none">
              <defs>
                <linearGradient id="fl-outer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#fff5c0" />
                  <stop offset="25%"  stopColor="#ffb020" />
                  <stop offset="65%"  stopColor="#ff4800" />
                  <stop offset="100%" stopColor="rgba(255,40,0,0)" />
                </linearGradient>
                <linearGradient id="fl-inner" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#ffffff" />
                  <stop offset="40%"  stopColor="#ffeebb" />
                  <stop offset="100%" stopColor="rgba(255,230,150,0)" />
                </linearGradient>
                <linearGradient id="fl-blue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#d0f0ff" />
                  <stop offset="50%"  stopColor="#50a8ff" />
                  <stop offset="100%" stopColor="rgba(60,140,255,0)" />
                </linearGradient>
              </defs>
              <ellipse cx="14" cy="5" rx="7" ry="5.5" fill="url(#fl-blue)" opacity="0.8" />
              <path d="M5 8 Q14 58 23 8" fill="url(#fl-outer)" opacity="0.93" />
              <path d="M8 8 Q14 40 20 8" fill="url(#fl-inner)" opacity="0.72" />
              <path d="M10.5 8 Q14 24 17.5 8" fill="white" opacity="0.58" />
            </svg>
          </div>

          {/* Rocket body */}
          <svg width="36" height="72" viewBox="0 0 36 72" fill="none" style={{
            filter: "drop-shadow(0 0 12px rgba(100,170,255,0.7)) drop-shadow(0 0 3px rgba(255,255,255,0.45))",
          }}>
            <defs>
              <linearGradient id="rkt-body" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#8aaed8" />
                <stop offset="38%"  stopColor="#deeeff" />
                <stop offset="68%"  stopColor="#eef6ff" />
                <stop offset="100%" stopColor="#5a7eb0" />
              </linearGradient>
              <linearGradient id="rkt-nose" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%"   stopColor="#6888b8" />
                <stop offset="60%"  stopColor="#c8e4ff" />
                <stop offset="100%" stopColor="#eef8ff" />
              </linearGradient>
              <linearGradient id="rkt-wing-l" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stopColor="#5070a8" />
                <stop offset="100%" stopColor="#243660" />
              </linearGradient>
              <linearGradient id="rkt-wing-r" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#5070a8" />
                <stop offset="100%" stopColor="#243660" />
              </linearGradient>
              <linearGradient id="rkt-window" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stopColor="#b8e0ff" />
                <stop offset="50%"  stopColor="#3888d0" />
                <stop offset="100%" stopColor="#1050a0" />
              </linearGradient>
              <linearGradient id="rkt-engine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#6888b8" />
                <stop offset="100%" stopColor="#304870" />
              </linearGradient>
              <radialGradient id="rkt-win-shine" cx="35%" cy="30%" r="50%">
                <stop offset="0%"   stopColor="white" stopOpacity="0.72" />
                <stop offset="100%" stopColor="white" stopOpacity="0"    />
              </radialGradient>
            </defs>
            <path d="M18 2 L26 24 L26 50 L10 50 L10 24 Z" fill="url(#rkt-body)" stroke="#4060a0" strokeWidth="0.5" />
            <path d="M18 2 L26 24 L10 24 Z" fill="url(#rkt-nose)" stroke="#4060a0" strokeWidth="0.4" />
            <path d="M16 4 L21 22 L19 22 L15 7 Z" fill="white" opacity="0.18" />
            <path d="M10 36 L2 54 L10 50 Z"  fill="url(#rkt-wing-l)" stroke="#243660" strokeWidth="0.4" />
            <path d="M10 46 L2 54 L10 50 Z"  fill="#18284a" stroke="#243660" strokeWidth="0.4" />
            <path d="M26 36 L34 54 L26 50 Z" fill="url(#rkt-wing-r)" stroke="#243660" strokeWidth="0.4" />
            <path d="M26 46 L34 54 L26 50 Z" fill="#18284a" stroke="#243660" strokeWidth="0.4" />
            <line x1="12" y1="20" x2="24" y2="20" stroke="#7090b8" strokeWidth="0.4" opacity="0.6" />
            <line x1="11" y1="38" x2="25" y2="38" stroke="#7090b8" strokeWidth="0.4" opacity="0.5" />
            <rect x="13" y="28" width="10" height="6" rx="0.5" fill="#1e3a6a" opacity="0.7" />
            <rect x="13" y="28" width="5"  height="3" rx="0"   fill="#3a5a9a" opacity="0.8" />
            <circle cx="18" cy="32" r="6" fill="url(#rkt-window)" stroke="#90c0e8" strokeWidth="0.8" />
            <circle cx="18" cy="32" r="6" fill="url(#rkt-win-shine)" opacity="0.45" />
            <circle cx="18" cy="32" r="3" fill="#d0ecff" opacity="0.3" />
            <path d="M11 50 L10 56 L26 56 L25 50 Z" fill="url(#rkt-engine)" stroke="#304870" strokeWidth="0.5" />
            <line x1="14" y1="50" x2="13" y2="56" stroke="#5070a0" strokeWidth="0.4" opacity="0.5" />
            <line x1="18" y1="50" x2="18" y2="56" stroke="#5070a0" strokeWidth="0.4" opacity="0.5" />
            <line x1="22" y1="50" x2="23" y2="56" stroke="#5070a0" strokeWidth="0.4" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* ── Tagline — true centre, single line ── */}
      <p ref={tagRef} style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        whiteSpace: "nowrap",
        fontSize: "calc(clamp(0.75rem, 3.8vw, 2.6rem) * var(--sv-scale, 1))",
        fontFamily: "'Georgia','Times New Roman',serif",
        fontWeight: 900,
        letterSpacing: "-0.01em",
        lineHeight: 1,
        textAlign: "center",
        color: "transparent",
        backgroundImage:"linear-gradient(90deg, #ffffff 0%, #c8dfff 30%, #90c0ff 55%, #ffffff 80%, #c8dfff 100%)",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        userSelect: "none",
        margin: 0,
        padding: 0,
        animation: "sv-tagline 0.9s 3.6s ease forwards",
        animationPlayState: "paused",
        opacity: 0,
      }}>
        THINK COSMIC 🪐 MOVE INFINITE.
      </p>
    </div>
  );
}