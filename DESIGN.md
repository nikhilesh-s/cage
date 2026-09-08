# Cage — design contract

Every screen obeys this. Read fully before writing UI.

## Read
Consumer demo for students. Industrial object (a phone cage) rendered with premium-consumer polish.
Dials: VARIANCE 7 / MOTION 6 / DENSITY 3.
The one thing to remember: **the phone physically locked away, with a big honest timer counting down to freedom.**

## Tokens (already in app/globals.css — use them, don't invent colors)
- Surfaces: `bg-ink` (#14120F page), `bg-ink-2`, `bg-graphite` (#2A2724 raised), `bg-graphite-2` (hover/raised more). Dark surfaces via elevation, not lightness inversion.
- Text: `text-bone` (#F3EFE6, never pure white), `text-bone-2`, `text-muted` (#A39D92 secondary only, never body).
- Accent: `accent` (#FF5A1F safety orange) — locks, progress, alarms, the primary CTA. One accent. `accent-deep` for pressed.
- Success: `moss` / `moss-bright` — only for unlocked / break states.
- No purple, no blue gradients, no mesh, no glassmorphism on everything, no blobs, no wavy dividers, no emoji as design.
- Radius hierarchy: `rounded-[var(--r-outer)]` 24px panels, `rounded-[var(--r-inner)]` 16px nested, `rounded-[var(--r-control)]` 10px buttons/inputs. Never one radius everywhere. Inner radius = outer − gap.

## Type
- Display: `font-display` (Bricolage Grotesque). Headlines heavy (700–800), tight leading, `text-wrap: balance` (already on h1–h3). Use `font-stretch`/width axis for the hero wordmark if you like.
- Body: default (Geist). Body ≥16px. `text-muted` for captions ≥12px.
- Numbers/timers: `font-mono` (JetBrains Mono, tabular-nums applied). Timer is the loudest element on desk + phone.
- Max two families per screen plus mono for numerals. No Inter, no Space Grotesk, no system-ui as primary.

## Layout
- Hero is a poster, not a dashboard: full-bleed, asymmetric, brand loudest, one headline, one supporting sentence, one CTA group, one visual.
- No 3-column icon-in-circle feature cards. No centered-everything. Cards only when the card IS the interaction (the phone lock panel, the LMS submit panel).
- 4/8px spacing scale. Max content width set. 44px touch targets. `env(safe-area-inset-*)` on phone screen.
- Copy: specific labels ("Lock for 50 min", "Submit to Canvas", not "Continue"). Halve the words, then halve again. No "Welcome to Cage", no "Unlock the power of".

## Motion (Emil Kowalski rules — strict)
- Easing: `var(--ease-out)` = cubic-bezier(0.23,1,0.32,1) for everything. Drawers/sheets: `var(--ease-drawer)`. **Never ease-in.**
- Durations: UI feedback 100–200ms, reveals 200–300ms. Only the cage lock/unlock moment may exceed (≤600ms).
- Never animate from scale(0). Enter at `opacity 0, scale .96` (or translateY 8px). Buttons already scale(.97) on :active via globals.
- Stagger 40–60ms. Animate transform/opacity only. Gate hover behind `@media (hover:hover)`.
- `motion/react` (`import { motion, AnimatePresence } from "motion/react"`) only inside `'use client'` leaf components. No infinite idle wobble/pulse loops except the "recording" dot in watch mode.
- `prefers-reduced-motion` already collapses transitions globally; don't fight it.
- Continuous values (drag, pointer) via `useMotionValue`, never `useState`.

## A11y floor
16px body, 4.5:1 contrast, focus-visible ring (global), real `<button>`s, labels on inputs, `aria-live="polite"` on status text that changes (timer state, unlock).

## Shared data layer (already built — do not modify)
- `lib/session.ts`: `Session` type, `Action` union, `BREAK_MINUTES`.
- `lib/client.ts` (client-only): `createSession()`, `act(code, action)`, `useSession(code, ms)` → `[session, setSession]` (null loading, undefined 404), `useCountdown(until)` → ms remaining, `fmt(ms)` → "mm:ss" / "h:mm:ss".
- Progress = `1 - remaining / (endsAt - startedAt)`.
