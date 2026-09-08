import Link from "next/link";

export const metadata = { title: "Cage · Brag" };

export default function Brag() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col justify-center gap-6 px-6 py-12">
      <h1 className="font-display text-4xl font-bold">Cage, in 20 seconds.</h1>
      <video
        src="/brag.mp4"
        poster="/brag.jpg"
        controls
        playsInline
        className="w-full rounded-[var(--r-outer)] bg-ink-2"
      />
      <p className="text-muted">
        <Link href="/" className="text-bone underline underline-offset-4">Site</Link>
        {" · "}
        <a href="/brag.mp4" download className="text-bone underline underline-offset-4">Download mp4</a>
      </p>
    </main>
  );
}
