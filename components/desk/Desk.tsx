"use client";
import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import { act, createSession, fmt, useCountdown, useSession } from "@/lib/client";
import { BREAK_MINUTES, type Action, type Mode, type Session } from "@/lib/session";
import Watch from "./Watch";
import Watcher from "./Watcher";
import Lms from "./Lms";

const KEY = "cage:desk:code";
const EASE = [0.23, 1, 0.32, 1] as const;
const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: EASE },
};

const btn = "h-11 px-4 rounded-[var(--r-control)] font-medium disabled:opacity-40 disabled:pointer-events-none";
const primary = `${btn} bg-accent text-ink hover:bg-accent-deep`;
const ghost = `${btn} bg-graphite text-bone hover:bg-graphite-2`;
const input = "h-11 w-full rounded-[var(--r-control)] bg-ink-2 border border-graphite-2 px-3 text-bone placeholder:text-muted";

export default function Desk() {
  const [code, setCode] = useState<string | null>(null);
  const [session, setSession] = useSession(code);

  const fresh = useCallback(async () => {
    const s = await createSession();
    sessionStorage.setItem(KEY, s.code);
    setSession(null);
    setCode(s.code);
  }, [setSession]);

  useEffect(() => {
    const stored = sessionStorage.getItem(KEY);
    if (stored) setCode(stored);
    else fresh();
  }, [fresh]);
  useEffect(() => {
    if (session === undefined) fresh(); // stored code expired
  }, [session, fresh]);

  const run = async (a: Action) => {
    if (!code) return;
    setSession(await act(code, a));
  };

  const live = !!session && (session.status === "locked" || session.status === "break");
  const phase = !session ? "loading" : live ? "live" : session.status;

  return (
    <main className="min-h-[100dvh] max-w-[1400px] mx-auto px-6 py-8 lg:px-10 lg:py-12 lg:grid lg:grid-cols-[400px_1fr] lg:gap-12">
      <div className="flex flex-col gap-8">
        <header className="flex items-baseline gap-3">
          <span className="font-display font-extrabold text-2xl tracking-tight">Cage</span>
          <span className="text-muted">desk</span>
        </header>

        <Pairing code={code} />

        <AnimatePresence mode="popLayout" initial={false}>
          {phase === "idle" && session && (
            <motion.div key="idle" {...fade}>
              <Picker onStart={(mode, minutes, task) => run({ type: "start", mode, minutes, task })} />
            </motion.div>
          )}
          {phase === "live" && session && (
            <motion.div key="live" {...fade}>
              <Controls s={session} run={run} />
            </motion.div>
          )}
          {phase === "unlocked" && session && (
            <motion.div key="done" {...fade} className="flex flex-col gap-4">
              <h1 aria-live="polite" className="font-display font-extrabold text-4xl text-moss-bright">
                Phone&rsquo;s out.
              </h1>
              <p className="text-bone-2">{summary(session)}</p>
              <button className={`${primary} self-start`} onClick={fresh}>
                New session
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-8 mt-10 lg:mt-0">
        <AnimatePresence mode="popLayout" initial={false}>
          {live && session && (
            <motion.div key="timer" {...fade}>
              <Timer s={session} />
            </motion.div>
          )}
          {live && session?.mode === "watch" && (
            <motion.div key="watcher" {...fade}>
              <Watcher s={session} run={run} />
            </motion.div>
          )}
        </AnimatePresence>
        <Lms
          active={live && session?.mode === "assignment"}
          submitted={!!session?.submitted}
          onSubmit={() => run({ type: "submit" })}
        />
      </div>
    </main>
  );
}

function summary(s: Session) {
  const mins = s.startedAt ? Math.round((s.updatedAt - s.startedAt) / 60000) : 0;
  const last = s.log[s.log.length - 1]?.event ?? "";
  return `${mins} min locked${s.task ? ` on "${s.task}"` : ""}. ${last[0].toUpperCase()}${last.slice(1)}.`;
}

function Pairing({ code }: { code: string | null }) {
  const url = code && typeof location !== "undefined" ? `${location.origin}/phone/${code}` : "";
  return (
    <section className="bg-graphite rounded-[var(--r-outer)] p-4 flex gap-5 items-center">
      <div className="bg-ink rounded-[var(--r-inner)] p-3 shrink-0 size-[160px] grid place-items-center">
        {url ? (
          <QRCodeSVG value={url} size={136} bgColor="#14120f" fgColor="#f3efe6" level="M" />
        ) : (
          <span className="text-muted text-sm">pairing</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-4xl font-bold tracking-[0.15em]">{code ?? "----"}</p>
        <p className="text-muted mt-1">Scan on your phone</p>
        {url && <p className="text-muted text-xs mt-2 truncate">or /phone/{code}</p>}
      </div>
    </section>
  );
}

const MODES: { id: Mode; label: string }[] = [
  { id: "timer", label: "Timer" },
  { id: "assignment", label: "Assignment" },
  { id: "watch", label: "Watch over me" },
];

function Picker({ onStart }: { onStart: (m: Mode, minutes?: number, task?: string) => void }) {
  const [mode, setMode] = useState<Mode>("timer");
  const [mins, setMins] = useState(50);
  const [task, setTask] = useState("");
  return (
    <section className="flex flex-col gap-5">
      <div role="tablist" aria-label="Lock mode" className="relative grid grid-cols-3 p-1 rounded-[var(--r-control)] bg-ink-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`relative h-10 rounded-[calc(var(--r-control)-4px)] text-sm font-medium ${mode === m.id ? "text-bone" : "text-muted"}`}
          >
            {mode === m.id && (
              <motion.span
                layoutId="seg"
                className="absolute inset-0 bg-graphite-2 rounded-[inherit]"
                transition={{ duration: 0.2, ease: EASE }}
              />
            )}
            <span className="relative">{m.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        {mode === "timer" && (
          <motion.div key="t" {...fade} className="flex flex-col gap-4">
            <div className="flex gap-2" role="group" aria-label="Minutes">
              {[25, 50, 90].map((m) => (
                <button
                  key={m}
                  aria-pressed={mins === m}
                  onClick={() => setMins(m)}
                  className={`${btn} font-mono ${mins === m ? "bg-bone text-ink" : "bg-graphite text-bone-2 hover:bg-graphite-2"}`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <button className={`${primary} self-start`} onClick={() => onStart("timer", mins)}>
              Lock for {mins} min
            </button>
          </motion.div>
        )}
        {mode === "assignment" && (
          <motion.form
            key="a"
            {...fade}
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              onStart("assignment", undefined, task.trim());
            }}
          >
            <label className="flex flex-col gap-2">
              <span>What are you turning in?</span>
              <input className={input} value={task} onChange={(e) => setTask(e.target.value)} placeholder="Problem set 4" />
            </label>
            <button type="submit" className={`${primary} self-start`} disabled={!task.trim()}>
              Lock until it&rsquo;s submitted
            </button>
          </motion.form>
        )}
        {mode === "watch" && (
          <motion.div key="w" {...fade}>
            <Watch onStart={(t) => onStart("watch", 50, t)} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Controls({ s, run }: { s: Session; run: (a: Action) => void }) {
  const [confirm, setConfirm] = useState(false);
  const onBreak = s.status === "break";
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {onBreak ? (
          <button className={primary} onClick={() => run({ type: "endBreak" })}>
            Back to work
          </button>
        ) : (
          <button className={ghost} disabled={s.breaksLeft === 0} onClick={() => run({ type: "break" })}>
            Break · {s.breaksLeft} left
          </button>
        )}
        <button className={ghost} onClick={() => run({ type: "end" })}>
          End session
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {confirm ? (
          <>
            <span className="text-bone-2">Unlock right now?</span>
            <button className={primary} onClick={() => run({ type: "emergency" })}>
              Yes, unlock
            </button>
            <button className={ghost} onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className={`${btn} text-accent hover:bg-graphite`} onClick={() => setConfirm(true)}>
            Emergency
          </button>
        )}
      </div>
      <ul className="mt-4 flex flex-col gap-1 text-sm text-muted">
        {s.log.slice(-5).map((e, i) => (
          <li key={e.at + i} className="flex gap-3">
            <span className="font-mono">{new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span>{e.event}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Timer({ s }: { s: Session }) {
  const onBreak = s.status === "break";
  const until = onBreak ? s.breakUntil : s.endsAt;
  const remaining = useCountdown(until ?? s.startedAt! + 1e12); // ticker even when open-ended
  const total = onBreak ? BREAK_MINUTES * 60000 : until && s.startedAt ? until - s.startedAt : 0;
  const progress = total ? Math.min(1, 1 - remaining / total) : 0;
  const open = !onBreak && !s.endsAt;
  const shown = open ? fmt(Date.now() - (s.startedAt ?? Date.now())) : fmt(remaining);
  const color = onBreak ? "bg-moss-bright" : "bg-accent";
  return (
    <section className="flex flex-col gap-4">
      <p aria-live="polite" className="text-muted">
        {onBreak ? `Break · ${BREAK_MINUTES} min` : open ? "Locked until submitted" : "Locked"}
      </p>
      <p className="font-mono font-bold leading-none text-[clamp(72px,11vw,168px)] tracking-tight">{shown}</p>
      <div className="h-1 w-full bg-graphite rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full w-full origin-left ${color} rounded-full`} style={{ transform: `scaleX(${open ? 1 : progress})`, transition: "transform 250ms linear" }} />
      </div>
      {s.task && <p className="text-xl text-bone-2">{s.task}</p>}
    </section>
  );
}
