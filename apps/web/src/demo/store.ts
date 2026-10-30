/**
 * DEMO BRANCH ONLY. Browser-only stand-in for Supabase: one state object in localStorage.
 * Each viewer gets their own demo; "Reset demo" clears it.
 */
import { useSyncExternalStore } from "react";

import { sampleState } from "@/demo/sample";
import {
  type DemoCase,
  type DemoEvent,
  type DemoProfile,
  type DemoReminder,
  type DemoState,
  INITIAL_CONTEXT,
} from "@/demo/types";

const KEY = "dermiai-demo-v1";

export const EMPTY_STATE: DemoState = {
  v: 1,
  profile: null,
  cases: [],
  reminders: [],
  ticks: {},
  avoid: [],
};

let state: DemoState | null = null;
const listeners = new Set<() => void>();
let storageWarning = false;

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed?.v === 1) return parsed;
    }
  } catch {
    // Private mode or corrupted JSON: start empty.
  }
  return EMPTY_STATE;
}

function persist(next: DemoState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    storageWarning = false;
  } catch {
    // Quota (photos are data URLs): drop the oldest photos' data and retry once.
    storageWarning = true;
    try {
      const slim: DemoState = {
        ...next,
        cases: next.cases.map((c, i) =>
          i < next.cases.length - 1 ? { ...c, photos: c.photos.map((p) => ({ ...p, dataUrl: "" })) } : c,
        ),
      };
      window.localStorage.setItem(KEY, JSON.stringify(slim));
    } catch {
      // Give up persisting; the in-memory state still works for this tab.
    }
  }
}

export function getState(): DemoState {
  if (state === null) state = load();
  return state;
}

function setState(update: (s: DemoState) => DemoState) {
  state = update(getState());
  persist(state);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Whole demo state; null during SSR and hydration so the server never guesses. */
export function useDemo(): DemoState | null {
  return useSyncExternalStore(subscribe, getState, () => null);
}

export function hadStorageWarning() {
  return storageWarning;
}

/* ---------- helpers ---------- */

export const newId = () => crypto.randomUUID().slice(0, 8);
export const now = () => new Date().toISOString();
export const todayKey = () => new Date().toISOString().slice(0, 10);

export function makeEvent(e: Omit<DemoEvent, "id" | "at"> & { at?: string }): DemoEvent {
  return { id: newId(), at: e.at ?? now(), ...e };
}

/* ---------- actions ---------- */

export const demo = {
  reset(mode: "fresh" | "sample") {
    setState(() => (mode === "sample" ? sampleState() : EMPTY_STATE));
  },

  setProfile(profile: DemoProfile) {
    setState((s) => ({ ...s, profile }));
  },

  /** Creates (or keeps) an unstarted draft case with this id; old drafts are discarded. */
  ensureDraft(id: string) {
    const s = getState();
    if (s.cases.some((c) => c.id === id)) return;
    const at = now();
    const draft: DemoCase = {
      id,
      title: "New consultation",
      area: "",
      scenario: null,
      status: "open",
      createdAt: at,
      updatedAt: at,
      started: false,
      photos: [],
      turns: [],
      context: INITIAL_CONTEXT,
      cnn: null,
      symptoms: [],
      trigger: null,
      pains: [],
      events: [],
    };
    setState((st) => ({ ...st, cases: [draft, ...st.cases.filter((c) => c.started)] }));
  },

  updateCase(id: string, update: (c: DemoCase) => DemoCase) {
    setState((s) => ({
      ...s,
      cases: s.cases.map((c) => (c.id === id ? { ...update(c), updatedAt: now() } : c)),
    }));
  },

  addReminder(reminder: Omit<DemoReminder, "id">): string {
    const id = newId();
    setState((s) => ({ ...s, reminders: [...s.reminders, { ...reminder, id }] }));
    return id;
  },

  setReminderEnabled(id: string, enabled: boolean) {
    setState((s) => ({
      ...s,
      reminders: s.reminders.map((r) => (r.id === id ? { ...r, enabled } : r)),
    }));
  },

  deleteReminder(id: string) {
    setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }));
  },

  toggleTick(id: string) {
    const day = todayKey();
    setState((s) => {
      const ticks = s.ticks[day] ?? [];
      return {
        ...s,
        ticks: {
          ...s.ticks,
          [day]: ticks.includes(id) ? ticks.filter((t) => t !== id) : [...ticks, id],
        },
      };
    });
  },

  addAvoid(names: string[]) {
    setState((s) => ({ ...s, avoid: [...new Set([...s.avoid, ...names])] }));
  },
};

/* ---------- selectors ---------- */

export function startedCases(s: DemoState) {
  return s.cases
    .filter((c) => c.started)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Monday = 0 ... Sunday = 6 */
export function weekdayIndex(d = new Date()) {
  return (d.getDay() + 6) % 7;
}

export function todaysReminders(s: DemoState) {
  const day = weekdayIndex();
  return s.reminders
    .filter((r) => r.enabled && r.days.includes(day))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function whenLabel(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
  return todayKey() === iso.slice(0, 10)
    ? `Today, ${time}`
    : `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}, ${time}`;
}

export function clockLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
}
