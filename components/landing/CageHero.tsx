"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

const BARS = [22, 58, 94, 130, 166, 202]; // x positions across a 224-wide cage

export function CageHero() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 48]);

  return (
    <motion.div style={{ y }} className="w-full max-w-[260px] lg:max-w-[420px]" aria-hidden>
      <svg viewBox="0 0 224 400" className="block h-auto w-full overflow-visible">
        {/* phone */}
        <rect x="52" y="40" width="120" height="240" rx="18" fill="var(--graphite)" />
        <rect x="60" y="52" width="104" height="216" rx="12" fill="var(--ink-2)" />
        <rect x="96" y="58" width="32" height="5" rx="2.5" fill="var(--graphite-2)" />
        {/* one notification, muted: the thing the cage keeps out */}
        <rect x="70" y="120" width="84" height="26" rx="6" fill="var(--graphite)" />
        <rect x="78" y="128" width="34" height="4" rx="2" fill="var(--muted)" />
        <rect x="78" y="136" width="52" height="3" rx="1.5" fill="var(--graphite-2)" />

        {/* bars slide down from above (CSS keyframes: off-main-thread, reduced-motion handled globally) */}
        {BARS.map((x, i) => (
          <rect
            key={x}
            className="bar-drop"
            style={{ animationDelay: `${i * 50}ms` }}
            x={x - 4}
            y="0"
            width="8"
            height="320"
            rx="4"
            fill="var(--bone-2)"
          />
        ))}
        {/* base plate + cable to the laptop */}
        <rect x="8" y="316" width="208" height="16" rx="8" fill="var(--graphite-2)" />
        <path d="M112 332v40" stroke="var(--graphite-2)" strokeWidth="4" strokeLinecap="round" />
        <rect x="100" y="372" width="24" height="14" rx="4" fill="var(--graphite-2)" />

        {/* latch snaps across after the bars land */}
        <g className="latch-snap">
          <rect x="0" y="164" width="224" height="24" rx="12" fill="var(--accent)" />
          <rect x="98" y="170" width="28" height="12" rx="6" fill="var(--accent-deep)" />
        </g>
      </svg>
    </motion.div>
  );
}
