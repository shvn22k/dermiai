import Link from "next/link";

import { Dermi } from "@/components/dermi";
import { Logo } from "@/components/nav";
import { Arrow, LinkButton } from "@/components/ui";

const STEPS = [
  {
    title: "Snap",
    body: "Take a clear photo of what's bothering you. Dermi guides you on light and distance so the picture is actually useful.",
  },
  {
    title: "Talk to Dermi",
    body: "Dermi asks gentle follow-up questions — when it started, what changed, how it feels — and builds a case summary as you chat.",
  },
  {
    title: "Track healing",
    body: "Each concern becomes a case with photos, pain scores and reminders, so you can see it getting better over time.",
  },
];

const SAFETY = [
  {
    term: "Red flags",
    body: "If something looks serious — spreading fast, a fever, a mole that's changing — Dermi says so calmly and clearly.",
  },
  {
    term: "Doctor handoff",
    body: "Photos, timeline and symptoms in one printable report your dermatologist can read in a minute.",
  },
  {
    term: "Your call",
    body: "Dermi never closes a consultation on its own. You decide when you're cared for.",
  },
];

const wrap = "mx-auto max-w-7xl px-[clamp(20px,4vw,48px)]";

/** Landing (design/screens/Main.dc.html). */
export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <header className="border-b border-venice">
        <div className={`${wrap} flex flex-wrap items-center justify-between gap-4 py-[18px]`}>
          <Logo />
          <nav
            aria-label="Primary"
            className="caps flex flex-wrap items-center gap-1 text-[13px]"
          >
            <a href="#how" className="p-3.5 no-underline">
              How it works
            </a>
            <a href="#safety" className="p-3.5 no-underline">
              Safety
            </a>
            <Link href="/sign-in" className="p-3.5 no-underline">
              Sign in
            </Link>
            <LinkButton href="/onboarding" size="md" className="ml-2">
              Get started
            </LinkButton>
          </nav>
        </div>
      </header>

      <section
        className={`${wrap} grid grid-cols-[repeat(auto-fit,minmax(min(500px,100%),1fr))] items-center gap-16 pt-[72px] pb-[104px]`}
      >
        <div className="flex flex-col items-start gap-7">
          <span className="caps text-sm tracking-[0.12em] text-venice">
            A calm skin-health companion
          </span>
          <h1 className="display m-0 text-[clamp(48px,6vw,84px)] leading-none tracking-[-0.035em] text-balance text-venice">
            A gentle second pair of eyes for your skin.
          </h1>
          <p className="m-0 max-w-[500px] text-[19px] leading-[1.65] text-pretty">
            Snap a photo, talk it through with Dermi, and keep track of how your skin heals — in one
            quiet, caring place.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/onboarding" size="lg">
              Get started, it&apos;s free <Arrow />
            </LinkButton>
            <LinkButton href="/sign-in" size="lg" variant="secondary">
              Sign in
            </LinkButton>
          </div>
          <div className="grid max-w-[520px] grid-cols-[120px_1fr] gap-4 border-t border-line pt-[18px]">
            <span className="caps text-xs text-venice">A note on care</span>
            <span className="text-[15px] leading-relaxed">
              Dermi supports, not replaces, a dermatologist. If something needs a doctor, Dermi will
              tell you plainly.
            </span>
          </div>
        </div>

        <div className="relative min-h-[480px] sm:min-h-[560px]" aria-hidden="true">
          <div className="absolute inset-y-0 right-0 left-[8%] rounded-card bg-rock" />
          <div className="absolute bottom-10 left-[22%]">
            <Dermi size={300} body="#F5EEDD" className="size-[220px] sm:size-[300px]" />
          </div>
          <div className="absolute top-11 left-0 flex w-[min(270px,80%)] -rotate-[2.5deg] flex-col gap-2.5 rounded-tag border border-line bg-paper px-[22px] py-5">
            <span className="caps text-[11px] text-venice">Dermi asks</span>
            <span className="display text-[23px] leading-tight tracking-normal text-ink">
              How long has it been itchy — and is it worse at night?
            </span>
          </div>
          <div className="absolute right-7 bottom-16 flex w-[220px] rotate-[1.8deg] flex-col gap-2 rounded-tag bg-venice px-[18px] py-4 text-merino">
            <span className="caps text-[11px]">Left forearm · healing</span>
            <span className="display text-[40px] leading-none">6 → 2</span>
            <span className="text-[13px]">itch score, this week</span>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-venice">
        <div className={wrap}>
          <div className="flex flex-wrap items-baseline justify-between gap-4 pt-14 pb-10">
            <h2 className="display m-0 text-[clamp(36px,4vw,52px)] tracking-[-0.03em] text-venice">
              How it works
            </h2>
            <span className="caps text-[13px] text-venice">Three small steps, at your own pace</span>
          </div>
          <ol className="m-0 grid list-none grid-cols-1 border-t border-line p-0 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-4 border-line py-9 md:border-r md:px-8 md:pb-14 md:first:pl-0 md:last:border-r-0 md:last:pr-0 max-md:border-b max-md:last:border-b-0"
              >
                {/* Rock Blue numerals are decorative; the heading carries the meaning. */}
                <span aria-hidden="true" className="display text-[64px] leading-none text-rock">
                  0{i + 1}
                </span>
                <h3 className="caps m-0 text-[15px] tracking-[0.12em] text-venice">{step.title}</h3>
                <p className="m-0 text-base leading-[1.65]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="safety" className="bg-venice text-merino">
        <div
          className={`${wrap} grid grid-cols-[repeat(auto-fit,minmax(min(460px,100%),1fr))] gap-14 py-24`}
        >
          <div className="flex flex-col gap-[22px]">
            <span className="caps text-[13px] tracking-[0.12em]">Safety first</span>
            <h2 className="display m-0 text-[clamp(36px,4vw,56px)] leading-[1.05] tracking-[-0.03em] text-balance">
              Dermi supports, not replaces, a dermatologist.
            </h2>
            <p className="m-0 max-w-[520px] text-[17px] leading-[1.7]">
              Dermi helps you understand what you&apos;re seeing, keep track of changes and prepare
              for an appointment. It can&apos;t diagnose you or prescribe treatment.
            </p>
          </div>
          <dl className="m-0 flex flex-col border-b border-merino/35">
            {SAFETY.map((item) => (
              <div
                key={item.term}
                className="grid grid-cols-1 gap-2 border-t border-merino/35 py-[22px] sm:grid-cols-[160px_1fr] sm:gap-5"
              >
                <dt className="text-sm">{item.term}</dt>
                <dd className="m-0 text-base leading-relaxed">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-[clamp(20px,4vw,48px)] py-[104px]">
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-6 text-center">
          <Dermi size={132} />
          <h2 className="display m-0 text-[clamp(40px,5vw,56px)] tracking-[-0.03em] text-venice">
            Ready when you are.
          </h2>
          <p className="m-0 text-lg leading-relaxed">
            Set up your skin profile in about two minutes, then start your first consultation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <LinkButton href="/onboarding" size="lg">
              Get started
            </LinkButton>
            <LinkButton href="/sign-in" size="lg" variant="ghost">
              I have an account <Arrow />
            </LinkButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-venice">
        <div
          className={`${wrap} caps flex flex-wrap items-center justify-between gap-4 py-[22px] text-[13px] text-venice`}
        >
          <span>© 2026 DermiAI</span>
          <nav aria-label="Footer" className="flex gap-[22px]">
            {/* Pages not designed yet */}
            <a href="#" className="no-underline">
              Privacy
            </a>
            <a href="#" className="no-underline">
              Terms
            </a>
            <a href="#" className="no-underline">
              Contact
            </a>
          </nav>
          <span>Not a substitute for medical advice</span>
        </div>
      </footer>
    </div>
  );
}
