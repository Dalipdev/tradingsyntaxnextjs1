"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useRef, useCallback } from "react";


const AnimationWrapper = ({
  children,
  keyValue,
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  exit,
  transition = { duration: 0.5 },
  className,
}) => {
  // No keyValue supplied -> this is a static page mount, not a keyed
  // transition. Skip AnimatePresence/mode="wait" entirely.
  //
  // FIX: this branch previously always started from `initial` (opacity: 0)
  // and animated up to `animate` (opacity: 1) via requestAnimationFrame,
  // driven by Framer Motion directly manipulating inline styles.
  //
  // For full-page wrappers — like the blog article page, which wraps its
  // banner, title, and the entire article body in one of these — that
  // 0.5s hidden-to-visible window is a real risk. Any interruption during
  // it (a slow banner image load causing layout shift, web fonts loading
  // in late, a background/inactive tab throttling requestAnimationFrame,
  // or the parent re-rendering mid-animation — e.g. BlogPageClient
  // re-renders on every scroll event via its reading-progress state) can
  // leave the animation partially committed, with nothing left scheduled
  // to push it the rest of the way to opacity: 1. The result is text that
  // sits visibly faded indefinitely, until something else forces a full
  // style recalculation across the page (like toggling the theme, which
  // mutates a global attribute and triggers exactly that).
  //
  // Passing `initial={false}` to Framer Motion (instead of an explicit
  // opacity: 0 object) tells it to skip the initial-state animation
  // entirely and render straight at the `animate` values on mount. There
  // is then no hidden -> visible transition to interrupt or get stuck
  // partway through — content is simply visible immediately, which is
  // what a static page mount actually wants. Keyed transitions (the
  // AnimatePresence branch below, used for things like modal/route
  // transitions where a real enter animation is the point) are
  // unaffected and keep animating from `initial` as before.
  if (keyValue === undefined) {
    return (
      <motion.div
        initial={false}
        animate={animate}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <KeyedAnimation
      keyValue={keyValue}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      className={className}
    >
      {children}
    </KeyedAnimation>
  );
};

// FIX (reload/interruption race — same root cause as the unkeyed branch
// above): this branch retains a real enter animation on purpose, since
// blog article pages use `keyValue` (post slug/id) specifically to
// retrigger a fade-in when navigating between posts. Removing the
// animation here (the way the unkeyed branch does) would kill that
// intended effect.
//
// Instead, this wraps the animated content and adds an independent
// setTimeout backstop: once `transition.duration` has definitely
// elapsed, it force-commits opacity: 1 as an inline style directly on
// the DOM node, regardless of whether Framer Motion's own animation
// state reports completion. This mirrors the same three-layer defense
// already applied to AnimatedBlock in BlogContent.jsx (CSS animation +
// onAnimationEnd + setTimeout), so a dropped frame, backgrounded tab,
// or interrupted animation on a cold full-page reload can no longer
// leave the banner/title/article body stuck at partial opacity.
const KeyedAnimation = ({ children, keyValue, initial, animate, exit, transition, className }) => {
  const ref = useRef(null);

  const forceVisible = useCallback(function () {
    var el = ref.current;
    if (!el) return;
    // Only force the properties this wrapper actually animates (opacity).
    // Leaving other inline styles (e.g. transform) alone avoids fighting
    // with any transform-based variants also passed through this wrapper.
    el.style.opacity = typeof animate?.opacity === "number" ? String(animate.opacity) : "1";
  }, [animate]);

  useEffect(function () {
    var durationMs = ((transition && transition.duration) || 0.5) * 1000;
    var delayMs = ((transition && transition.delay) || 0) * 1000;
    var totalMs = durationMs + delayMs + 150; // duration + delay + buffer
    var timer = setTimeout(forceVisible, totalMs);
    return function () { clearTimeout(timer); };
  }, [keyValue, transition, forceVisible]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={ref}
        key={keyValue}
        initial={initial}
        animate={animate}
        exit={exit || initial}
        transition={transition}
        className={className}
        onAnimationComplete={forceVisible}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default memo(AnimationWrapper);

// --- Pre-defined animation variants ---

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export const slideLeft = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export const slideRight = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const scaleOut = {
  initial: { opacity: 0, scale: 1.1 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.1 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const rotateIn = {
  initial: { opacity: 0, rotate: -10 },
  animate: { opacity: 1, rotate: 0 },
  exit: { opacity: 0, rotate: 10 },
  transition: { duration: 0.5, ease: "easeOut" }
};

export const blurIn = {
  initial: { opacity: 0, filter: "blur(10px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(10px)" },
  transition: { duration: 0.4 }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { 
    duration: 0.3,
    ease: "easeInOut"
  }
};

export const pageTransitionFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
  transition: { 
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1]
  }
};

export const bounce = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 2
    }
  }
};

export const pulse = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const shake = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  }
};