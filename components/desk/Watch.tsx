"use client";
import { useEffect, useRef, useState } from "react";
import { openCamera, usePresence } from "./presence";

type Rec = { start(): void; stop(): void; continuous: boolean; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
function speechCtor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function parseTask(t: string): string | null {
  if (!/watch over me/i.test(t)) return null;
  const m = t.match(/(?:want to|going to|gonna)\s+(.+?)\s*[,.!?;]*\s*(?:can you\s+|could you\s+|please\s+)?watch over me/i);
  const task = (m?.[1] ?? t).replace(/[\s,.!?;]+$/, "").trim();
  return task || t.trim();
}

/** Setup step: prove the camera sees you, then say or type the task. Watching itself happens in <Watcher/> once locked. */
export default function Watch({ onStart }: { onStart: (task: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camErr, setCamErr] = useState("");
  const { faces, error } = usePresence(video, stream);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const rec = useRef<Rec | null>(null);
  const Speech = speechCtor();
  const seen = faces !== null && faces > 0;

  useEffect(() => () => rec.current?.stop(), []);

  const camera = async () => {
    try {
      setStream(await openCamera());
      setCamErr("");
    } catch {
      setCamErr("Camera blocked. Allow it in the address bar, then try again.");
    }
  };

  const go = (text: string) => {
    const task = parseTask(text) ?? text.trim();
    if (!task) return;
    setHeard(task);
    rec.current?.stop();
    onStart(task);
  };

  const listen = () => {
    if (!Speech) return;
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = new Speech();
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
      setHeard(t.trim());
      if (/watch over me/i.test(t)) go(t);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  };

  const status = !stream
    ? ""
    : error
      ? error
      : faces === null
        ? "loading face model…"
        : seen
          ? "I can see you."
          : "No face in frame. Sit where the camera sees you.";

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-[240px] aspect-[4/3] rounded-[var(--r-inner)] bg-ink-2 overflow-hidden grid place-items-center">
        <video ref={video} autoPlay muted playsInline className={`size-full object-cover ${stream ? "" : "hidden"}`} />
        {!stream && (
          <button onClick={camera} className="h-11 px-4 rounded-[var(--r-control)] bg-graphite text-bone hover:bg-graphite-2 font-medium">
            Turn on camera
          </button>
        )}
        {stream && <span aria-hidden className={`absolute top-3 left-3 size-2.5 rounded-full ${seen ? "bg-moss-bright" : "bg-accent"}`} />}
      </div>
      {camErr && <p className="text-sm text-muted">{camErr}</p>}
      {status && (
        <p className="text-sm text-muted" aria-live="polite">
          <span className={seen ? "text-moss-bright" : "text-bone"}>{status}</span> Runs in your browser, nothing is uploaded.
        </p>
      )}
      <p className="text-sm text-muted">Leave the frame without pressing Break and the timer grows 5 min. Every time.</p>

      <div className="flex flex-col gap-2">
        {Speech ? (
          <button onClick={listen} aria-pressed={listening} className="h-11 px-4 self-start rounded-[var(--r-control)] bg-graphite text-bone hover:bg-graphite-2 font-medium">
            {listening ? "Listening… say “watch over me”" : "Listen"}
          </button>
        ) : (
          <p className="text-sm text-muted">Voice not supported here. Type it instead.</p>
        )}
        {heard && (
          <p className="text-sm text-bone-2" aria-live="polite">
            Heard: {heard}
          </p>
        )}
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          go(typed);
        }}
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm">Or type it</span>
          <input
            className="h-11 w-full rounded-[var(--r-control)] bg-ink-2 border border-graphite-2 px-3 text-bone placeholder:text-muted"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="I want to finish the lab report, watch over me"
          />
        </label>
        <button type="submit" disabled={!typed.trim() || !seen} className="h-11 px-4 self-start rounded-[var(--r-control)] bg-accent text-ink hover:bg-accent-deep font-medium disabled:opacity-40">
          {seen ? "Lock for 50 min" : "Camera must see you first"}
        </button>
      </form>
    </div>
  );
}
