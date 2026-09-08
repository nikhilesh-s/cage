"use client";
import { useEffect, useRef, useState } from "react";

const STILL = 3; // mean abs pixel diff below this = no movement
const AWAY_AFTER = 20; // seconds

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

export default function Watch({ onStart }: { onStart: (task: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camErr, setCamErr] = useState("");
  const [presence, setPresence] = useState<"present" | "away?">("present");
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const rec = useRef<Rec | null>(null);
  const Speech = speechCtor();

  // presence heuristic: frame diff on a 32x24 canvas every second
  useEffect(() => {
    if (!stream || !video.current) return;
    video.current.srcObject = stream;
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 24;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    let prev: Uint8ClampedArray | null = null;
    let still = 0;
    const id = setInterval(() => {
      if (!video.current) return;
      ctx.drawImage(video.current, 0, 0, 32, 24);
      const cur = ctx.getImageData(0, 0, 32, 24).data;
      if (prev) {
        let sum = 0;
        for (let i = 0; i < cur.length; i += 4) sum += Math.abs(cur[i] - prev[i]) + Math.abs(cur[i + 1] - prev[i + 1]) + Math.abs(cur[i + 2] - prev[i + 2]);
        const diff = sum / (cur.length / 4) / 3;
        still = diff < STILL ? still + 1 : 0;
        setPresence(still >= AWAY_AFTER ? "away?" : "present");
      }
      prev = cur;
    }, 1000);
    return () => {
      clearInterval(id);
      stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);
  useEffect(() => () => rec.current?.stop(), []);

  const camera = async () => {
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ video: true }));
      setCamErr("");
    } catch {
      setCamErr("Camera unavailable. Type your task below instead.");
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

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-[240px] aspect-[4/3] rounded-[var(--r-inner)] bg-ink-2 overflow-hidden grid place-items-center">
        <video ref={video} autoPlay muted playsInline className={`size-full object-cover ${stream ? "" : "hidden"}`} />
        {!stream && (
          <button onClick={camera} className="h-11 px-4 rounded-[var(--r-control)] bg-graphite text-bone hover:bg-graphite-2 font-medium">
            Turn on camera
          </button>
        )}
        {stream && <span aria-hidden className="absolute top-3 left-3 size-2.5 rounded-full bg-accent animate-pulse" />}
      </div>
      {camErr && <p className="text-sm text-muted">{camErr}</p>}
      {stream && (
        <p className="text-sm text-muted" aria-live="polite">
          camera on · presence only, nothing is uploaded. <span className="text-bone">{presence}</span>
        </p>
      )}

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
        <button type="submit" disabled={!typed.trim()} className="h-11 px-4 self-start rounded-[var(--r-control)] bg-accent text-ink hover:bg-accent-deep font-medium disabled:opacity-40">
          Lock for 50 min
        </button>
      </form>
    </div>
  );
}
