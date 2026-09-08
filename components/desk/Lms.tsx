"use client";
import { useState } from "react";

const field = "h-11 w-full rounded-[var(--r-control)] bg-ink border border-graphite-2 px-3 text-bone placeholder:text-muted";

export default function Lms({ active, submitted, onSubmit }: { active: boolean; submitted: boolean; onSubmit: () => void }) {
  const [file, setFile] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  return (
    <form
      className={`bg-graphite rounded-[var(--r-outer)] p-6 flex flex-col gap-4 transition-opacity duration-200 ${active ? "" : "opacity-40"}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Submit assignment</h2>
        <span className="text-xs text-muted">demo LMS</span>
      </div>
      <fieldset disabled={!active || submitted} className="contents">
        <label className="flex flex-col gap-2 text-sm">
          Course
          <input className={field} placeholder="MATH 201" />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Assignment title
          <input className={field} placeholder="Problem set 4" />
        </label>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            setFile(e.dataTransfer.files[0]?.name ?? null);
          }}
          className={`h-28 rounded-[var(--r-inner)] border border-dashed grid place-items-center text-sm cursor-pointer ${over ? "border-bone bg-ink-2" : "border-graphite-2"}`}
        >
          <span className={file ? "text-bone" : "text-muted"}>{file ?? "Drop a file or click to choose"}</span>
          <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
        </label>
        <button type="submit" className="h-11 px-4 self-start rounded-[var(--r-control)] bg-bone text-ink font-medium disabled:opacity-60">
          Submit assignment
        </button>
      </fieldset>
      {submitted && (
        <p aria-live="polite" className="text-moss-bright font-medium">
          Submitted · phone unlocked
        </p>
      )}
    </form>
  );
}
