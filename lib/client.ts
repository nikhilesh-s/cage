"use client";
import { useEffect, useState } from "react";
import type { Action, Session } from "./session";

export async function createSession(): Promise<Session> {
  const r = await fetch("/api/session", { method: "POST" });
  return r.json();
}

export async function act(code: string, a: Action): Promise<Session> {
  const r = await fetch(`/api/session/${code}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(a),
  });
  return r.json();
}

/** Polls the session every `ms`. Returns null until first load, `undefined` on 404. */
export function useSession(code: string | null, ms = 1500) {
  const [s, setS] = useState<Session | null | undefined>(null);
  useEffect(() => {
    if (!code) return;
    let alive = true;
    const load = async () => {
      const r = await fetch(`/api/session/${code}`, { cache: "no-store" });
      if (!alive) return;
      setS(r.ok ? await r.json() : undefined);
    };
    load();
    const id = setInterval(load, ms);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [code, ms]);
  return [s, setS] as const;
}

/** ms remaining, ticking locally every 250ms; 0 when nothing is scheduled. */
export function useCountdown(until: number | null | undefined) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [until]);
  return until ? Math.max(0, until - Date.now()) : 0;
}

export function fmt(ms: number) {
  const t = Math.ceil(ms / 1000);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
