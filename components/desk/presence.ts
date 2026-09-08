"use client";
import { useEffect, useRef, useState, type RefObject } from "react";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL = "/mediapipe/blaze_face_short_range.tflite";
const EVERY_MS = 250;

export type Presence = { faces: number | null; error: string };

/** Runs BlazeFace on the video element ~4x/s. faces === null while the model loads. Nothing leaves the browser. */
export function usePresence(video: RefObject<HTMLVideoElement | null>, stream: MediaStream | null): Presence {
  const [faces, setFaces] = useState<number | null>(null);
  const [error, setError] = useState("");
  const last = useRef(0);

  useEffect(() => {
    if (!stream || !video.current) return;
    const el = video.current;
    el.srcObject = stream;
    let alive = true;
    let id: ReturnType<typeof setInterval> | undefined;
    let detector: { detectForVideo: (v: HTMLVideoElement, ts: number) => { detections: unknown[] }; close: () => void } | null = null;

    (async () => {
      try {
        const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const fileset = await FilesetResolver.forVisionTasks(WASM);
        detector = await FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });
        if (!alive) return;
        id = setInterval(() => {
          if (!detector || el.readyState < 2) return;
          const ts = Math.max(performance.now(), last.current + 1); // timestamps must increase
          last.current = ts;
          setFaces(detector.detectForVideo(el, ts).detections.length);
        }, EVERY_MS);
      } catch (e) {
        setError(`Face model failed to load: ${(e as Error).message}`);
      }
    })();

    return () => {
      alive = false;
      if (id) clearInterval(id);
      detector?.close();
      stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream, video]);

  return { faces, error };
}

export async function openCamera(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
}
