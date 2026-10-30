/**
 * Demo content lifted from the design handoff (design/screens/*). Every page reads from here until the
 * Supabase tables and API routes exist. Replace each export with a query; the shapes are what the UI needs.
 * Model-facing data uses the shared contract (@dermiai/schemas) so the swap is mechanical.
 */
import type { CNNOutput } from "@dermiai/schemas";

export type CaseStatus = "open" | "healing" | "resolved" | "see-dermatologist";

export type Profile = {
  name: string;
  firstName: string;
  initials: string;
  skinType: string;
  fitzpatrick: string;
  allergies: string[];
};

export const profile: Profile = {
  name: "Aanya Rao",
  firstName: "Aanya",
  initials: "AR",
  skinType: "Combination",
  fitzpatrick: "IV",
  allergies: ["Fragrance"],
};

export type CaseSummary = {
  id: string;
  name: string;
  area: string;
  photos: number;
  status: CaseStatus;
  updated: string;
  /** Hatch angle for the placeholder thumbnail. */
  angle: number;
  /** Real photo (data URL) when there is one. */
  thumb?: string;
};

export const cases: CaseSummary[] = [
  {
    id: "contact-dermatitis",
    name: "Contact dermatitis",
    area: "Left forearm",
    photos: 3,
    status: "healing",
    updated: "2 hours ago",
    angle: -45,
  },
  {
    id: "hormonal-acne",
    name: "Hormonal acne",
    area: "Jawline",
    photos: 2,
    status: "open",
    updated: "Yesterday",
    angle: 45,
  },
  {
    id: "dark-spot",
    name: "Dark spot",
    area: "Right cheek",
    photos: 1,
    status: "open",
    updated: "3 days ago",
    angle: -30,
  },
  {
    id: "dry-patches",
    name: "Dry patches",
    area: "Both elbows",
    photos: 4,
    status: "resolved",
    updated: "Resolved 12 Oct",
    angle: 60,
  },
];

export type Reminder = {
  id: string;
  title: string;
  /** 24h "HH:MM" */
  time: string;
  repeat: string;
  meta?: string;
  caseLabel?: string;
  enabled: boolean;
};

export const reminders: Reminder[] = [
  {
    id: "m1",
    title: "Morning routine",
    time: "07:30",
    repeat: "Every day",
    meta: "Cleanser · serum · SPF",
    enabled: true,
  },
  { id: "m2", title: "Sunscreen, SPF 50", time: "08:00", repeat: "Every day", enabled: true },
  {
    id: "d1",
    title: "Reapply sunscreen",
    time: "13:00",
    repeat: "Weekdays",
    meta: "If you're outdoors",
    enabled: true,
  },
  {
    id: "e1",
    title: "Moisturise forearm",
    time: "18:00",
    repeat: "Every day",
    meta: "Contact dermatitis",
    caseLabel: "Dermatitis",
    enabled: true,
  },
  {
    id: "n1",
    title: "Night routine",
    time: "22:30",
    repeat: "Every day",
    meta: "Cleanser · moisturiser",
    enabled: true,
  },
  {
    id: "n2",
    title: "Spot gel on jawline",
    time: "22:30",
    repeat: "Mon, Wed, Fri",
    caseLabel: "Acne",
    enabled: false,
  },
];

/** The dashboard's "Today" list. */
export const todayReminderIds = ["m1", "d1", "e1", "n1"];

/* ---------- Case detail ---------- */

export type TimelineKind = "Check-in" | "Status" | "Consultation" | "Ingredients" | "Reminder";

export type TimelineEvent = {
  kind: TimelineKind;
  title: string;
  when: string;
  detail: string;
  thumbs: number[];
  pain: number | null;
};

export type CaseDetail = CaseSummary & {
  opened: string;
  consultations: number;
  photoCount: number;
  trend: { date: string; value: number }[];
  redFlags: string;
  events: TimelineEvent[];
};

export const caseDetail: CaseDetail = {
  ...cases[0]!,
  opened: "Thu 22 Oct",
  consultations: 3,
  photoCount: 5,
  redFlags: "None",
  trend: [
    { date: "22 Oct", value: 6 },
    { date: "24 Oct", value: 5 },
    { date: "26 Oct", value: 4 },
    { date: "28 Oct", value: 3 },
    { date: "29 Oct", value: 2 },
  ],
  events: [
    {
      kind: "Check-in",
      title: "Check-in photo",
      when: "Today, 8:40",
      detail: "Redness has faded to a light patch. Itch mostly gone at night.",
      thumbs: [-30],
      pain: 2,
    },
    {
      kind: "Status",
      title: "Open → Healing",
      when: "Mon 26 Oct",
      detail:
        "You confirmed you were satisfied with your care. Dermi kept the case open for check-ins.",
      thumbs: [],
      pain: 4,
    },
    {
      kind: "Consultation",
      title: "Follow-up consultation",
      when: "Sat 24 Oct",
      detail:
        "Redness smaller after stopping the lotion. Dermi suggested a fragrance-free moisturiser.",
      thumbs: [45],
      pain: 5,
    },
    {
      kind: "Ingredients",
      title: "Body lotion checked",
      when: "Fri 23 Oct",
      detail:
        "Fragrance (parfum) and methylisothiazolinone flagged against your allergy profile.",
      thumbs: [],
      pain: null,
    },
    {
      kind: "Reminder",
      title: "Moisturise forearm, 6:00 PM daily",
      when: "Thu 22 Oct",
      detail: "Added by Dermi at the end of your first consultation.",
      thumbs: [],
      pain: null,
    },
    {
      kind: "Consultation",
      title: "Consultation started",
      when: "Thu 22 Oct, 9:12",
      detail: "Red, itchy patch for 4 days; new body lotion suspected. 3 photos shared.",
      thumbs: [-45, 45, 60],
      pain: 6,
    },
  ],
};

/* ---------- Consultation ---------- */

/** What the vision endpoint returned for the first photo (shared contract shape). */
export const consultCnn: CNNOutput = {
  top_k: [
    { condition: "Allergic contact dermatitis", confidence: 0.72 },
    { condition: "Irritant contact dermatitis", confidence: 0.19 },
    { condition: "Eczema flare", confidence: 0.09 },
  ],
  image_quality: "good",
  model_version: "vision-demo",
};

export const consultPhotos = [
  { label: "Left forearm", time: "9:14 AM" },
  { label: "Close-up", time: "9:16 AM" },
  { label: "Inner wrist", time: "9:17 AM" },
];

export const consultSymptoms = ["Itchy", "Red patch", "Small bumps", "Worse at night", "4 days"];
export const redFlagSymptoms = ["Spreading fast", "Warm to touch", "Fever"];

/* ---------- Ingredient check ---------- */

export type IngredientLevel = "ok" | "watch" | "clash";

export const scannedProduct = {
  name: "Soothing Body Lotion",
  brand: "[Brand name]",
  scanned: "Fri 23 Oct",
  ingredients: [
    ["Aqua", "ok"],
    ["Glycerin", "ok"],
    ["Cetearyl Alcohol", "ok"],
    ["Caprylic/Capric Triglyceride", "ok"],
    ["Butyrospermum Parkii (Shea) Butter", "ok"],
    ["Dimethicone", "ok"],
    ["Parfum (Fragrance)", "clash"],
    ["Methylisothiazolinone", "clash"],
    ["Linalool", "watch"],
    ["Limonene", "watch"],
    ["Tocopherol", "ok"],
    ["Sodium Hydroxide", "ok"],
  ] as [string, IngredientLevel][],
  flags: [
    {
      name: "Parfum (Fragrance)",
      level: "clash" as IngredientLevel,
      related: "fragrance allergy, contact dermatitis case",
      why: "You told me fragrance has bothered your skin before, and your forearm patch looks most like an allergic reaction. Fragrance is one of the most common triggers for this.",
    },
    {
      name: "Methylisothiazolinone",
      level: "clash" as IngredientLevel,
      related: "contact dermatitis case",
      why: "A preservative that's often linked to contact allergy, especially in leave-on products like lotions. Best avoided while your skin heals.",
    },
    {
      name: "Linalool & Limonene",
      level: "watch" as IngredientLevel,
      related: "fragrance allergy",
      why: "Fragrance components that can become more irritating as a product ages and meets air. Not a problem for everyone, but worth noting with your profile.",
    },
  ],
};

/* ---------- helpers ---------- */

/** "18:00" -> { hm: "6:00", ap: "PM" } */
export function splitTime(time: string): { hm: string; ap: "AM" | "PM" } {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { hm: `${h12}:${String(m).padStart(2, "0")}`, ap };
}
