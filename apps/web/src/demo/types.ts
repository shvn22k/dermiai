/**
 * DEMO BRANCH ONLY. Types for the end-to-end showcase: browser-stored state, the scripted Dermi engine,
 * and the demo-only SSE event. Nothing here is part of the real contract (@dermiai/schemas).
 */
import type { CNNOutput, ImageQuality } from "@dermiai/schemas";

import type { CaseStatus, TimelineKind } from "@/lib/demo";

export type Scenario = "contact-dermatitis" | "acne" | "eczema" | "mole";

export type Stage =
  | "greet"
  | "describe"
  | "await-photo"
  | "questions"
  | "pain"
  | "satisfaction"
  | "followup"
  | "closed"
  | "redflag";

/** Engine state for one consultation. Sent with every /api/consult call (the engine is stateless). */
export type DemoContext = {
  stage: Stage;
  scenario: Scenario | null;
  questionIndex: number;
  hasPhoto: boolean;
  photoRetries: number;
  pain: number | null;
  satisfied: "yes" | "no" | null;
};

export const INITIAL_CONTEXT: DemoContext = {
  stage: "greet",
  scenario: null,
  questionIndex: 0,
  hasPhoto: false,
  photoRetries: 0,
  pain: null,
  satisfied: null,
};

export type DemoProfileLite = { name: string; allergies: string[]; skinType: string };

/** What the person just did. */
export type UserEvent =
  | { kind: "start" }
  | { kind: "message"; text: string }
  | { kind: "photo"; quality: ImageQuality }
  | { kind: "pain"; value: number }
  | { kind: "satisfied"; value: "yes" | "no" };

export type Widget = "photo" | "pain" | "satisfaction" | "redflag";

export type Source = { id: string; title: string; snippet: string; score: number };

export type ReminderSuggestion = { title: string; time: string; days: number[]; repeat: string };

/** Changes the engine asks the client to apply to the case. */
export type CasePatch = {
  title?: string;
  area?: string;
  scenario?: Scenario;
  status?: CaseStatus;
  symptoms?: string[];
  trigger?: string;
  reminder?: ReminderSuggestion;
};

/** Demo-only SSE event, sent just before `done`. Shown as "demo-only" in the under-the-hood panel. */
export type DemoMetaEvent = {
  type: "demo";
  context: DemoContext;
  widget: Widget | null;
  mood: "happy" | "thinking" | "concerned";
  sources: Source[];
  patch: CasePatch;
};

export type ConsultBody = {
  request: import("@dermiai/schemas").DermiRequest;
  demo: { context: DemoContext; event: UserEvent; profile: DemoProfileLite; transcript: string };
};

export type ClassifyBody = {
  request: import("@dermiai/schemas").VisionRequest;
  demo: { brightness: number; hint: string; override: Scenario | null };
};

/* ---------- Browser state ---------- */

export type DemoPhoto = { id: string; dataUrl: string; label: string; at: string };

export type Turn = {
  id: string;
  role: "dermi" | "user";
  text: string;
  at: string;
  mood?: DemoMetaEvent["mood"];
  widget?: Widget | null;
  /** Pain value / satisfaction picked from this turn's widget. */
  answer?: string;
  sources?: Source[];
  photoId?: string;
  analysis?: { quality: ImageQuality; top: string } | null;
};

export type DemoEvent = {
  id: string;
  at: string;
  kind: TimelineKind;
  title: string;
  detail: string;
  photoIds: string[];
  pain: number | null;
};

export type DemoCase = {
  id: string;
  title: string;
  area: string;
  scenario: Scenario | null;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  /** False until the person sends their first message (drafts are hidden from lists). */
  started: boolean;
  photos: DemoPhoto[];
  turns: Turn[];
  context: DemoContext;
  cnn: CNNOutput | null;
  symptoms: string[];
  trigger: string | null;
  pains: { at: string; value: number }[];
  events: DemoEvent[];
};

export type DemoProduct = { kind: "Product" | "Medication"; name: string; when: string };

export type DemoProfile = {
  name: string;
  skinType: string;
  tone: number;
  allergies: string[];
  products: DemoProduct[];
  concerns: string[];
};

export type DemoReminder = {
  id: string;
  title: string;
  time: string;
  /** 0 = Monday ... 6 = Sunday */
  days: number[];
  repeat: string;
  caseId?: string;
  caseLabel?: string;
  enabled: boolean;
};

export type DemoState = {
  v: 1;
  profile: DemoProfile | null;
  cases: DemoCase[];
  reminders: DemoReminder[];
  /** ISO date -> reminder ids ticked that day */
  ticks: Record<string, string[]>;
  avoid: string[];
};
