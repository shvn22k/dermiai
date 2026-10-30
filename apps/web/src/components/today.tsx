"use client";

import Link from "next/link";

import { Arrow, cx, HandTick } from "@/components/ui";
import { type Reminder, splitTime } from "@/lib/demo";

/** Today's reminders with hand-drawn tick boxes (design/screens/Dashboard.dc.html). */
export function TodayReminders({
  items,
  doneIds,
  onToggle,
}: {
  items: Reminder[];
  doneIds: string[];
  onToggle: (id: string) => void;
}) {
  const done = new Set(doneIds);
  const toggle = onToggle;

  return (
    <section aria-labelledby="today-h" className="flex flex-col gap-1">
      <div className="flex items-end justify-between border-b border-venice pb-3">
        <h2 id="today-h" className="display m-0 text-[24px] text-venice sm:text-[30px]">
          Today
        </h2>
        <span className="caps text-[11px] text-venice sm:text-xs">
          {items.filter((r) => done.has(r.id)).length} of {items.length} done
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {items.map((r) => {
          const { hm, ap } = splitTime(r.time);
          const isDone = done.has(r.id);
          return (
            <li
              key={r.id}
              className={cx(
                "grid min-h-[68px] grid-cols-[78px_1fr_44px] items-center gap-3 border-b border-line",
                isDone && "opacity-60",
              )}
            >
              <span className="flex items-baseline gap-[3px] text-venice">
                <span className="display text-[28px]">{hm}</span>
                <span className="caps text-[10px] tracking-[0.08em]">{ap}</span>
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={cx("text-[15px] font-normal", isDone && "line-through")}>
                  {r.title}
                </span>
                {r.meta && <span className="text-[13px] text-muted">{r.meta}</span>}
              </span>
              <button
                type="button"
                aria-pressed={isDone}
                aria-label={`Mark ${r.title} done`}
                onClick={() => toggle(r.id)}
                className="flex size-11 cursor-pointer items-center justify-center"
              >
                <span
                  className={cx(
                    "flex size-[26px] items-center justify-center rounded-[5px] border-[1.5px] border-venice",
                    isDone && "bg-venice",
                  )}
                >
                  <HandTick color={isDone ? "#F5EEDD" : "transparent"} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Link
        href="/reminders"
        className="caps mt-1.5 inline-flex min-h-11 items-center gap-2 self-start text-[13px] no-underline"
      >
        Manage reminders <Arrow />
      </Link>
    </section>
  );
}
