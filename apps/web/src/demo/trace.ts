/**
 * DEMO BRANCH ONLY. In-memory log for the "under the hood" panel: every request to the model routes and
 * every SSE event that comes back, labelled as contract or demo-only. Also holds the scenario override.
 */
import { useSyncExternalStore } from "react";

import type { Scenario } from "@/demo/types";

export type TraceEntry = {
  id: number;
  at: string;
  route: "/api/classify" | "/api/consult";
  direction: "request" | "event";
  /** Contract type name, or "demo-only" for the UI-hint event. */
  label: string;
  contract: boolean;
  json: string;
  /** >1 when consecutive TokenDelta events were merged. */
  count: number;
};

type TraceState = {
  entries: TraceEntry[];
  open: boolean;
  override: Scenario | null;
};

let state: TraceState = { entries: [], open: false, override: null };
let seq = 0;
const listeners = new Set<() => void>();

function set(next: Partial<TraceState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const trace = {
  log(entry: Omit<TraceEntry, "id" | "at" | "count">) {
    const json = entry.json.replace(
      /data:image\/[a-z]+;base64,[A-Za-z0-9+/=]{40,}/g,
      (m) => `${m.slice(0, 40)}…`,
    );
    const last = state.entries.at(-1);
    // Merge a run of TokenDelta events into one entry so the log stays readable.
    if (entry.label === "TokenDelta" && last?.label === "TokenDelta" && last.route === entry.route) {
      const content =
        (JSON.parse(last.json) as { content: string }).content +
        (JSON.parse(json) as { content: string }).content;
      const merged = { ...last, count: last.count + 1, json: JSON.stringify({ type: "delta", content }) };
      set({ entries: [...state.entries.slice(0, -1), merged] });
      return;
    }
    const next = [...state.entries, { ...entry, json, count: 1, id: ++seq, at: new Date().toISOString() }];
    set({ entries: next.slice(-300) });
  },
  clear() {
    set({ entries: [] });
  },
  setOpen(open: boolean) {
    set({ open });
  },
  setOverride(override: Scenario | null) {
    set({ override });
  },
  get override() {
    return state.override;
  },
};

export function useTrace(): TraceState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
