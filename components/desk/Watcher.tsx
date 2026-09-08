"use client";
import { useEffect, useRef, useState } from "react";
import { openCamera, usePresence } from "./presence";
import type { Action, Session } from "@/lib/session";
import { STRIKE_MINUTES } from "@/lib/session";

// ponytail: fixed grace windows; tune per room/lighting.
const AWAY_AFTER_S = 10; // no face this long while locked = left without a break
const BACK_AFTER_S = 2; // face must stay this long before "back" (kills flicker)

/** Live watcher during a locked watch-mode session. Camera stays on; leaving the frame without a break is a strike. */
export default function Watcher({ s, run }: { s: Session; run: (a: Action) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camErr, setCamErr] = useState("");
  const { faces, error } = usePresence(video, stream);
  const onBreak = s.status === "break";
  const seen = faces !== null && faces > 0;
  // Wall-clock, not tick counts: background tabs throttle timers, real seconds don't stop.
  const lastSeen = useRef<number | null>(null);
  const lastGone = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    openCamera().then(setStream).catch(() => setCamErr("Camera blocked. Watching is off, so this session is on the honor system."));
  }, []);

  useEffect(() => {
    if (faces === null) return;
    const t = Date.now();
    if (seen) {
      lastSeen.current ??= t;
      lastGone.current = null;
    } else {
      lastGone.current ??= t;
      lastSeen.current = null;
    }
  }, [faces, seen]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const gone = lastGone.current ? Math.floor((now - lastGone.current) / 1000) : 0;
  const seenFor = lastSeen.current ? Math.floor((now - lastSeen.current) / 1000) : 0;

  // rules
  useEffect(() => {
    if (onBreak) return; // leaving during a break is the whole point of a break
    if (!s.away && gone >= AWAY_AFTER_S) run({ type: "away" });
    if (s.away && seenFor >= BACK_AFTER_S) run({ type: "back" });
    // run is stable enough for this demo; re-running on s.away/gone/seenFor is the intent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gone, seenFor, s.away, onBreak]);

  const label = camErr
    ? camErr
    : error
      ? error
      : faces === null
        ? "loading face model…"
        : onBreak
          ? "On break. Go."
          : s.away
            ? `Come back. +${STRIKE_MINUTES} min added.`
            : seen
              ? "At the desk."
              : `No face · ${Math.max(0, AWAY_AFTER_S - gone)}s until it counts`;

  const tone = s.away ? "text-accent" : seen || onBreak ? "text-moss-bright" : "text-bone";

  return (
    <section className={`rounded-[var(--r-outer)] p-4 flex gap-5 items-center ${s.away ? "bg-accent/15" : "bg-graphite"}`} aria-live="polite">
      <div className="relative w-[200px] aspect-[4/3] rounded-[var(--r-inner)] bg-ink-2 overflow-hidden shrink-0">
        <video ref={video} autoPlay muted playsInline className="size-full object-cover" />
        {stream && <span aria-hidden className={`absolute top-3 left-3 size-2.5 rounded-full ${seen ? "bg-moss-bright" : "bg-accent"}`} />}
      </div>
      <div className="min-w-0">
        <p className={`font-display font-bold text-2xl ${tone}`}>{label}</p>
        <p className="text-muted text-sm mt-1">
          Watching. {s.strikes ? `${s.strikes} strike${s.strikes > 1 ? "s" : ""}, +${s.strikes * STRIKE_MINUTES} min.` : "No strikes yet."} Press Break before you leave.
        </p>
        <p className="text-muted text-xs mt-2">Face detection runs in this browser. Nothing is uploaded.</p>
      </div>
    </section>
  );
}
