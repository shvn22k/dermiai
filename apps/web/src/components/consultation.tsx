"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";

import { Dermi, type DermiMood } from "@/components/dermi";
import { CloseButton, Modal } from "@/components/modal";
import {
  Arrow,
  Avatar,
  Breadcrumb,
  Button,
  buttonClass,
  cx,
  Hatch,
  PainFace,
  StatusChip,
} from "@/components/ui";
import type { ConsultMode } from "@/lib/consult-modes";
import {
  type CaseStatus,
  consultCnn,
  consultPhotos,
  consultSymptoms,
  profile,
  redFlagSymptoms,
} from "@/lib/demo";

const ANGLES = [-45, 45, -30, 60];

function painBand(n: number) {
  if (n <= 3) return "Mild — noticeable but easy to ignore";
  if (n <= 6) return "Moderate — noticeably uncomfortable";
  if (n <= 8) return "Severe — hard to focus on other things";
  return "Very severe — it feels overwhelming";
}

/* ---------- Bubbles ---------- */

function Meta({ children }: { children: ReactNode }) {
  return <span className="caps text-[11px] tracking-[0.08em] text-muted">{children}</span>;
}

function DermiTurn({
  mood = "happy",
  meta,
  wide,
  className,
  children,
}: {
  mood?: DermiMood;
  meta?: ReactNode;
  wide?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2 sm:gap-3">
      <Dermi size={38} mood={mood} className="size-8 sm:size-[38px]" />
      <div
        className={cx(
          "flex min-w-0 flex-col gap-1.5",
          wide ? "max-w-[640px] flex-1" : "max-w-[78%]",
        )}
      >
        <div
          className={cx(
            "rounded-[4px_14px_14px_14px] px-4 py-3.5 text-[15px] leading-relaxed sm:px-[18px]",
            className ?? "bg-merino",
          )}
        >
          {children}
        </div>
        {meta && <Meta>{meta}</Meta>}
      </div>
    </li>
  );
}

function UserTurn({ meta, children }: { meta?: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start justify-end gap-2 sm:gap-3">
      <div className="flex max-w-[78%] flex-col items-end gap-1.5">
        {children}
        {meta && <Meta>{meta}</Meta>}
      </div>
      <span className="hidden sm:block">
        <Avatar initials={profile.initials} />
      </span>
    </li>
  );
}

function UserText({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px_4px_14px_14px] bg-rock-tint px-4 py-3.5 text-[15px] leading-relaxed sm:px-[18px]">
      {children}
    </div>
  );
}

function PhotoAttachment({ label, angle, w = 240 }: { label: string; angle: number; w?: number }) {
  return (
    <Hatch
      angle={angle}
      className="box-border flex aspect-[24/17] max-w-full items-end rounded-[6px] p-2.5"
      style={{ width: w }}
    >
      <span className="caps rounded-[3px] bg-paper px-[7px] py-[3px] text-[10px]">
        Photo · {label}
      </span>
    </Hatch>
  );
}

function NumberedList({ items, size = "11px" }: { items: ReactNode[]; size?: string }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[30px_1fr] border-t border-line py-2">
          <span className="caps text-venice" style={{ fontSize: size }}>
            0{i + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
  );
}

/* ---------- Pain scale ---------- */

function PainScale({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col gap-3.5">
      <span id="pain-q" className="display text-[19px] leading-snug tracking-normal text-venice sm:text-[22px]">
        On a scale of 1 to 10, how would you rate your discomfort?
      </span>
      <div role="group" aria-labelledby="pain-q" className="grid grid-cols-5 gap-1 sm:grid-cols-10">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const on = n === value;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              aria-label={`${n} out of 10`}
              onClick={() => onChange(n)}
              className={cx(
                "flex min-h-[58px] cursor-pointer flex-col items-center gap-0.5 rounded-[6px] py-1.5 sm:min-h-[72px] sm:py-2",
                on
                  ? "border-[1.5px] border-venice bg-venice text-merino"
                  : "border border-line bg-paper text-venice hover:border-venice",
              )}
            >
              <PainFace n={n} />
              <span className="font-display text-[17px] font-normal">{n}</span>
            </button>
          );
        })}
      </div>
      <div className="caps hidden justify-between gap-3 text-[11px] tracking-[0.08em] text-muted sm:flex">
        <span>Barely noticeable</span>
        <span>Worst imaginable</span>
      </div>
      <span className="text-[15px] font-normal text-venice" aria-live="polite">
        {value} — {painBand(value)}
      </span>
    </div>
  );
}

/* ---------- Live summary ---------- */

function LiveSummary({
  mode,
  pain,
  status,
}: {
  mode: ConsultMode;
  pain: number;
  status: { status: CaseStatus; label: string };
}) {
  const isRed = mode === "redflag";
  const predictions = consultCnn.top_k.slice(0, isRed ? 2 : 3);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <span className="caps text-[11px] text-muted">Possible conditions</span>
        {isRed && (
          <ConditionBar name="Possible skin infection" value="review" pct={100} tone="alert" />
        )}
        {predictions.map((p, i) => (
          <ConditionBar
            key={p.condition}
            name={p.condition}
            value={`${Math.round(p.confidence * 100)}%`}
            pct={p.confidence * 100}
            tone={i === 0 && !isRed ? "strong" : "soft"}
          />
        ))}
        <span className="text-xs text-muted">Likelihoods, not a diagnosis.</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="caps text-[11px] text-muted">Key symptoms</span>
        <div className="flex flex-wrap gap-1.5">
          {isRed &&
            redFlagSymptoms.map((s) => (
              <span
                key={s}
                className="rounded-tag bg-alert-tint px-[9px] py-1 text-[13px] font-normal text-alert-text"
              >
                {s}
              </span>
            ))}
          {consultSymptoms.map((s) => (
            <span key={s} className="rounded-tag bg-rock-tint px-[9px] py-1 text-[13px] font-normal">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-line">
        <div className="flex flex-col gap-1 border-r border-line pt-3 pr-3">
          <span className="caps text-[11px] text-muted">Discomfort</span>
          <span className="display text-[38px] leading-none tracking-normal text-venice">
            {pain}
            <span className="text-lg text-muted">/10</span>
          </span>
        </div>
        <div className="flex flex-col gap-2 pt-3 pl-3.5">
          <span className="caps text-[11px] text-muted">Status</span>
          <StatusChip status={status.status} label={status.label} className="self-start" />
        </div>
      </div>
      <p className="m-0 border-t border-line pt-3 text-[13px] leading-normal">
        <span className="caps text-[11px] text-venice">Suspected trigger · </span>
        new body lotion, started Sunday
      </p>
    </div>
  );
}

function ConditionBar({
  name,
  value,
  pct,
  tone,
}: {
  name: string;
  value: string;
  pct: number;
  tone: "alert" | "strong" | "soft";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cx(
          "flex justify-between gap-2 text-sm",
          tone === "alert" ? "text-alert-text" : "text-ink",
        )}
      >
        <span className="font-normal">{name}</span>
        <span className="font-display text-base font-normal">{value}</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-[2px] bg-track">
        <div
          className={cx(
            "h-full",
            tone === "alert" ? "bg-alert" : tone === "strong" ? "bg-venice" : "bg-rock",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- Main view ---------- */

/** Core consultation (design/screens/Consultation + ConsultMobile). */
export function ConsultationView({ initialMode = "default" }: { initialMode?: ConsultMode }) {
  const [mode, setMode] = useState<ConsultMode>(initialMode);
  const [pain, setPain] = useState(6);
  const [satisfied, setSatisfied] = useState<"yes" | "no" | null>(null);
  const [extraPhoto, setExtraPhoto] = useState(false);
  const [enlarged, setEnlarged] = useState<number | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const isRed = mode === "redflag";
  const isAnalyzing = mode === "analyzing";
  const isClosing = mode === "closing";

  const photos = [
    ...consultPhotos,
    ...(isAnalyzing || extraPhoto ? [{ label: "Close-up 2", time: "Just now" }] : []),
  ].map((p, i) => ({ ...p, angle: ANGLES[i % 4]!, busy: isAnalyzing && i === 3 }));
  const lightbox = enlarged !== null ? photos[enlarged] : undefined;

  const status: { status: CaseStatus; label: string } = isRed
    ? { status: "see-dermatologist", label: "See a dermatologist" }
    : isAnalyzing
      ? { status: "open", label: "Updating" }
      : isClosing && satisfied === "yes"
        ? { status: "healing", label: "Healing" }
        : { status: "open", label: "Open" };

  const shutter = () => {
    // Demo: real flow uploads to Supabase, then /api/classify streams VisionStreamEvents.
    setMode("analyzing");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setMode("default");
      setExtraPhoto(true);
    }, 3200);
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSent((s) => [...s, text]);
    setDraft("");
  };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-venice pb-[18px]">
        <div className="flex flex-col gap-2">
          <Breadcrumb
            items={[
              { label: "Cases", href: "/cases" },
              { label: "Consultation · Thu 22 Oct, 9:12 AM" },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3.5">
            <h1 className="display m-0 text-[28px] leading-[1.05] tracking-[-0.03em] text-venice sm:text-[40px]">
              Itchy patch, left forearm
            </h1>
            <StatusChip status={status.status} label={status.label} />
          </div>
        </div>
        <Link href="/cases/contact-dermatitis#report" className={buttonClass("secondary", "sm")}>
          Export report <Arrow>↓</Arrow>
        </Link>
      </header>

      {/* Mobile: collapsible summary strip (ConsultMobile) */}
      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={summaryOpen}
          aria-controls="m-summary"
          onClick={() => setSummaryOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-btn bg-rock px-3.5 py-3 text-left text-ink"
        >
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="caps text-[10px] tracking-[0.12em]">Live summary</span>
            <span className="text-sm font-normal">
              {isRed
                ? "Possible skin infection · review"
                : `${consultCnn.top_k[0].condition} · ${Math.round(consultCnn.top_k[0].confidence * 100)}%`}
            </span>
          </span>
          <span className="display text-2xl tracking-normal">
            {pain}
            <span className="text-[13px]">/10</span>
          </span>
          <span aria-hidden="true" className="caps w-4 text-center text-lg">
            {summaryOpen ? "–" : "+"}
          </span>
        </button>
        {summaryOpen && (
          <div
            id="m-summary"
            className="mt-2 rounded-card border border-line bg-paper p-4"
          >
            <LiveSummary mode={mode} pain={pain} status={status} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section
          aria-label="Conversation with Dermi"
          className="flex min-w-0 flex-[999_1_520px] flex-col rounded-card border border-line bg-paper"
        >
          <ol className="m-0 flex list-none flex-col gap-5 px-[clamp(12px,2.5vw,32px)] py-7">
            <DermiTurn meta="Dermi · 9:12">
              Hi {profile.firstName}, I&apos;m here with you. What&apos;s bothering your skin today?
            </DermiTurn>
            <UserTurn meta="You · 9:14">
              <UserText>
                I&apos;ve had a red, itchy patch on my left forearm for about 4 days. It&apos;s
                getting a bit bumpy.
              </UserText>
              <PhotoAttachment label="left forearm" angle={-45} />
            </UserTurn>
            <DermiTurn mood="thinking" meta="Dermi · 9:14">
              <div className="flex flex-col gap-3">
                <span>
                  Thank you — the photo is clear and really helps. A few gentle questions so I
                  understand it better.
                </span>
                <span className="display border-t border-line pt-2.5 text-[21px] leading-snug tracking-normal text-venice">
                  Have you started any new soap, detergent, lotion or skincare in the last week?
                </span>
              </div>
            </DermiTurn>
            <UserTurn>
              <UserText>Yes — I switched to a new body lotion on Sunday.</UserText>
            </UserTurn>
            <DermiTurn>
              That&apos;s a really useful clue. Does the patch burn or sting, or is it mostly itchy?
            </DermiTurn>
            <UserTurn>
              <UserText>Mostly itchy. It&apos;s worse at night.</UserText>
            </UserTurn>
            <DermiTurn wide meta="Dermi · 9:18 · tap a face, you can change it later">
              <PainScale value={pain} onChange={setPain} />
            </DermiTurn>

            {isAnalyzing && (
              <>
                <UserTurn>
                  <PhotoAttachment label="close-up" angle={45} w={220} />
                </UserTurn>
                <li className="flex items-start gap-2 sm:gap-3" aria-live="polite">
                  <Dermi size={38} mood="thinking" className="size-8 sm:size-[38px]" />
                  <div className="flex max-w-[620px] flex-wrap gap-5 rounded-[4px_14px_14px_14px] bg-merino p-[18px]">
                    <Hatch angle={45} className="relative h-[120px] w-[150px] overflow-hidden rounded-[6px]">
                      <span className="absolute inset-x-0 h-0.5 animate-scan bg-venice" />
                    </Hatch>
                    <div className="flex flex-[1_1_240px] flex-col gap-2.5">
                      <span className="display text-2xl tracking-normal text-venice">
                        Looking closely at your photo…
                      </span>
                      <ol className="m-0 flex list-none flex-col border-b border-line p-0 text-sm">
                        {[
                          ["Sharp and well lit", "Done"],
                          ["Mapping the affected area", "Done"],
                          ["Comparing with your profile", "Now"],
                        ].map(([step, state], i) => (
                          <li
                            key={step}
                            className="grid grid-cols-[28px_1fr_auto] border-t border-line py-[7px]"
                          >
                            <span className="caps text-[11px] text-venice">0{i + 1}</span>
                            <span>{step}</span>
                            <span
                              className={cx(
                                "caps text-[11px] text-venice",
                                state === "Now" && "animate-breathe",
                              )}
                            >
                              {state}
                            </span>
                          </li>
                        ))}
                      </ol>
                      <span className="text-[13px] text-muted">Usually takes a few seconds.</span>
                    </div>
                  </div>
                </li>
              </>
            )}

            {isClosing && (
              <>
                <UserTurn>
                  <UserText>
                    I stopped the lotion yesterday and the itching already feels better.
                  </UserText>
                </UserTurn>
                <DermiTurn wide>
                  <div className="flex flex-col gap-2.5">
                    <span>I&apos;m glad it&apos;s easing. Here&apos;s what we worked out together:</span>
                    <NumberedList
                      size="12px"
                      items={[
                        "This looks most like an allergic reaction to the new lotion.",
                        "Keep it aside, and use a fragrance-free moisturiser twice a day.",
                        "I've set a 6:00 PM reminder and will ask for a photo in two days.",
                        "If it spreads, blisters or you get a fever, please see a dermatologist.",
                      ]}
                    />
                  </div>
                </DermiTurn>
                {/* Dermi never ends a consultation: the person decides (design rule). */}
                <DermiTurn wide className="bg-rock p-5">
                  <div className="flex flex-col gap-3.5 text-ink">
                    <span
                      id="satisfied-q"
                      className="display text-[28px] leading-[1.15] tracking-[-0.01em]"
                    >
                      Are you satisfied with your care?
                    </span>
                    {satisfied === null && (
                      <>
                        <div role="group" aria-labelledby="satisfied-q" className="flex flex-wrap gap-2.5">
                          <Button onClick={() => setSatisfied("yes")}>Yes, I&apos;m satisfied</Button>
                          <Button variant="on-rock" onClick={() => setSatisfied("no")}>
                            Not yet
                          </Button>
                        </div>
                        <span className="text-sm">
                          I&apos;ll keep this consultation open until you decide.
                        </span>
                      </>
                    )}
                    {satisfied === "yes" && (
                      <span aria-live="polite">
                        Thank you, {profile.firstName}. I&apos;ve saved this case as Healing — you
                        can reopen it any time.
                      </span>
                    )}
                    {satisfied === "no" && (
                      <span aria-live="polite">
                        Of course — take your time. What else is on your mind?
                      </span>
                    )}
                  </div>
                </DermiTurn>
              </>
            )}

            {isRed && (
              <>
                <UserTurn>
                  <UserText>
                    Update: it&apos;s spreading up my arm quickly, it feels hot, and I&apos;ve had a
                    fever since last night.
                  </UserText>
                </UserTurn>
                <li className="flex items-start gap-2 sm:gap-3">
                  <Dermi size={38} mood="concerned" className="size-8 sm:size-[38px]" />
                  <div
                    role="alert"
                    className="flex max-w-[640px] flex-col gap-3.5 rounded-[4px_14px_14px_14px] border border-alert-border bg-alert-tint p-[22px]"
                  >
                    <span className="caps text-xs font-semibold tracking-[0.12em] text-alert-text">
                      Please read · this needs a doctor
                    </span>
                    <span className="display text-[30px] leading-[1.12] tracking-[-0.01em] text-alert-deep">
                      I&apos;d like a dermatologist to see this soon.
                    </span>
                    <p className="m-0 text-[15px] leading-[1.65] text-alert-ink">
                      A rash that spreads quickly, feels hot and comes with a fever can be a sign of
                      a skin infection that needs proper treatment. There&apos;s no need to panic —
                      but please don&apos;t wait on this one. Try to see a dermatologist or doctor{" "}
                      <span className="font-medium">within the next 24 hours</span>.
                    </p>
                    <p className="m-0 border-t border-alert-border pt-3 text-sm leading-relaxed text-alert-ink">
                      If you feel very unwell, the redness spreads fast over the next few hours, or
                      you have trouble breathing, go to the nearest emergency department.
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {/* Clinic finder not designed yet */}
                      <a href="#" className={buttonClass("alert")}>
                        Find a dermatologist nearby <Arrow />
                      </a>
                      <Link
                        href="/cases/contact-dermatitis#report"
                        className={buttonClass("alert-outline")}
                      >
                        Download case report <Arrow>↓</Arrow>
                      </Link>
                    </div>
                    <span className="text-[13px] text-alert-deep">
                      I&apos;m still here if you have questions while you arrange this.
                    </span>
                  </div>
                </li>
              </>
            )}

            {sent.map((text, i) => (
              <UserTurn key={i} meta="You · just now">
                <UserText>{text}</UserText>
              </UserTurn>
            ))}
          </ol>

          <form
            onSubmit={send}
            className="mt-auto flex items-center gap-2.5 border-t border-line px-[clamp(12px,2.5vw,24px)] pt-4 pb-[18px]"
          >
            <Button
              variant="secondary"
              className="min-h-[46px] shrink-0 px-3.5 text-xs"
              onClick={() => setMode("camera")}
              aria-label="Add a photo"
            >
              <span aria-hidden="true">+</span>
              <span className="hidden sm:inline">Photo</span>
            </Button>
            <label htmlFor="composer" className="sr-only">
              Message Dermi
            </label>
            <input
              id="composer"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Tell Dermi more…"
              autoComplete="off"
              className="min-h-[46px] min-w-0 flex-1 border-0 border-b-[1.5px] border-venice bg-transparent px-1 text-base font-light text-ink outline-none placeholder:text-muted/70"
            />
            <Button type="submit" className="min-h-[46px] shrink-0 px-[18px] text-xs">
              Send <Arrow />
            </Button>
          </form>
        </section>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <section
            aria-label="You"
            className="flex flex-col gap-4 rounded-card border border-line bg-paper p-5"
          >
            <div className="flex items-center gap-3.5">
              <Avatar initials={profile.initials} size={58} />
              <div className="flex flex-col gap-[3px]">
                <span className="display text-2xl tracking-normal text-venice">{profile.name}</span>
                <span className="text-[13px] text-muted">
                  {profile.skinType} · Type {profile.fitzpatrick} · {profile.allergies[0]} allergy
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setMode("camera")}>
                Capture photo
              </Button>
              <Button variant="secondary">Upload</Button>
            </div>
          </section>

          <section
            aria-labelledby="gal-h"
            className="flex flex-col gap-3.5 rounded-card border border-line bg-paper p-5"
          >
            <div className="flex items-baseline justify-between">
              <h2 id="gal-h" className="caps m-0 text-[13px] tracking-[0.12em] text-venice">
                Uploaded images
              </h2>
              <span className="text-[13px] text-muted">{photos.length} photos</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {photos.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  aria-label={`Enlarge ${p.label}, ${p.time}`}
                  onClick={() => setEnlarged(i)}
                  className="flex cursor-zoom-in flex-col gap-1.5 bg-transparent p-0 text-left text-ink"
                >
                  <Hatch angle={p.angle} className="relative aspect-[4/3] w-full rounded-[5px]">
                    {p.busy && (
                      <span className="caps absolute top-1.5 left-1.5 rounded-[3px] bg-venice px-1.5 py-[3px] text-[9px] text-merino">
                        Analyzing
                      </span>
                    )}
                  </Hatch>
                  <span className="flex justify-between gap-1.5 text-xs">
                    <span className="font-normal">{p.label}</span>
                    <span className="text-muted">{p.time}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="sum-h"
            aria-live="polite"
            className={cx(
              "hidden flex-col gap-4 rounded-card bg-paper p-5 lg:flex",
              isRed ? "border-[1.5px] border-alert-border" : "border border-line",
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-venice pb-3">
              <h2 id="sum-h" className="display m-0 text-[26px] tracking-normal text-venice">
                Live case summary
              </h2>
              <span className="caps animate-breathe-slow text-[10px] text-venice">
                {isAnalyzing ? "Updating…" : "Live"}
              </span>
            </div>
            <LiveSummary mode={mode} pain={pain} status={status} />
          </section>
        </aside>
      </div>

      <Modal open={mode === "camera"} onClose={() => setMode("default")} labelledBy="cam-h">
        <section className="flex flex-col gap-[18px] p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-venice pb-3.5">
            <h2 id="cam-h" className="display m-0 text-[30px] tracking-normal text-venice">
              Capture photo
            </h2>
            <CloseButton onClick={() => setMode("default")} label="Close camera" />
          </div>
          {/* Viewfinder placeholder: getUserMedia preview goes here. */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[6px] bg-ink">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(-45deg, rgb(132 179 206 / 0.16) 0 1px, transparent 1px 9px)",
              }}
            />
            <span className="absolute top-[20%] left-[24%] size-10 rounded-tl-[6px] border-t-2 border-l-2 border-merino" />
            <span className="absolute top-[20%] right-[24%] size-10 rounded-tr-[6px] border-t-2 border-r-2 border-merino" />
            <span className="absolute bottom-[20%] left-[24%] size-10 rounded-bl-[6px] border-b-2 border-l-2 border-merino" />
            <span className="absolute right-[24%] bottom-[20%] size-10 rounded-br-[6px] border-r-2 border-b-2 border-merino" />
            <span className="caps absolute inset-x-4 top-4 text-center text-[11px] text-merino sm:text-xs">
              Fit the patch and a little healthy skin inside the corners
            </span>
            <span className="caps absolute bottom-3.5 left-4 rounded-[3px] bg-merino px-2 py-1 text-[11px] text-venice">
              Light is good
            </span>
          </div>
          <div className="grid grid-cols-1 border-y border-line text-sm sm:grid-cols-3">
            {["Natural light, no flash", "About 15 cm away", "Hold still for a second"].map(
              (tip, i) => (
                <span
                  key={tip}
                  className="border-line py-3 max-sm:border-b max-sm:last:border-b-0 sm:border-r sm:px-3 sm:first:pl-0 sm:last:border-r-0"
                >
                  <span className="caps text-[11px] text-venice">0{i + 1} </span>
                  {tip}
                </span>
              ),
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setMode("default")}>
              Cancel
            </Button>
            <button
              type="button"
              aria-label="Take photo"
              onClick={shutter}
              className="size-[76px] cursor-pointer rounded-full border-2 border-venice bg-paper p-1.5"
            >
              <span className="block size-full rounded-full bg-venice" />
            </button>
            <Button variant="secondary">Flip</Button>
          </div>
        </section>
      </Modal>

      <Modal
        open={lightbox !== undefined}
        onClose={() => setEnlarged(null)}
        label={lightbox?.label}
        className="w-[min(820px,calc(100%-32px))]"
      >
        {lightbox && (
          <section className="flex flex-col gap-3.5 p-5">
            <div className="flex items-center justify-between">
              <span className="flex flex-col gap-0.5">
                <span className="display text-[26px] tracking-normal text-venice">
                  {lightbox.label}
                </span>
                <span className="caps text-[11px] text-muted">{lightbox.time}</span>
              </span>
              <CloseButton onClick={() => setEnlarged(null)} />
            </div>
            <Hatch angle={-45} step={9} className="aspect-[4/3] w-full rounded-[6px]" />
          </section>
        )}
      </Modal>
    </>
  );
}
