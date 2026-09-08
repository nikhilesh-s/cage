import Link from "next/link";
import { CageHero } from "@/components/landing/CageHero";
import { Reveal } from "@/components/landing/Reveal";

const STEPS = [
  ["Plug in", "The cage sits on your desk and charges the phone from your laptop."],
  ["Pick a lock", "A timer, until the assignment is submitted, or watch-over-me with voice and camera."],
  ["Submit. It opens.", "The latch releases when the work is in. Not before."],
];

const GUARDRAILS = [
  ["Emergency button", "Opens the cage at once. No questions."],
  ["Breaks per session", "Short, counted, and shown on the timer."],
  ["Visible timer", "A progress bar you can read from across the room."],
];

export default function Home() {
  return (
    <main className="bg-ink text-bone">
      {/* hero */}
      <section className="mx-auto grid min-h-[100dvh] max-w-[1400px] grid-cols-1 items-end gap-8 px-5 pb-16 pt-16 sm:px-8 md:pt-24 lg:grid-cols-12 lg:items-center lg:gap-6 lg:pb-24">
        <div className="lg:col-span-7">
          <h1 className="font-display text-[clamp(6rem,24vw,19rem)] font-extrabold leading-[0.85] tracking-[-0.05em] text-bone">
            Cage
          </h1>
          <p className="mt-8 max-w-[18ch] font-display text-3xl font-bold leading-[1.1] tracking-[-0.01em] sm:text-4xl lg:text-5xl">
            Locked until the assignment is in.
          </p>
          <p className="mt-4 max-w-[38ch] text-lg text-bone-2">
            A phone cage that plugs into your laptop, charges the phone, and only opens when you submit.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/desk"
              className="inline-flex h-12 items-center rounded-[var(--r-control)] bg-accent px-6 text-base font-semibold text-ink hover:bg-accent-deep"
            >
              Open the desk
            </Link>
            <a href="#how" className="text-base font-medium text-bone-2 underline-offset-4 hover:text-bone hover:underline">
              How it works
            </a>
          </div>
        </div>
        <div className="flex justify-center lg:col-span-5 lg:justify-end lg:pr-8">
          <CageHero />
        </div>
      </section>

      {/* the problem */}
      <section className="border-t border-graphite">
        <Reveal className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 md:py-32">
          <p className="font-mono text-[clamp(4rem,14vw,11rem)] font-bold leading-none tracking-[-0.04em] text-accent">
            5-20 min
          </p>
          <p className="mt-6 max-w-[30ch] font-display text-2xl font-bold leading-[1.15] sm:text-3xl">
            to refocus after one notification.
          </p>
          <p className="mt-4 max-w-[52ch] text-lg text-bone-2">
            Every buzz is a task switch. A "lock in" reminder from the group chat is one more buzz, and it puts the phone back in your hand.
          </p>
        </Reveal>
      </section>

      {/* how it works */}
      <section id="how" className="scroll-mt-8 border-t border-graphite">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 md:py-32">
          <Reveal>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">How it works</h2>
          </Reveal>
          <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map(([title, body], i) => (
              <li key={title}>
                <Reveal delay={i * 0.05} className="border-t border-graphite-2 pt-5">
                  <span className="font-mono text-sm text-accent">0{i + 1}</span>
                  <h3 className="mt-3 font-display text-2xl font-bold">{title}</h3>
                  <p className="mt-2 max-w-[34ch] text-base text-bone-2">{body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* guardrails */}
      <section className="border-t border-graphite">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 md:py-32">
          <Reveal>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Guardrails</h2>
            <p className="mt-3 max-w-[40ch] text-lg text-bone-2">Locked, not trapped.</p>
          </Reveal>
          <dl className="mt-12 max-w-[880px] space-y-6">
            {GUARDRAILS.map(([term, body], i) => (
              <Reveal key={term} delay={i * 0.05} className="grid grid-cols-1 gap-y-1 sm:grid-cols-[220px_1fr] sm:gap-x-12">
                <dt className="font-display text-xl font-bold">{term}</dt>
                <dd className="text-base text-bone-2 sm:pt-0.5">{body}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <footer className="border-t border-graphite">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-base text-muted sm:px-8">
          <p>Cage, a demo. No phones were harmed.</p>
          <Link href="/desk" className="text-bone-2 hover:text-bone">Open the desk</Link>
        </div>
      </footer>
    </main>
  );
}
