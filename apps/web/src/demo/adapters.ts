/** DEMO BRANCH ONLY. Map browser-stored demo records onto the shapes the designed components take. */
import { relativeTime } from "@/demo/store";
import type { DemoCase, DemoReminder } from "@/demo/types";
import type { CaseSummary, Reminder } from "@/lib/demo";

const ANGLES = [-45, 45, -30, 60];

export function toSummary(c: DemoCase, i = 0): CaseSummary {
  const photo = c.photos.find((p) => p.dataUrl);
  return {
    id: c.id,
    name: c.title,
    area: c.area ? c.area[0]!.toUpperCase() + c.area.slice(1) : "Skin",
    photos: c.photos.length,
    status: c.status,
    updated: relativeTime(c.updatedAt),
    angle: ANGLES[i % ANGLES.length]!,
    thumb: photo?.dataUrl,
  };
}

export function toReminder(r: DemoReminder): Reminder {
  return {
    id: r.id,
    title: r.title,
    time: r.time,
    repeat: r.repeat,
    meta: r.caseLabel ? `${r.repeat} · ${r.caseLabel}` : r.repeat,
    caseLabel: r.caseLabel,
    enabled: r.enabled,
  };
}
