"use client";

import Link from "next/link";
import { useState } from "react";

import { cx, Hatch, STATUS_LABEL, StatusChip } from "@/components/ui";
import type { CaseStatus, CaseSummary } from "@/lib/demo";

export function CaseCard({ c }: { c: CaseSummary }) {
  return (
    <Link
      href={`/cases/${c.id}`}
      className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-btn border border-line bg-paper p-2 text-ink no-underline hover:border-venice hover:text-ink sm:grid-cols-[104px_1fr] sm:items-stretch sm:gap-[18px] sm:rounded-card sm:p-3.5"
    >
      <Hatch angle={c.angle} className="h-14 rounded-[5px] sm:h-28 sm:rounded-[6px]" />
      <span className="flex min-w-0 flex-col gap-0.5 sm:gap-1.5">
        <span className="caps hidden text-[11px] text-muted sm:block">
          {c.area} · {c.photos} {c.photos === 1 ? "photo" : "photos"}
        </span>
        <span className="display text-[19px] leading-[1.08] tracking-[-0.01em] text-venice sm:text-[26px]">
          {c.name}
        </span>
        <span className="flex items-center justify-between gap-2 sm:mt-auto">
          <span className="text-xs text-muted sm:text-[13px]">
            <span className="sm:hidden">{c.area} · </span>
            {c.updated}
          </span>
          <StatusChip status={c.status} size="sm" className="hidden sm:inline-block" />
        </span>
      </span>
      <StatusChip status={c.status} size="sm" className="sm:hidden" />
    </Link>
  );
}

type Filter = "all" | Exclude<CaseStatus, "see-dermatologist">;
const FILTERS: Filter[] = ["all", "open", "healing", "resolved"];

/** Case grid with status filter tabs (design/screens/Dashboard.dc.html). */
export function CaseList({
  cases,
  heading,
  headingLevel: H = "h2",
}: {
  cases: CaseSummary[];
  heading: string;
  headingLevel?: "h1" | "h2";
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = cases.filter((c) => filter === "all" || c.status === filter);
  return (
    <section aria-labelledby="cases-h" className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-venice pb-3">
        <H
          id="cases-h"
          className={cx(
            "display m-0 text-venice",
            H === "h1" ? "text-[40px] tracking-[-0.03em] sm:text-[52px]" : "text-[24px] sm:text-[36px]",
          )}
        >
          {heading}
        </H>
        <div
          role="group"
          aria-label="Filter cases"
          className="-mx-2 flex max-w-full overflow-x-auto sm:mx-0 sm:gap-1"
        >
          {FILTERS.map((f) => {
            const count =
              f === "all" ? cases.length : cases.filter((c) => c.status === f).length;
            const on = filter === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f)}
                className={cx(
                  "caps min-h-11 shrink-0 cursor-pointer px-2 text-[11px] whitespace-nowrap sm:px-3 sm:text-xs",
                  on ? "text-venice shadow-[inset_0_-2px_0_var(--color-venice)]" : "text-muted",
                )}
              >
                {f === "all" ? "All" : STATUS_LABEL[f]} · {count}
              </button>
            );
          })}
        </div>
      </div>
      {shown.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-2.5 sm:gap-4">
          {shown.map((c) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <p className="m-0 text-[15px] text-muted">No {filter} cases.</p>
      )}
    </section>
  );
}
