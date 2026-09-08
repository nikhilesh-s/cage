# Demo script (3 minutes)

Setup: laptop on the projector at https://cage-sigma.vercel.app/desk. Phone in hand, unlocked, camera app ready. Both online.

1. **Hook (20s)** — Landing page. "A phone is an interruption machine. Every notification is a task switch, and each switch costs 5 to 20 minutes to refocus. Group chats telling you to lock in backfire: they put the phone back in your hand. So we built a cage that plugs into your laptop."
2. **Pair (20s)** — Open the desk. Scan the QR with the phone. Phone shows "Waiting for your desk" with the 4-letter code. Hold the phone up: "This is the cage. Today it's a web page; the hardware version has the same screen behind bars, plus a charger, so you stop hunting for chargers at the tutoring center."
3. **Assignment mode (60s)** — On the desk pick Assignment, type "Lab report 3", press "Lock until it's submitted". Phone snaps locked, latch turns orange. "It stays locked until the assignment is in. Not a timer you can cancel." Show the right panel: the demo LMS. Drop any file, press Submit assignment. Phone unlocks live, latch opens green. Pause so people see it.
4. **Timer + guardrails (40s)** — New session. Timer, 50 min, lock. Show the big countdown on both screens. Press Break on the phone: goes green, 5 minutes, "2 left". Press Back to work. Press Emergency, then Confirm unlock: "Emergency always works, and it's logged on the desk."
5. **Watch over me (60s)** — Pick Watch over me, Turn on camera. The tile goes green: "I can see you." Press Listen, say: "I want to finish my essay, can you watch over me." Desk parses "finish my essay" and locks for 50 min. The camera stays on in the right column: "At the desk."
   - **Walk out of frame without pressing Break.** Countdown on the tile: "No face · 10s until it counts." At zero: strike. Timer jumps +5 min on both screens, desk goes orange "Come back. +5 min added.", phone shows "You left the desk. +5 min. Go back." Say: "Leaving is fine. Leaving without a break is not."
   - **Walk back.** Two seconds later: "At the desk." and "back at the desk" in the log. Strike count stays.
   - **Press Break, then walk away.** Nothing happens: "On break. Go." Breaks are the sanctioned exit.
   - Face detection runs in the browser (MediaPipe BlazeFace). Nothing is uploaded, no AI backend, works offline once loaded.
6. **Close (10s)** — Back to the landing page. "Cage. Locked until the assignment is in."

Fallbacks: if the phone can't scan, type the URL cage-sigma.vercel.app/phone/CODE. If the mic is denied, type the task in the box under Listen. Reload the desk keeps the same code.

## How it's built (for the "what's under the hood" question)

- **Next.js 16 App Router + TypeScript**, one repo, no auth, no ORM. Three routes: `/` landing, `/desk` laptop dashboard, `/phone/[code]` lock screen, plus two API routes.
- **Vercel** hosts it. GitHub repo is git-connected, so every push to `main` is a production deploy; PRs get preview URLs. Functions run on Fluid Compute (plain Node, 300s timeout).
- **Upstash Redis** (via Vercel Marketplace, free tier) is the whole backend. One JSON blob per session keyed by the 4-letter code, 6-hour TTL. Both devices read and write the same blob; the laptop and the phone never talk to each other directly.
- **Polling, not websockets.** The phone fetches its session every 1.5 s. Time-based transitions (break over, timer done) are applied on read in `lib/session.ts`, so there is no server-side timer to lose. Simplest thing that works on serverless.
- **Local dev fallback:** with no Redis env the store is an in-memory Map, so `npm run dev` works offline.
- **Pairing:** `qrcode.react` renders the QR on the desk pointing at `/phone/CODE`. No accounts, no login.
- **Watch over me** is browser-only: `getUserMedia` for the camera, Web Speech API for the voice command, MediaPipe BlazeFace (wasm, ~4 detections/s) for "is a person in frame". Rules: 10s with no face while locked = strike (+5 min, logged, both screens flag it); 2s of face = back; breaks suspend the rule. Nothing leaves the device. No AI backend.
- **Design system:** Tailwind v4 tokens in `globals.css`, Bricolage Grotesque + Geist + JetBrains Mono via `next/font`, Motion for state transitions, CSS keyframes for the hero cage. Rules live in `DESIGN.md`; built with the toolkit's taste-skill and Emil Kowalski's motion rules, no template.
- **Testing:** one self-check for the session state machine, `node --experimental-strip-types lib/session.test.mjs`.
- **Hardware story:** the phone page is the cage's screen. Real device = same page on an embedded display behind bars, plus a USB-C charger, plugged into the laptop.
