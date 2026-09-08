"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Cage from "@/components/Cage";
import { act, fmt, useCountdown, useSession } from "@/lib/client";
import type { Session } from "@/lib/session";

const EASE = [0.23, 1, 0.32, 1] as const;
const enter = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -8 },
  transition: { duration: 0.28, ease: EASE },
};

const btn =
  "h-12 rounded-[var(--r-control)] px-5 font-medium disabled:opacity-40 disabled:pointer-events-none";

export default function Phone({ code }: { code: string }) {
  const [session, setSession] = useSession(code);

  return (
    <main
      className="flex h-[100dvh] flex-col overflow-hidden bg-ink text-bone"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 20px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
        paddingLeft: "max(env(safe-area-inset-left), 20px)",
        paddingRight: "max(env(safe-area-inset-right), 20px)",
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {session === undefined ? (
          <motion.div key="404" {...enter} className="m-auto text-center">
            <h1 className="text-2xl font-bold">
              No session <span className="font-mono">{code}</span>
            </h1>
            <a href="/" className="mt-4 inline-block text-muted underline underline-offset-4">
              Back to start
            </a>
          </motion.div>
        ) : session === null ? (
          <motion.div key="loading" {...enter} className="m-auto font-mono text-muted">
            {code}
          </motion.div>
        ) : (
          <Screen key={session.status} session={session} setSession={setSession} />
        )}
      </AnimatePresence>
    </main>
  );
}

function Screen({ session: s, setSession }: { session: Session; setSession: (s: Session) => void }) {
  const locked = s.status === "locked";
  const onBreak = s.status === "break";
  const until = onBreak ? s.breakUntil : locked ? s.endsAt : null;
  const remaining = useCountdown(until);
  const total = onBreak
    ? 5 * 60 * 1000
    : s.endsAt && s.startedAt
      ? s.endsAt - s.startedAt
      : 0;
  const progress = until && total ? 1 - remaining / total : 0;

  const run = async (type: "break" | "endBreak" | "emergency") => setSession(await act(s.code, { type }));

  const headline =
    s.status === "idle" ? "Waiting for your desk"
    : locked ? "Locked"
    : onBreak ? "On break"
    : "You're free.";

  return (
    <motion.div {...enter} className="flex flex-1 flex-col">
      <p className="font-mono text-sm text-muted">{s.code}</p>

      <div className="mx-auto mt-6 w-[52%] max-w-[220px]">
        <Cage state={s.status} />
      </div>

      <div className="mt-6 flex flex-1 flex-col">
        <h1 aria-live="polite" className={`text-3xl font-bold ${onBreak ? "text-moss-bright" : ""}`}>
          {headline}
        </h1>

        {s.status === "idle" && (
          <p className="mt-2 text-muted">Start a session on the desk and this phone locks.</p>
        )}
        {locked && s.task && <p className="mt-2 text-bone-2">{s.task}</p>}
        {locked && s.away && (
          <p className="mt-3 rounded-[var(--r-control)] bg-accent px-3 py-2 font-medium text-ink" aria-live="assertive">
            You left the desk. +5 min. Go back.
          </p>
        )}
        {locked && !s.away && s.strikes > 0 && (
          <p className="mt-2 text-sm text-accent">{s.strikes} strike{s.strikes > 1 ? "s" : ""} · +{s.strikes * 5} min</p>
        )}

        {(locked || onBreak) && (
          <div className="mt-auto">
            {until ? (
              <p className={`font-mono text-[80px] leading-none tracking-tight ${onBreak ? "text-moss-bright" : ""}`}>
                {fmt(remaining)}
              </p>
            ) : (
              <p className="font-display text-[40px] font-bold leading-none">until submitted</p>
            )}
            {until ? (
              <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-graphite">
                <div
                  className={`h-full w-full origin-left ${onBreak ? "bg-moss-bright" : "bg-accent"}`}
                  style={{ transform: `scaleX(${Math.min(1, progress)})`, transition: "transform 250ms linear" }}
                />
              </div>
            ) : null}
          </div>
        )}

        {s.status === "unlocked" && (
          <div className="mt-auto">
            <p className="text-muted">
              {s.startedAt ? `${fmt(s.log[s.log.length - 1].at - s.startedAt)} locked` : "Session ended"}
              {s.submitted ? ", submitted" : ""}
            </p>
            <a
              href="/"
              className={`${btn} mt-6 flex w-full items-center justify-center bg-moss-bright text-ink`}
            >
              Start another
            </a>
          </div>
        )}
      </div>

      {locked && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className={`${btn} bg-graphite text-bone`}
            disabled={s.breaksLeft <= 0}
            onClick={() => run("break")}
          >
            Break ({s.breaksLeft} left)
          </button>
          <Emergency onConfirm={() => run("emergency")} />
        </div>
      )}
      {onBreak && (
        <button className={`${btn} mt-6 w-full bg-moss-bright text-ink`} onClick={() => run("endBreak")}>
          Back to work
        </button>
      )}
    </motion.div>
  );
}

function Emergency({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <button
      className={`${btn} ${armed ? "bg-accent text-ink" : "border border-accent/60 text-accent"}`}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
    >
      {armed ? "Confirm unlock" : "Emergency"}
    </button>
  );
}
