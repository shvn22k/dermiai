"use client";

import { type FormEvent, useState } from "react";

import { Dermi } from "@/components/dermi";
import {
  Button,
  cx,
  fieldLabelClass,
  Switch,
  ToggleChip,
  underlineInputClass,
} from "@/components/ui";
import { cases, type Reminder, splitTime } from "@/lib/demo";

const GROUPS = [
  { name: "Morning", test: (h: number) => h < 12 },
  { name: "Daytime", test: (h: number) => h >= 12 && h < 17 },
  { name: "Evening & night", test: (h: number) => h >= 17 },
];

const TYPES = ["Medication", "Sunscreen", "Morning routine", "Night routine", "Custom"];
const REPEATS = ["Every day", "Weekdays", "Weekends", "Custom"] as const;
const PRESETS: Record<string, number[]> = {
  "Every day": [0, 1, 2, 3, 4, 5, 6],
  Weekdays: [0, 1, 2, 3, 4],
  Weekends: [5, 6],
};
const DAYS = [
  ["M", "Monday"],
  ["T", "Tuesday"],
  ["W", "Wednesday"],
  ["T", "Thursday"],
  ["F", "Friday"],
  ["S", "Saturday"],
  ["S", "Sunday"],
] as const;

/** Reminder list + create form (design/screens/Reminders.dc.html). Persists via /api/reminders later. */
export function RemindersView({ initial }: { initial: Reminder[] }) {
  const [items, setItems] = useState(initial);
  const [type, setType] = useState("Medication");
  const [name, setName] = useState("Apply prescribed cream");
  const [time, setTime] = useState("18:00");
  const [caseId, setCaseId] = useState(cases[0]?.id ?? "");
  const [repeat, setRepeat] = useState<(typeof REPEATS)[number]>("Every day");
  const [days, setDays] = useState<number[]>(PRESETS["Every day"]!);
  const [nudge, setNudge] = useState(true);

  const setEnabled = (id: string, enabled: boolean) =>
    setItems((list) => list.map((r) => (r.id === id ? { ...r, enabled } : r)));

  const save = (e: FormEvent) => {
    e.preventDefault();
    const linked = cases.find((c) => c.id === caseId);
    const label =
      repeat === "Custom" ? days.map((d) => DAYS[d]![1].slice(0, 3)).join(", ") : repeat;
    setItems((list) => [
      ...list,
      {
        id: crypto.randomUUID(),
        title: name.trim() || "New reminder",
        time,
        repeat: label,
        caseLabel: linked?.name.split(" ").at(-1),
        enabled: true,
      },
    ]);
  };

  return (
    <div className="flex flex-wrap items-start gap-12">
      <section aria-label="Your reminders" className="flex min-w-0 flex-[999_1_460px] flex-col gap-7">
        {GROUPS.map((g) => {
          const groupItems = items
            .filter((r) => g.test(Number(r.time.slice(0, 2))))
            .sort((a, b) => a.time.localeCompare(b.time));
          if (groupItems.length === 0) return null;
          return (
            <div key={g.name} className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[140px_1fr] sm:gap-5">
              <h2 className="m-0 text-sm font-normal sm:pt-[18px]">{g.name}</h2>
              <ul className="m-0 flex list-none flex-col border-t border-venice p-0">
                {groupItems.map((r) => {
                  const { hm, ap } = splitTime(r.time);
                  return (
                    <li
                      key={r.id}
                      className={cx(
                        "grid min-h-[72px] grid-cols-[76px_1fr_52px] items-center gap-3.5 border-b border-line py-2 sm:grid-cols-[96px_1fr_auto_52px]",
                        !r.enabled && "opacity-55",
                      )}
                    >
                      <span className="flex items-baseline gap-[3px] text-venice">
                        <span className="display text-[26px] sm:text-[32px]">{hm}</span>
                        <span className="caps text-[10px] tracking-[0.08em]">{ap}</span>
                      </span>
                      <span className="flex min-w-0 flex-col gap-[3px]">
                        <span className="text-base font-normal">{r.title}</span>
                        <span className="text-[13px] text-muted">
                          {r.repeat}
                          {r.caseLabel && <span className="sm:hidden"> · {r.caseLabel}</span>}
                        </span>
                      </span>
                      <span className="hidden sm:block">
                        {r.caseLabel && (
                          <span className="caps rounded-tag bg-rock-tint px-2 py-1 text-[10px]">
                            {r.caseLabel}
                          </span>
                        )}
                      </span>
                      <Switch
                        checked={r.enabled}
                        onChange={(v) => setEnabled(r.id, v)}
                        label={`${r.title} reminder`}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>

      <form
        onSubmit={save}
        aria-labelledby="new-h"
        className="flex min-w-0 flex-[1_1_380px] flex-col gap-[22px] rounded-card border border-line bg-paper p-5 sm:p-7"
      >
        <h2
          id="new-h"
          className="display m-0 border-b border-venice pb-3.5 text-[34px] text-venice"
        >
          New reminder
        </h2>

        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="caps mb-2.5 p-0 text-xs text-venice">Type</legend>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <ToggleChip
                key={t}
                selected={type === t}
                onClick={() => setType(t)}
                className="px-3.5 text-sm"
              >
                {t}
              </ToggleChip>
            ))}
          </div>
        </fieldset>

        <label htmlFor="rem-name" className={fieldLabelClass}>
          Name
          <input
            id="rem-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={underlineInputClass}
          />
        </label>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-4">
          <label htmlFor="rem-time" className={fieldLabelClass}>
            Time
            <input
              id="rem-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={underlineInputClass}
            />
          </label>
          <label htmlFor="rem-case" className={fieldLabelClass}>
            Link to a case
            <select
              id="rem-case"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className={cx(underlineInputClass, "px-0")}
            >
              {cases
                .filter((c) => c.status !== "resolved")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              <option value="">None</option>
            </select>
          </label>
        </div>

        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="caps mb-2.5 p-0 text-xs text-venice">Repeat</legend>
          <div className="flex flex-wrap gap-2">
            {REPEATS.map((r) => (
              <ToggleChip
                key={r}
                selected={repeat === r}
                onClick={() => {
                  setRepeat(r);
                  if (PRESETS[r]) setDays(PRESETS[r]);
                }}
                className="px-3.5 text-sm"
              >
                {r}
              </ToggleChip>
            ))}
          </div>
          <div role="group" aria-label="Days" className="grid grid-cols-7 gap-1">
            {DAYS.map(([short, full], i) => {
              const on = days.includes(i);
              return (
                <button
                  key={full}
                  type="button"
                  aria-pressed={on}
                  aria-label={full}
                  onClick={() => {
                    setRepeat("Custom");
                    setDays((d) => (on ? d.filter((x) => x !== i) : [...d, i].sort()));
                  }}
                  className={cx(
                    "h-11 cursor-pointer rounded-tag font-label text-[13px] font-medium",
                    on ? "bg-rock text-ink" : "border border-line-strong text-muted",
                  )}
                >
                  {short}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-3 border-y border-line py-3.5">
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-normal">Gentle follow-up</span>
            <span className="text-[13px] text-muted">Nudge again after 15 minutes if not done</span>
          </span>
          <Switch checked={nudge} onChange={setNudge} label="Gentle follow-up" />
        </div>

        <Button type="submit" className="min-h-[52px]">
          Save reminder
        </Button>

        <div className="flex items-end gap-3">
          <Dermi size={48} />
          <p className="display m-0 text-lg leading-[1.35] tracking-normal text-venice">
            Outdoors? Sunscreen works best reapplied about every two hours.
          </p>
        </div>
      </form>
    </div>
  );
}
