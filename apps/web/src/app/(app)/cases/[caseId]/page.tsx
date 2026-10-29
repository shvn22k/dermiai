import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Dermi } from "@/components/dermi";
import { Arrow, Breadcrumb, buttonClass, Hatch, LinkButton, PageHeader, StatusChip } from "@/components/ui";
import { caseDetail, cases, consultCnn, profile, type TimelineKind } from "@/lib/demo";

type Props = { params: Promise<{ caseId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { caseId } = await params;
  return { title: cases.find((c) => c.id === caseId)?.name ?? "Case" };
}

const KIND_COLOR: Record<TimelineKind, string> = {
  "Check-in": "text-venice",
  Status: "text-venice",
  Consultation: "text-venice",
  Ingredients: "text-alert-text",
  Reminder: "text-muted",
};

/** Case timeline + printable report (design/screens/CaseDetail.dc.html). */
export default async function CaseDetailPage({ params }: Props) {
  const { caseId } = await params;
  const summary = cases.find((c) => c.id === caseId);
  if (!summary) notFound();
  // Demo: every case shows the designed timeline under its own name.
  const c = { ...caseDetail, ...summary };
  const first = c.trend[0]?.value;
  const last = c.trend.at(-1)?.value;
  const [top, ...others] = consultCnn.top_k;
  const pct = (p: { confidence: number }) => `${Math.round(p.confidence * 100)}%`;

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={c.name}
          eyebrow={<Breadcrumb items={[{ label: "Cases", href: "/cases" }, { label: c.area }]} />}
          badge={<StatusChip status={c.status} />}
          aside={
            <div className="flex flex-wrap gap-2.5">
              <LinkButton href={`/consult?case=${c.id}`}>
                Continue with Dermi <Arrow />
              </LinkButton>
              <a href="#report" className={buttonClass("secondary")}>
                Export report <Arrow>↓</Arrow>
              </a>
            </div>
          }
        >
          <span className="text-sm text-muted">
            Opened {c.opened} · {c.consultations} consultations · {c.photoCount} photos
          </span>
        </PageHeader>
      </div>

      <div className="flex flex-wrap items-start gap-10">
        <section
          aria-labelledby="tl-h"
          className="flex min-w-0 flex-[999_1_460px] flex-col gap-8 print:hidden"
        >
          <div className="flex flex-wrap items-end gap-8">
            <div className="flex flex-[1_1_260px] flex-col gap-3.5">
              <span className="caps text-xs text-venice">Discomfort over time</span>
              <div
                role="img"
                aria-label={`Discomfort scores: ${c.trend.map((t) => `${t.value} on ${t.date}`).join(", ")}`}
                className="flex h-[110px] items-end gap-2.5 border-b border-venice"
              >
                {c.trend.map((t, i) => (
                  <div
                    key={t.date}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <span className="font-display text-base text-venice">{t.value}</span>
                    <div
                      className={`w-full max-w-10 rounded-t-[3px] ${i === c.trend.length - 1 ? "bg-venice" : "bg-rock"}`}
                      style={{ height: Math.round((t.value / 10) * 70 + 4) }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5" aria-hidden="true">
                {c.trend.map((t) => (
                  <span
                    key={t.date}
                    className="caps flex-1 text-center text-[10px] tracking-[0.08em] text-muted"
                  >
                    {t.date}
                  </span>
                ))}
              </div>
            </div>
            <dl className="m-0 grid min-w-[260px] grid-cols-2 border-t border-line">
              <div className="border-r border-line pt-3.5 pr-[18px]">
                <dt className="caps text-[11px] text-muted">Since start</dt>
                <dd className="display mt-1.5 mb-0 ml-0 text-[40px] leading-none tracking-normal text-venice">
                  {first} → {last}
                </dd>
              </div>
              <div className="pt-3.5 pl-[18px]">
                <dt className="caps text-[11px] text-muted">Red flags</dt>
                <dd className="display mt-1.5 mb-0 ml-0 text-[40px] leading-none tracking-normal text-venice">
                  {c.redFlags}
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
                <li
                  key={`${e.when}-${e.title}`}
                  className="grid grid-cols-1 gap-2 border-b border-line py-[18px] sm:grid-cols-[130px_1fr] sm:gap-5"
                >
                  <div className="flex gap-3 sm:flex-col sm:gap-1">
                    <span className="text-sm font-normal">{e.when}</span>
                    <span className={`caps text-[11px] ${KIND_COLOR[e.kind]}`}>{e.kind}</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="display text-[22px] leading-tight tracking-normal text-venice">
                      {e.title}
                    </span>
                    <span className="text-sm leading-relaxed">{e.detail}</span>
                    {(e.thumbs.length > 0 || e.pain !== null) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {e.thumbs.map((angle) => (
                          <Hatch key={angle} angle={angle} step={6} className="h-12 w-16 rounded-tag" />
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

        <section
          id="report"
          aria-labelledby="rep-h"
          className="flex min-w-0 flex-[1_1_460px] scroll-mt-8 flex-col gap-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-2.5 print:hidden">
            <h2 id="rep-h" className="display m-0 text-[34px] text-venice">
              For your dermatologist
            </h2>
            <div className="flex gap-2">
              {/* Export route is a stub (501) until reports are implemented. */}
              <a href={`/api/cases/${c.id}/report`} className={buttonClass("primary", "sm")}>
                Download PDF
              </a>
              <button type="button" className={buttonClass("secondary", "sm")}>
                Share
              </button>
            </div>
          </div>

          <article
            aria-label="Printable case report preview"
            className="flex rotate-[0.6deg] flex-col gap-[18px] border border-line bg-sheet px-6 pt-9 pb-7 text-[12.5px] leading-[1.55] sm:px-9 print:rotate-0 print:border-0"
          >
            <div className="flex items-end justify-between gap-3 border-b-[1.5px] border-venice pb-3">
              <div className="flex items-center gap-2">
                <Dermi size={30} />
                <div className="flex flex-col">
                  <span className="display text-[22px] tracking-normal text-venice">
                    DermiAI case report
                  </span>
                  <span className="caps text-[9.5px] text-muted">
                    Patient-generated summary · not a diagnosis
                  </span>
                </div>
              </div>
              <div className="caps text-right text-[10px] tracking-[0.06em] text-muted">
                29 Oct 2026
                <br />
                Case {c.id}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
              <ReportField label="Patient">{profile.name}</ReportField>
              <ReportField label="Date of birth">[DOB]</ReportField>
              <ReportField label="Skin type / tone">
                {profile.skinType} · Fitzpatrick {profile.fitzpatrick}
              </ReportField>
              <ReportField label="Known allergies">{profile.allergies.join(", ")}</ReportField>
              <ReportField label="Current products & medications" wide>
                Foaming cleanser, niacinamide 10% serum, SPF 50; cetirizine 10 mg as needed
              </ReportField>
            </div>

            <ReportSection title="Presenting concern">
              <p className="m-0">
                Red, itchy, mildly bumpy patch on the left forearm, first noticed 18 Oct. Itch worse
                at night; no burning. New fragranced body lotion started 18 Oct; stopped 23 Oct.
              </p>
            </ReportSection>

            <ReportSection title="Timeline">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="text-left">
                    <th className="border-b border-venice py-1.5 font-medium">Date</th>
                    <th className="border-b border-venice py-1.5 font-medium">Event</th>
                    <th className="border-b border-venice py-1.5 text-right font-medium">
                      Discomfort
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_td]:border-b [&_td]:border-track [&_td]:py-1.5 [&_tr:last-child_td]:border-b-0">
                  <tr>
                    <td>22 Oct</td>
                    <td>First consultation, 3 photos</td>
                    <td className="text-right">6/10</td>
                  </tr>
                  <tr>
                    <td>24 Oct</td>
                    <td>Follow-up, redness smaller</td>
                    <td className="text-right">5/10</td>
                  </tr>
                  <tr>
                    <td>26 Oct</td>
                    <td>Status: Open → Healing</td>
                    <td className="text-right">4/10</td>
                  </tr>
                  <tr>
                    <td>29 Oct</td>
                    <td>Check-in photo</td>
                    <td className="text-right">2/10</td>
                  </tr>
                </tbody>
              </table>
            </ReportSection>

            <ReportSection title="Photos">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  [-45, "22 Oct · day 1"],
                  [45, "26 Oct · day 5"],
                  [-30, "29 Oct · day 8"],
                ].map(([angle, caption]) => (
                  <div key={caption} className="flex flex-col gap-1">
                    <Hatch angle={Number(angle)} step={6} className="aspect-[4/3]" />
                    <span className="text-[10.5px] text-muted">{caption}</span>
                  </div>
                ))}
              </div>
            </ReportSection>

            <ReportSection title="Dermi's observations">
              <p className="m-0">
                Pattern most consistent with {top.condition.toLowerCase()} (est. {pct(top)});{" "}
                {others.map((p) => `${p.condition.toLowerCase()} (${pct(p)})`).join(" and ")}{" "}
                considered. Product label flagged fragrance (parfum) and methylisothiazolinone. No
                red-flag symptoms reported (no fever, spreading or blistering).
              </p>
            </ReportSection>

            <p className="mt-1.5 mb-0 border-t border-track pt-3 text-[10.5px] text-muted">
              Generated by DermiAI from information the patient provided. Not a medical diagnosis;
              to be reviewed by a qualified clinician.
            </p>
          </article>
        </section>
      </div>
    </>
  );
}

function ReportField({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
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
