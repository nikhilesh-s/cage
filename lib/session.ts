import { Redis } from "@upstash/redis";

export type Mode = "timer" | "assignment" | "watch";
export type Status = "idle" | "locked" | "break" | "unlocked";

export type LogEntry = { at: number; event: string };

export type Session = {
  code: string;
  mode: Mode;
  task: string;
  status: Status;
  startedAt: number | null;
  endsAt: number | null; // null for assignment mode (open-ended)
  breaksLeft: number;
  breakUntil: number | null;
  resumeEndsAt: number | null; // endsAt to restore after a break
  submitted: boolean;
  log: LogEntry[];
  updatedAt: number;
};

const TTL = 60 * 60 * 6;
const BREAK_MS = 5 * 60 * 1000;
const BREAKS_PER_SESSION = 2;

// ponytail: in-memory fallback when Redis env is absent (local dev). Not shared across serverless instances.
const mem = new Map<string, Session>();
const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
    : process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
      : null;

const key = (code: string) => `cage:session:${code}`;

export async function getSession(code: string): Promise<Session | null> {
  code = code.toUpperCase();
  const s = redis ? await redis.get<Session>(key(code)) : mem.get(code) ?? null;
  if (!s) return null;
  return tick(s);
}

export async function saveSession(s: Session): Promise<Session> {
  s.updatedAt = Date.now();
  if (redis) await redis.set(key(s.code), s, { ex: TTL });
  else mem.set(s.code, s);
  return s;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export function newCode() {
  let c = "";
  for (let i = 0; i < 4; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return c;
}

export async function createSession(): Promise<Session> {
  let code = newCode();
  while (await getSession(code)) code = newCode();
  const s: Session = {
    code,
    mode: "timer",
    task: "",
    status: "idle",
    startedAt: null,
    endsAt: null,
    breaksLeft: BREAKS_PER_SESSION,
    breakUntil: null,
    resumeEndsAt: null,
    submitted: false,
    log: [{ at: Date.now(), event: "session created" }],
    updatedAt: Date.now(),
  };
  return saveSession(s);
}

// Time-driven transitions, applied on every read so clients never need a server timer.
function tick(s: Session): Session {
  const now = Date.now();
  if (s.status === "break" && s.breakUntil && now >= s.breakUntil) {
    s.status = "locked";
    s.breakUntil = null;
    s.endsAt = s.resumeEndsAt;
    s.resumeEndsAt = null;
    s.log.push({ at: now, event: "break over, relocked" });
  }
  if (s.status === "locked" && s.endsAt && now >= s.endsAt) {
    s.status = "unlocked";
    s.log.push({ at: now, event: "timer done, unlocked" });
  }
  return s;
}

export type Action =
  | { type: "start"; mode: Mode; minutes?: number; task?: string }
  | { type: "break" }
  | { type: "endBreak" }
  | { type: "emergency" }
  | { type: "submit" }
  | { type: "end" };

export function apply(s: Session, a: Action): Session {
  const now = Date.now();
  switch (a.type) {
    case "start": {
      s.mode = a.mode;
      s.task = a.task ?? "";
      s.status = "locked";
      s.startedAt = now;
      s.endsAt = a.mode === "assignment" ? null : now + (a.minutes ?? 25) * 60 * 1000;
      s.breaksLeft = BREAKS_PER_SESSION;
      s.breakUntil = null;
      s.resumeEndsAt = null;
      s.submitted = false;
      s.log.push({ at: now, event: `locked (${a.mode}${a.minutes ? ` ${a.minutes}m` : ""})` });
      break;
    }
    case "break": {
      if (s.status !== "locked" || s.breaksLeft <= 0) break;
      s.breaksLeft -= 1;
      s.status = "break";
      s.breakUntil = now + BREAK_MS;
      s.resumeEndsAt = s.endsAt ? s.endsAt + BREAK_MS : null;
      s.log.push({ at: now, event: "break started" });
      break;
    }
    case "endBreak": {
      if (s.status !== "break") break;
      const early = s.breakUntil ? s.breakUntil - now : 0;
      s.status = "locked";
      s.breakUntil = null;
      s.endsAt = s.resumeEndsAt ? s.resumeEndsAt - early : null;
      s.resumeEndsAt = null;
      s.log.push({ at: now, event: "break ended early" });
      break;
    }
    case "emergency": {
      s.status = "unlocked";
      s.log.push({ at: now, event: "EMERGENCY unlock" });
      break;
    }
    case "submit": {
      s.submitted = true;
      if (s.mode === "assignment" && (s.status === "locked" || s.status === "break")) {
        s.status = "unlocked";
        s.log.push({ at: now, event: "assignment submitted, unlocked" });
      } else {
        s.log.push({ at: now, event: "assignment submitted" });
      }
      break;
    }
    case "end": {
      s.status = "unlocked";
      s.log.push({ at: now, event: "session ended" });
      break;
    }
  }
  return s;
}

export const BREAK_MINUTES = BREAK_MS / 60000;
