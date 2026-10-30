/**
 * DEMO BRANCH ONLY. "Load sample patient": the designed account (Aanya) with history, so the dashboard,
 * timeline, trend and report can be shown without walking through a consultation first.
 */
import { SCENARIOS } from "@/demo/scenarios";
import type { DemoCase, DemoEvent, DemoReminder, DemoState, Turn } from "@/demo/types";

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

function ago(days: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

let n = 0;
const id = (prefix: string) => `${prefix}-${++n}`;

function event(at: string, e: Omit<DemoEvent, "id" | "at">): DemoEvent {
  return { id: id("ev"), at, ...e };
}

function turn(role: Turn["role"], text: string, at: string, extra: Partial<Turn> = {}): Turn {
  return { id: id("t"), role, text, at, ...extra };
}

function dermatitisCase(): DemoCase {
  const start = ago(7, 9, 12);
  const s = SCENARIOS["contact-dermatitis"];
  return {
    id: "sample-dermatitis",
    title: "Itchy patch, left forearm",
    area: "left forearm",
    scenario: "contact-dermatitis",
    status: "healing",
    createdAt: start,
    updatedAt: hoursAgo(2),
    started: true,
    photos: [],
    turns: [
      turn("dermi", "Hi Aanya, I'm here with you. What's bothering your skin today?", start),
      turn(
        "user",
        "I've had a red, itchy patch on my left forearm for about 4 days. It's getting a bit bumpy.",
        ago(7, 9, 14),
      ),
      turn(
        "dermi",
        "Thank you — the photo is clear and really helps.\nIt looks most like allergic contact dermatitis (72%). That's a likelihood, not a diagnosis.\nA few gentle questions so I understand it better.\n? Have you started any new soap, detergent, lotion or skincare in the last week?",
        ago(7, 9, 14),
        { mood: "thinking" },
      ),
      turn("user", "Yes — I switched to a new body lotion on Sunday.", ago(7, 9, 15)),
      turn(
        "dermi",
        `That's a really useful clue — new lotions are one of the most common triggers.\n? ${s.questions[1]}`,
        ago(7, 9, 16),
      ),
      turn("user", "Mostly itchy. It's worse at night.", ago(7, 9, 17)),
      turn(
        "dermi",
        "Thank you. Itch rather than burning fits a reaction in the skin.\n? On a scale of 1 to 10, how would you rate your discomfort?",
        ago(7, 9, 18),
        { widget: "pain", answer: "6" },
      ),
      turn(
        "dermi",
        "Thank you — 6 out of 10, so moderate.\nHere's what we worked out together:\n01 This looks most like a reaction to something that touched your skin, possibly the new lotion.\n02 Put the suspected product aside, and use a gentle fragrance-free moisturiser twice a day.\n03 A cool compress can ease the itch — try not to scratch.\n04 I've set a reminder — \"Moisturise left forearm\" at 18:00 — and I'll ask for a photo in a couple of days.\n05 If it spreads, blisters, or you get a fever, please see a dermatologist.\n? Are you satisfied with your care?",
        ago(7, 9, 19),
        { widget: "satisfaction", answer: "yes" },
      ),
      turn(
        "dermi",
        "Thank you, Aanya. I've saved this case as Healing — you can reopen it any time, and I'll check in with you.",
        ago(7, 9, 20),
      ),
    ],
    context: {
      stage: "closed",
      scenario: "contact-dermatitis",
      questionIndex: 2,
      hasPhoto: true,
      photoRetries: 0,
      pain: 6,
      satisfied: "yes",
    },
    cnn: { top_k: s.cnn, image_quality: "good", model_version: "vision-demo-mock-0.1" },
    symptoms: ["Itchy", "Red patch", "Small bumps", "Worse at night", "4 days"],
    trigger: "new lotion",
    pains: [
      { at: ago(7), value: 6 },
      { at: ago(5), value: 5 },
      { at: ago(3), value: 4 },
      { at: ago(1), value: 3 },
      { at: hoursAgo(2), value: 2 },
    ],
    events: [
      event(hoursAgo(2), {
        kind: "Check-in",
        title: "Check-in photo",
        detail: "Redness has faded to a light patch. Itch mostly gone at night.",
        photoIds: [],
        pain: 2,
      }),
      event(ago(3), {
        kind: "Status",
        title: "Open → Healing",
        detail: "You confirmed you were satisfied with your care. Dermi kept the case open for check-ins.",
        photoIds: [],
        pain: 4,
      }),
      event(ago(5), {
        kind: "Consultation",
        title: "Follow-up consultation",
        detail: "Redness smaller after stopping the lotion. Dermi suggested a fragrance-free moisturiser.",
        photoIds: [],
        pain: 5,
      }),
      event(ago(6), {
        kind: "Ingredients",
        title: "Body lotion checked",
        detail: "Fragrance (parfum) and methylisothiazolinone flagged against your allergy profile.",
        photoIds: [],
        pain: null,
      }),
      event(ago(7, 9, 19), {
        kind: "Reminder",
        title: "Moisturise left forearm, 18:00 daily",
        detail: "Added by Dermi at the end of your first consultation.",
        photoIds: [],
        pain: null,
      }),
      event(start, {
        kind: "Consultation",
        title: "Consultation started",
        detail: "Red, itchy patch for 4 days; new body lotion suspected.",
        photoIds: [],
        pain: 6,
      }),
    ],
  };
}

function simpleCase(
  caseId: string,
  scenario: DemoCase["scenario"] & string,
  title: string,
  area: string,
  status: DemoCase["status"],
  updatedAt: string,
  firstMessage: string,
  pain: number,
): DemoCase {
  const createdAt = updatedAt;
  const s = SCENARIOS[scenario];
  return {
    id: caseId,
    title,
    area,
    scenario,
    status,
    createdAt,
    updatedAt,
    started: true,
    photos: [],
    turns: [
      turn("dermi", "Hi Aanya, I'm here with you. What's bothering your skin today?", createdAt),
      turn("user", firstMessage, createdAt),
      turn(
        "dermi",
        `Thank you for telling me.\nIt looks most like ${s.cnn[0]!.condition.toLowerCase()} (${Math.round(s.cnn[0]!.confidence * 100)}%). That's a likelihood, not a diagnosis.\nShall we carry on where we left off? Tell me how it's been since.`,
        createdAt,
      ),
    ],
    context: {
      stage: status === "resolved" ? "closed" : "followup",
      scenario,
      questionIndex: 2,
      hasPhoto: true,
      photoRetries: 0,
      pain,
      satisfied: status === "resolved" ? "yes" : null,
    },
    cnn: { top_k: s.cnn, image_quality: "good", model_version: "vision-demo-mock-0.1" },
    symptoms: [],
    trigger: null,
    pains: [{ at: createdAt, value: pain }],
    events: [
      event(createdAt, {
        kind: "Consultation",
        title: "Consultation started",
        detail: firstMessage,
        photoIds: [],
        pain,
      }),
    ],
  };
}

export function sampleState(): DemoState {
  n = 0;
  const reminders: DemoReminder[] = [
    {
      id: "r-morning",
      title: "Morning routine",
      time: "07:30",
      days: EVERY_DAY,
      repeat: "Every day",
      enabled: true,
    },
    {
      id: "r-spf",
      title: "Reapply sunscreen",
      time: "13:00",
      days: [0, 1, 2, 3, 4],
      repeat: "Weekdays",
      enabled: true,
    },
    {
      id: "r-moist",
      title: "Moisturise left forearm",
      time: "18:00",
      days: EVERY_DAY,
      repeat: "Every day",
      caseId: "sample-dermatitis",
      caseLabel: "Dermatitis",
      enabled: true,
    },
    {
      id: "r-night",
      title: "Night routine",
      time: "22:30",
      days: EVERY_DAY,
      repeat: "Every day",
      enabled: true,
    },
    {
      id: "r-gel",
      title: "Spot gel on jawline",
      time: "22:30",
      days: [0, 2, 4],
      repeat: "Mon, Wed, Fri",
      caseId: "sample-acne",
      caseLabel: "Acne",
      enabled: false,
    },
  ];

  return {
    v: 1,
    profile: {
      name: "Aanya Rao",
      skinType: "Combination",
      tone: 4,
      allergies: ["Fragrance"],
      products: [
        { kind: "Product", name: "Gentle foaming cleanser", when: "AM · PM" },
        { kind: "Product", name: "Niacinamide 10% serum", when: "AM" },
        { kind: "Product", name: "SPF 50 sunscreen", when: "AM" },
        { kind: "Medication", name: "Cetirizine 10 mg", when: "As needed" },
      ],
      concerns: ["Rashes & itching", "Sensitivity"],
    },
    cases: [
      dermatitisCase(),
      simpleCase(
        "sample-acne",
        "acne",
        "Breakouts, jawline",
        "jawline",
        "open",
        ago(1, 20),
        "I keep getting painful spots along my jawline, mostly before my period.",
        4,
      ),
      simpleCase(
        "sample-spot",
        "mole",
        "Mole check, right cheek",
        "right cheek",
        "open",
        ago(3, 11),
        "There's a dark spot on my right cheek I want to keep an eye on.",
        1,
      ),
      simpleCase(
        "sample-dry",
        "eczema",
        "Dry patches, both elbows",
        "both elbows",
        "resolved",
        ago(17, 18),
        "Dry, flaky patches on both elbows since the weather turned cold.",
        3,
      ),
    ],
    reminders,
    ticks: { [new Date().toISOString().slice(0, 10)]: ["r-morning"] },
    avoid: [],
  };
}
