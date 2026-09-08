# Cage

Lock your phone until the assignment is in.

A two-device demo of a phone cage that plugs into your laptop: the laptop runs the desk (`/desk`), the phone scans a QR code and becomes the locked screen (`/phone/CODE`). Submitting the assignment on the laptop unlocks the phone.

## Run

```bash
npm install
npm run dev
```

Open `/desk` on the laptop, scan the QR on your phone (same network, or use the deployed URL). Without Redis env vars the session store falls back to in-memory, which only works on a single dev server.

## Modes

- **Timer** — lock for 25 / 50 / 90 min.
- **Assignment** — lock until the (mock) LMS submit button is pressed.
- **Watch over me** — say "I want to write my essay, watch over me". The camera stays on and BlazeFace checks a person is in frame. Leave for 10 s without pressing Break: strike, +5 min, both screens tell you to come back. Nothing is uploaded.

Guardrails: two 5-minute breaks per session, emergency unlock (two-step), visible timer and progress bar on both screens.

## Stack

Next.js App Router, Tailwind v4, Motion, Upstash Redis (Vercel Marketplace). Design rules in `DESIGN.md`.
