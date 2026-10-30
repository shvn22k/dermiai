"use client";

import { useParams } from "next/navigation";
import { type ChangeEvent, useRef, useState } from "react";

import { Dermi } from "@/components/dermi";
import { CloseButton, Modal } from "@/components/modal";
import {
  Arrow,
  Breadcrumb,
  Button,
  buttonClass,
  fieldLabelClass,
  Hatch,
  LinkButton,
  PageHeader,
  PainFace,
  StatusChip,
  cx,
  underlineInputClass,
} from "@/components/ui";
import { processFile } from "@/demo/client";
import { DemoGate } from "@/demo/gate";
import { demo, makeEvent, newId, now, shortDate, whenLabel } from "@/demo/store";
import type { DemoCase, DemoPhoto, DemoState } from "@/demo/types";
import type { TimelineKind } from "@/lib/demo";

const KIND_COLOR: Record<TimelineKind, string> = {
  "Check-in": "text-venice",
  Status: "text-venice",
  Consultation: "text-venice",
  Ingredients: "text-alert-text",
  Reminder: "text-muted",
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

/** Case timeline + printable report (design/screens/CaseDetail.dc.html), from browser demo state. */
export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  return (
    <DemoGate>
      {(s) => {
        const c = s.cases.find((x) => x.id === caseId && x.started);
        if (!c) {
          return (
            <div className="flex flex-col items-start gap-4">
              <h1 className="display m-0 text-[40px] text-venice">Case not found</h1>
              <p className="m-0">This case isn&apos;t in this browser&apos;s demo data.</p>
              <LinkButton href="/cases" variant="secondary">
                All cases
              </LinkButton>
            </div>
          );
        }
        return <CaseDetail c={c} s={s} />;
      }}
    </DemoGate>
  );
}

function Photo({ photo, className, angle = -45 }: { photo?: DemoPhoto; className: string; angle?: number }) {
  return photo?.dataUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- data URL from browser storage
    <img src={photo.dataUrl} alt={photo.label} className={cx(className, "object-cover")} />
  ) : (
    <Hatch angle={angle} step={6} className={className} />
  );
}

function CaseDetail({ c, s }: { c: DemoCase; s: DemoState }) {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const trend = c.pains.slice(-7);
  const first = c.pains[0]?.value;
  const last = c.pains.at(-1)?.value;
  const redFlag = c.status === "see-dermatologist" || c.events.some((e) => e.title.includes("See a dermatologist"));
  const consultations = c.events.filter((e) => e.kind === "Consultation" && e.title !== "Photo added").length;
  const profile = s.profile;
  const firstUser = c.turns.find((t) => t.role === "user" && t.text)?.text;
  const photoById = (id: string) => c.photos.find((p) => p.id === id);

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={c.title}
          eyebrow={
            <Breadcrumb
              items={[{ label: "Cases", href: "/cases" }, { label: c.area ? c.area[0]!.toUpperCase() + c.area.slice(1) : "Case" }]}
            />
          }
          badge={<StatusChip status={c.status} />}
          aside={
            <div className="flex flex-wrap gap-2.5">
              <LinkButton href={`/consult?case=${c.id}`}>
                Continue with Dermi <Arrow />
              </LinkButton>
              <Button variant="secondary" onClick={() => setCheckInOpen(true)}>
                Log a check-in <Arrow>+</Arrow>
              </Button>
            </div>
          }
        >
          <span className="text-sm text-muted">
            Opened {shortDate(c.createdAt)} · {Math.max(consultations, 1)}{" "}
            {consultations === 1 ? "consultation" : "consultations"} · {c.photos.length}{" "}
            {c.photos.length === 1 ? "photo" : "photos"}
          </span>
        </PageHeader>
      </div>

      <div className="flex flex-wrap items-start gap-10">
        <section aria-labelledby="tl-h" className="flex min-w-0 flex-[999_1_460px] flex-col gap-8 print:hidden">
          <div className="flex flex-wrap items-end gap-8">
            <div className="flex flex-[1_1_260px] flex-col gap-3.5">
              <span className="caps text-xs text-venice">Discomfort over time</span>
              {trend.length >= 2 ? (
                <>
                  <div
                    role="img"
                    aria-label={`Discomfort scores: ${trend.map((t) => `${t.value} on ${shortDate(t.at)}`).join(", ")}`}
                    className="flex h-[110px] items-end gap-2.5 border-b border-venice"
                  >
                    {trend.map((t, i) => (
                      <div key={t.at + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        <span className="font-display text-base text-venice">{t.value}</span>
                        <div
                          className={`w-full max-w-10 rounded-t-[3px] ${i === trend.length - 1 ? "bg-venice" : "bg-rock"}`}
                          style={{ height: Math.round((t.value / 10) * 70 + 4) }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2.5" aria-hidden="true">
                    {trend.map((t, i) => (
                      <span key={t.at + i} className="caps flex-1 text-center text-[10px] tracking-[0.08em] text-muted">
                        {shortDate(t.at)}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="m-0 border-b border-venice pb-4 text-sm text-muted">
                  Log a check-in every couple of days and your trend appears here.
                </p>
              )}
            </div>
            <dl className="m-0 grid min-w-[260px] grid-cols-2 border-t border-line">
              <div className="border-r border-line pt-3.5 pr-[18px]">
                <dt className="caps text-[11px] text-muted">Since start</dt>
                <dd className="display mt-1.5 mb-0 ml-0 text-[40px] leading-none tracking-normal text-venice">
                  {first === undefined ? "–" : first === last ? first : `${first} → ${last}`}
                </dd>
              </div>
              <div className="pt-3.5 pl-[18px]">
                <dt className="caps text-[11px] text-muted">Red flags</dt>
                <dd
                  className={cx(
                    "display mt-1.5 mb-0 ml-0 text-[40px] leading-none tracking-normal",
                    redFlag ? "text-alert-text" : "text-venice",
                  )}
                >
                  {redFlag ? "Yes" : "None"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col">
            <h2 id="tl-h" className="display mt-0 mb-2 text-[34px] text-venice">
              Timeline
            </h2>
            <ol className="m-0 flex list-none flex-col border-t border-venice p-0">
              {c.events.map((e) => (
                <li key={e.id} className="grid grid-cols-1 gap-2 border-b border-line py-[18px] sm:grid-cols-[130px_1fr] sm:gap-5">
                  <div className="flex gap-3 sm:flex-col sm:gap-1">
                    <span className="text-sm font-normal">{whenLabel(e.at)}</span>
                    <span className={`caps text-[11px] ${KIND_COLOR[e.kind]}`}>{e.kind}</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="display text-[22px] leading-tight tracking-normal text-venice">{e.title}</span>
                    {e.detail && <span className="text-sm leading-relaxed">{e.detail}</span>}
                    {(e.photoIds.length > 0 || e.pain !== null) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {e.photoIds.map((id) => (
                          <Photo key={id} photo={photoById(id)} className="h-12 w-16 rounded-tag" />
                        ))}
                        {e.pain !== null && (
                          <span className="rounded-tag bg-rock-tint px-2 py-1 text-xs font-normal">
                            Discomfort {e.pain}/10
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="report" aria-labelledby="rep-h" className="flex min-w-0 flex-[1_1_460px] scroll-mt-8 flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2.5 print:hidden">
            <h2 id="rep-h" className="display m-0 text-[34px] text-venice">
              For your dermatologist
            </h2>
            <Button size="sm" onClick={() => window.print()}>
              Print / save PDF
            </Button>
          </div>

          <article
            aria-label="Printable case report"
            className="flex rotate-[0.6deg] flex-col gap-[18px] border border-line bg-sheet px-6 pt-9 pb-7 text-[12.5px] leading-[1.55] sm:px-9 print:rotate-0 print:border-0"
          >
            <div className="flex items-end justify-between gap-3 border-b-[1.5px] border-venice pb-3">
              <div className="flex items-center gap-2">
                <Dermi size={30} />
                <div className="flex flex-col">
                  <span className="display text-[22px] tracking-normal text-venice">DermiAI case report</span>
                  <span className="caps text-[9.5px] text-muted">Patient-generated summary · not a diagnosis</span>
                </div>
              </div>
              <div className="caps text-right text-[10px] tracking-[0.06em] text-muted">
                {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                <br />
                Case {c.id.slice(0, 8)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
              <ReportField label="Patient">{profile?.name ?? "—"}</ReportField>
              <ReportField label="Status">
                <StatusChip status={c.status} size="sm" />
              </ReportField>
              <ReportField label="Skin type / tone">
                {profile ? `${profile.skinType}${profile.tone ? ` · Fitzpatrick ${ROMAN[profile.tone - 1]}` : ""}` : "—"}
              </ReportField>
              <ReportField label="Known allergies">{profile?.allergies.join(", ") || "None reported"}</ReportField>
              <ReportField label="Current products & medications" wide>
                {profile?.products.map((p) => p.name).join(", ") || "None reported"}
              </ReportField>
            </div>

            <ReportSection title="Presenting concern">
              <p className="m-0">
                {firstUser ?? "—"}
                {c.symptoms.length > 0 && ` Reported: ${c.symptoms.join(", ").toLowerCase()}.`}
                {c.trigger && ` Suspected trigger: ${c.trigger}.`}
              </p>
            </ReportSection>

            <ReportSection title="Timeline">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="text-left">
                    <th className="border-b border-venice py-1.5 font-medium">Date</th>
                    <th className="border-b border-venice py-1.5 font-medium">Event</th>
                    <th className="border-b border-venice py-1.5 text-right font-medium">Discomfort</th>
                  </tr>
                </thead>
                <tbody className="[&_td]:border-b [&_td]:border-track [&_td]:py-1.5 [&_tr:last-child_td]:border-b-0">
                  {[...c.events].reverse().map((e) => (
                    <tr key={e.id}>
                      <td className="pr-2 align-top whitespace-nowrap">{shortDate(e.at)}</td>
                      <td className="pr-2">{e.title}</td>
                      <td className="text-right align-top">{e.pain !== null ? `${e.pain}/10` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ReportSection>

            {c.photos.length > 0 && (
              <ReportSection title="Photos">
                <div className="grid grid-cols-3 gap-2.5">
                  {c.photos.slice(-6).map((p) => (
                    <div key={p.id} className="flex flex-col gap-1">
                      <Photo photo={p} className="aspect-[4/3] w-full" />
                      <span className="text-[10.5px] text-muted">
                        {shortDate(p.at)} · {p.label}
                      </span>
                    </div>
                  ))}
                </div>
              </ReportSection>
            )}

            <ReportSection title="Dermi's observations">
              <p className="m-0">
                {c.cnn
                  ? `Image model: ${c.cnn.top_k.map((p) => `${p.condition.toLowerCase()} (${Math.round(p.confidence * 100)}%)`).join("; ")}; image quality ${c.cnn.image_quality}.`
                  : "No photo analysed."}{" "}
                {redFlag
                  ? `Warning signs reported (${c.symptoms.filter((x) => ["Fever", "Spreading fast", "Warm to touch", "Pus", "Facial swelling", "Trouble breathing", "Bleeding"].includes(x)).join(", ").toLowerCase() || "see timeline"}); in-person review advised.`
                  : "No red-flag symptoms reported."}
              </p>
            </ReportSection>

            <p className="mt-1.5 mb-0 border-t border-track pt-3 text-[10.5px] text-muted">
              Generated by DermiAI (demo) from information the patient provided. Not a medical diagnosis; to be
              reviewed by a qualified clinician.
            </p>
          </article>
        </section>
      </div>

      <CheckIn c={c} open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </>
  );
}

function CheckIn({ c, open, onClose }: { c: DemoCase; open: boolean; onClose: () => void }) {
  const [pain, setPain] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) setPhoto((await processFile(f)).dataUrl);
  };

  const save = () => {
    if (pain === null) return;
    const at = now();
    const photoId = photo ? newId() : null;
    demo.updateCase(c.id, (x) => ({
      ...x,
      photos: photoId ? [...x.photos, { id: photoId, dataUrl: photo!, label: "Check-in", at }] : x.photos,
      pains: [...x.pains, { at, value: pain }],
      events: [
        makeEvent({
          kind: "Check-in",
          title: photoId ? "Check-in photo" : "Check-in",
          detail: note.trim(),
          photoIds: photoId ? [photoId] : [],
          pain,
          at,
        }),
        ...x.events,
      ],
    }));
    setPain(null);
    setNote("");
    setPhoto(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="ci-h" className="w-[min(640px,calc(100%-32px))]">
      <section className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between border-b border-venice pb-3">
          <h2 id="ci-h" className="display m-0 text-[28px] tracking-normal text-venice">
            How is it today?
          </h2>
          <CloseButton onClick={onClose} />
        </div>
        <div role="group" aria-label="Discomfort from 1 to 10" className="grid grid-cols-5 gap-1 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={pain === n}
              aria-label={`${n} out of 10`}
              onClick={() => setPain(n)}
              className={cx(
                "flex min-h-[64px] cursor-pointer flex-col items-center gap-0.5 rounded-[6px] py-1.5",
                pain === n ? "border-[1.5px] border-venice bg-venice text-merino" : "border border-line bg-paper text-venice",
              )}
            >
              <PainFace n={n} size={24} />
              <span className="font-display text-base">{n}</span>
            </button>
          ))}
        </div>
        <label htmlFor="ci-note" className={fieldLabelClass}>
          Anything to note?
          <input
            id="ci-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Redness has faded, itch gone at night"
            className={underlineInputClass}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element -- local preview
            <img src={photo} alt="Check-in photo preview" className="h-16 w-20 rounded-tag object-cover" />
          )}
          <Button variant="secondary" size="sm" onClick={() => file.current?.click()}>
            {photo ? "Change photo" : "Add a photo"}
          </Button>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
        <Button onClick={save} disabled={pain === null}>
          Save check-in
        </Button>
        <a href={`/consult?case=${c.id}`} className={cx(buttonClass("ghost", "sm"), "self-start px-0")}>
          Something changed? Talk to Dermi <Arrow />
        </a>
      </section>
    </Modal>
  );
}

function ReportField({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <span className="caps text-[9.5px] text-muted">{label}</span>
      <br />
      <span className="font-normal">{children}</span>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="caps text-[10px] font-semibold tracking-[0.12em] text-venice">{title}</span>
      {children}
    </div>
  );
}
