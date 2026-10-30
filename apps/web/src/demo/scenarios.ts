/**
 * DEMO BRANCH ONLY. The four conditions the scripted demo knows about: what the mock CNN returns,
 * what Dermi asks, and what it suggests. Written for the showcase; general, conservative guidance.
 */
import type { CNNOutput } from "@dermiai/schemas";

import type { ReminderSuggestion, Scenario } from "@/demo/types";

type ScenarioDef = {
  label: string;
  titlePrefix: string;
  keywords: string[];
  cnn: CNNOutput["top_k"];
  questions: string[];
  /** Acknowledgements keyed by words in the answer; first match wins. */
  acks: { when: string[]; text: string; trigger?: string }[];
  advice: string[];
  warning: string;
  reminder: (area: string) => ReminderSuggestion;
};

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

export const SCENARIOS: Record<Scenario, ScenarioDef> = {
  "contact-dermatitis": {
    label: "Contact dermatitis",
    titlePrefix: "Itchy patch",
    keywords: [
      "itch",
      "itchy",
      "rash",
      "red",
      "lotion",
      "soap",
      "detergent",
      "cream",
      "perfume",
      "bumpy",
      "bumps",
      "hives",
      "irritat",
      "sting",
    ],
    cnn: [
      { condition: "Allergic contact dermatitis", confidence: 0.72 },
      { condition: "Irritant contact dermatitis", confidence: 0.19 },
      { condition: "Eczema flare", confidence: 0.09 },
    ],
    questions: [
      "Have you started any new soap, detergent, lotion or skincare in the last week?",
      "Does it burn or sting, or is it mostly itchy?",
    ],
    acks: [
      {
        when: ["lotion", "cream", "moisturi"],
        text: "That's a really useful clue — new lotions are one of the most common triggers.",
        trigger: "new lotion",
      },
      {
        when: ["soap", "shower gel", "body wash"],
        text: "That's a useful clue — a new soap can easily do this.",
        trigger: "new soap",
      },
      {
        when: ["detergent", "washing", "fabric"],
        text: "Good thinking — detergents and fabric softeners can set this off.",
        trigger: "new detergent",
      },
      { when: ["perfume", "fragrance"], text: "Thank you — fragrance is a very common trigger.", trigger: "fragrance" },
      { when: ["no", "nothing", "not really"], text: "Okay, that's helpful to rule out." },
      { when: ["itch"], text: "Thank you. Itch rather than burning fits a reaction in the skin." },
      { when: ["burn", "sting"], text: "Thank you. Burning can mean the skin barrier is irritated." },
    ],
    advice: [
      "This looks most like a reaction to something that touched your skin{trigger}.",
      "Put the suspected product aside, and use a gentle fragrance-free moisturiser twice a day.",
      "A cool compress can ease the itch — try not to scratch.",
    ],
    warning: "it spreads, blisters, or you get a fever",
    reminder: (area) => ({ title: `Moisturise ${area}`, time: "18:00", days: EVERY_DAY, repeat: "Every day" }),
  },
  acne: {
    label: "Acne",
    titlePrefix: "Breakouts",
    keywords: [
      "pimple",
      "acne",
      "breakout",
      "breaking out",
      "blackhead",
      "whitehead",
      "zit",
      "oily",
      "cyst",
      "jawline",
      "chin",
    ],
    cnn: [
      { condition: "Acne vulgaris (inflammatory)", confidence: 0.68 },
      { condition: "Folliculitis", confidence: 0.2 },
      { condition: "Rosacea", confidence: 0.12 },
    ],
    questions: [
      "Do the breakouts follow a pattern — around your period, stressful weeks, or after a new product?",
      "What are you using on your skin at the moment?",
    ],
    acks: [
      {
        when: ["period", "cycle", "month"],
        text: "That pattern fits hormonal acne, which often shows up along the jaw and chin.",
        trigger: "hormonal pattern",
      },
      { when: ["stress", "exam", "sleep"], text: "Stress really can make breakouts worse — you're not imagining it.", trigger: "stress" },
      { when: ["new", "product", "makeup", "foundation"], text: "Thank you — some heavier products can clog pores.", trigger: "new product" },
      { when: ["nothing", "just water", "only"], text: "Thanks — a simple routine is a good place to start from." },
    ],
    advice: [
      "This looks most like acne{trigger}. It's very common and usually very treatable.",
      "Wash twice a day with a gentle cleanser, and try not to pick or squeeze — it can leave marks.",
      "Use a non-comedogenic moisturiser and SPF. A pharmacist can suggest benzoyl peroxide or adapalene; start slowly.",
    ],
    warning: "you get painful deep lumps, scarring, or it isn't better in 8–12 weeks",
    reminder: () => ({ title: "Night routine, gentle cleanse", time: "22:00", days: EVERY_DAY, repeat: "Every day" }),
  },
  eczema: {
    label: "Eczema",
    titlePrefix: "Dry patches",
    keywords: ["dry", "flaky", "flaking", "scaly", "eczema", "cracked", "rough", "tight", "peeling"],
    cnn: [
      { condition: "Atopic dermatitis (eczema)", confidence: 0.66 },
      { condition: "Irritant contact dermatitis", confidence: 0.21 },
      { condition: "Psoriasis", confidence: 0.13 },
    ],
    questions: [
      "Have you had patches like this before — maybe as a child?",
      "Does anything seem to set it off: hot showers, cold weather, wool, or stress?",
    ],
    acks: [
      { when: ["child", "before", "always", "yes"], text: "That history fits eczema, which tends to come and go.", trigger: "past flares" },
      { when: ["shower", "hot", "bath"], text: "Long hot showers strip the skin's oils — a very common trigger.", trigger: "hot showers" },
      { when: ["cold", "winter", "weather"], text: "Cold, dry air is hard on eczema-prone skin.", trigger: "cold weather" },
      { when: ["wool", "fabric", "clothes"], text: "Rough fabrics like wool often irritate it.", trigger: "wool" },
      { when: ["stress"], text: "Stress can definitely bring on a flare.", trigger: "stress" },
    ],
    advice: [
      "This looks most like an eczema flare{trigger}.",
      "Use a thick fragrance-free emollient twice a day, especially within a few minutes of bathing.",
      "Keep showers short and lukewarm, and wear soft cotton next to the skin.",
    ],
    warning: "it weeps, crusts over, or becomes very painful",
    reminder: () => ({ title: "Moisturise after shower", time: "08:00", days: EVERY_DAY, repeat: "Every day" }),
  },
  mole: {
    label: "Mole check",
    titlePrefix: "Mole check",
    keywords: ["mole", "dark spot", "freckle", "pigment", "brown spot", "black spot", "birthmark", "spot changed"],
    cnn: [
      { condition: "Benign melanocytic nevus", confidence: 0.61 },
      { condition: "Seborrhoeic keratosis", confidence: 0.24 },
      { condition: "Atypical (dysplastic) nevus", confidence: 0.15 },
    ],
    questions: [
      "Has it changed recently — in size, shape or colour?",
      "Is it itchy, bleeding or crusting at all?",
    ],
    acks: [
      { when: ["no", "same", "hasn't", "not"], text: "That's reassuring — stable moles are usually harmless." },
      { when: ["bigger", "grown", "changed", "darker"], text: "Thank you for telling me. Changes are worth having checked.", trigger: "recent change" },
    ],
    advice: [
      "This looks most like an ordinary mole{trigger}, but moles are best checked in person.",
      "Use the ABCDE check monthly: Asymmetry, Border, Colour, Diameter over 6 mm, Evolving.",
      "Take a photo in the same light each month so changes are easy to spot, and wear SPF.",
    ],
    warning: "it changes shape or colour, grows quickly, bleeds or itches",
    reminder: () => ({ title: "Monthly mole photo", time: "09:00", days: [5], repeat: "Saturdays" }),
  },
};

export const SCENARIO_IDS = Object.keys(SCENARIOS) as Scenario[];

function score(text: string, words: string[]) {
  return words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);
}

/** Best-matching scenario for free text, or null when nothing matches. */
export function scenarioFromText(raw: string): Scenario | null {
  const text = raw.toLowerCase();
  let best: Scenario | null = null;
  let bestScore = 0;
  for (const id of SCENARIO_IDS) {
    const s = score(text, SCENARIOS[id].keywords);
    if (s > bestScore) {
      best = id;
      bestScore = s;
    }
  }
  return best;
}

const AREAS = [
  "forearm",
  "upper arm",
  "arm",
  "wrist",
  "hand",
  "finger",
  "jawline",
  "jaw",
  "chin",
  "cheek",
  "forehead",
  "nose",
  "lip",
  "face",
  "neck",
  "chest",
  "back",
  "shoulder",
  "stomach",
  "belly",
  "thigh",
  "leg",
  "knee",
  "elbow",
  "ankle",
  "foot",
  "scalp",
];

/** "left forearm", "elbows", ... or null. */
export function areaFromText(raw: string): string | null {
  const text = raw.toLowerCase();
  for (const area of AREAS) {
    const m = new RegExp(`\\b(left|right|both)?\\s*${area}(s)?\\b`).exec(text);
    if (m) return m[0].trim();
  }
  return null;
}

/** "4 days", "2 weeks", ... */
export function durationFromText(raw: string): string | null {
  const m = /\b(\d+|a|one|two|three|four|five|six|few|couple of)\s+(day|week|month)s?\b/i.exec(raw);
  if (!m) return null;
  const n = m[1]!.toLowerCase();
  const unit = m[2]!.toLowerCase();
  const plural = !["a", "one", "1"].includes(n);
  return `${n === "a" ? "1" : n} ${unit}${plural ? "s" : ""}`;
}

const SYMPTOM_WORDS: [string, string][] = [
  ["itch", "Itchy"],
  ["red", "Red patch"],
  ["bump", "Small bumps"],
  ["night", "Worse at night"],
  ["burn", "Burning"],
  ["sting", "Stinging"],
  ["dry", "Dry"],
  ["flak", "Flaky"],
  ["crack", "Cracked"],
  ["pimple", "Pimples"],
  ["blackhead", "Blackheads"],
  ["sore", "Sore"],
  ["oily", "Oily skin"],
  ["dark", "Dark spot"],
  ["bigger", "Getting bigger"],
];

export function symptomsFromText(raw: string): string[] {
  const text = raw.toLowerCase();
  const found = SYMPTOM_WORDS.filter(([w]) => text.includes(w)).map(([, label]) => label);
  const duration = durationFromText(raw);
  return duration ? [...found, duration] : found;
}
