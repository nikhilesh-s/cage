"use client";
import { motion } from "motion/react";

export type CageState = "idle" | "locked" | "break" | "unlocked";

const EASE = [0.23, 1, 0.32, 1] as const;
const BARS = [36, 60, 84, 108, 132, 156, 180, 204];

/**
 * Phone behind vertical bars, orange latch across the top.
 * viewBox 240x300; scales 200-480px wide via width:100%.
 */
export default function Cage({ state, className }: { state: CageState; className?: string }) {
  const open = state === "unlocked";
  const half = state === "break";
  const shut = state === "locked";
  const latchColor = open ? "var(--moss-bright)" : half ? "var(--moss)" : shut ? "var(--accent)" : "var(--muted)";
  // Bars slide apart from the middle when unlocked.
  const spread = (x: number) => (open ? (x < 120 ? -12 : 12) : 0);

  return (
    <svg
      viewBox="0 0 240 300"
      className={className}
      style={{ width: "100%", height: "auto" }}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* phone silhouette */}
      <rect x="74" y="58" width="92" height="190" rx="14" fill="var(--ink-2)" stroke="var(--graphite-2)" strokeWidth="1.5" />
      <rect x="82" y="72" width="76" height="162" rx="6" fill="var(--graphite)" />
      <rect x="106" y="65" width="28" height="3" rx="1.5" fill="var(--graphite-2)" />
      {/* screen dimmed/dark unless unlocked */}
      <motion.rect
        x="82" y="72" width="76" height="162" rx="6"
        fill={open ? "var(--moss-bright)" : "var(--bone)"}
        initial={false}
        animate={{ opacity: open ? 0.16 : 0.03 }}
        transition={{ duration: 0.4, ease: EASE }}
      />

      {/* frame rails */}
      <rect x="22" y="30" width="196" height="248" rx="18" stroke="var(--graphite-2)" strokeWidth="1.5" />

      {/* bars */}
      {BARS.map((x) => (
        <motion.line
          key={x}
          x1={x} x2={x} y1="30" y2="278"
          stroke="var(--graphite-2)"
          strokeWidth="3"
          initial={false}
          animate={{ x: spread(x), opacity: open ? 0.55 : 1 }}
          transition={{ duration: 0.55, ease: EASE }}
        />
      ))}

      {/* latch: a bar across the top, pivoting from the left */}
      <g>
        <circle cx="40" cy="30" r="4.5" fill="var(--ink)" stroke={latchColor} strokeWidth="2" />
        <motion.g
          style={{ originX: "40px", originY: "30px" }}
          initial={false}
          animate={{ rotate: open ? -38 : shut ? 0 : -14 }}
          transition={
            shut
              ? { type: "spring", duration: 0.55, bounce: 0.2 }
              : { duration: 0.5, ease: EASE }
          }
        >
          <motion.line
            x1="40" y1="30" x2="200" y2="30"
            strokeWidth="4"
            initial={false}
            animate={{ stroke: latchColor }}
            transition={{ duration: 0.3 }}
          />
          {/* hasp tip */}
          <motion.rect
            x="188" y="20" width="18" height="20" rx="4"
            initial={false}
            animate={{ stroke: latchColor, fill: shut ? latchColor : "var(--ink)" }}
            transition={{ duration: 0.3 }}
            strokeWidth="2"
          />
        </motion.g>
        {/* catch on the right rail */}
        <rect x="200" y="14" width="10" height="34" rx="3" stroke="var(--graphite-2)" strokeWidth="1.5" fill="var(--ink)" />
      </g>

      {/* soft glow only when free */}
      <motion.rect
        x="22" y="30" width="196" height="248" rx="18"
        stroke="var(--moss-bright)"
        strokeWidth="6"
        initial={false}
        animate={{ opacity: open ? 0.22 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ filter: "blur(6px)" }}
      />
    </svg>
  );
}
