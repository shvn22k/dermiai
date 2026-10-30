/**
 * DEMO BRANCH ONLY. Scripted stand-in for the fine-tuned Dermi LLM. Pure and stateless: the client sends
 * the conversation context with each call and gets the next turn back. Turn text uses light markup the
 * chat renders progressively while it streams:
 *   "? text"  question line      "01 text"  numbered row      "! text"  alert headline
 */
import type { CNNOutput } from "@dermiai/schemas";

import { retrieve } from "@/demo/knowledge";
import {
  areaFromText,
  SCENARIO_IDS,
  SCENARIOS,
  scenarioFromText,
  symptomsFromText,
} from "@/demo/scenarios";
import type {
  CasePatch,
  DemoContext,
  DemoMetaEvent,
  DemoProfileLite,
  Scenario,
  Source,
  UserEvent,
  Widget,
} from "@/demo/types";

export type EngineInput = {
  context: DemoContext;
  event: UserEvent;
  cnn: CNNOutput | null;
  profile: DemoProfileLite;
  /** Everything the person has typed so far in this consultation. */
  transcript: string;
};

export type EngineTurn = {
  statuses: string[];
  text: string;
  escalate: boolean;
  flags: string[];
  meta: Omit<DemoMetaEvent, "type">;
};

const PAIN_Q = "? On a scale of 1 to 10, how would you rate your discomfort?";

/* ---------- red flags ---------- */

type RedFlagKind = "emergency" | "infection" | "mole";

const RED_FLAGS: { re: RegExp; label: string; kind: RedFlagKind }[] = [
  { re: /(trouble|difficulty|hard to|can'?t|cannot)\s+breath/, label: "Trouble breathing", kind: "emergency" },
  {
    re: /(swollen|swelling)[^.]{0,20}(face|lips?|eyes?|tongue|throat)|(face|lips?|eyes?|tongue|throat)[^.]{0,12}(swollen|swelling)/,
    label: "Facial swelling",
    kind: "emergency",
  },
  { re: /\bfever|high temperature/, label: "Fever", kind: "infection" },
  {
    re: /spread(ing|s)?\s+(really\s+)?(fast|quickly|rapidly|up|all over)/,
    label: "Spreading fast",
    kind: "infection",
  },
  {
    re: /\b(it|patch|rash|skin|area)\s+(feels?|is)\s+(really\s+|very\s+)?(hot|warm)\b|\bit'?s\s+(really\s+|very\s+)?(hot|warm)\s+to\b|(hot|warm)\s+to\s+(the\s+)?touch/,
    label: "Warm to touch",
    kind: "infection",
  },
  { re: /\bpus\b|oozing/, label: "Pus", kind: "infection" },
  { re: /bleed/, label: "Bleeding", kind: "mole" },
];

function negated(text: string, index: number) {
  return /\b(no|not|without|never|n't|dont)\b[^.,;!?]*$/.test(text.slice(Math.max(0, index - 30), index));
}

export function findRedFlags(raw: string, scenario: Scenario | null) {
  const text = raw.toLowerCase();
  // Bleeding matters for moles/spots; a scratched eczema patch can bleed without being urgent.
  const aboutMole = scenario === "mole" || /\b(mole|spot|freckle)\b/.test(text);
  return RED_FLAGS.filter((f) => {
    if (f.kind === "mole" && !aboutMole) return false;
    const m = f.re.exec(text);
    return m !== null && !negated(text, m.index);
  });
}

const RED_FLAG_COPY: Record<RedFlagKind, string[]> = {
  emergency: [
    "! Please get urgent help now.",
    "Swelling of the face or lips, or trouble breathing, can be a serious allergic reaction. Please call your local emergency number or go to the nearest emergency department straight away.",
    "If you have an adrenaline auto-injector that a doctor prescribed for you, use it as you were shown.",
  ],
  infection: [
    "! I'd like a dermatologist to see this soon.",
    "A rash that spreads quickly, feels hot or comes with a fever can be a sign of a skin infection that needs proper treatment. There's no need to panic — but please don't wait on this one. Try to see a dermatologist or doctor within the next 24 hours.",
    "If you feel very unwell, the redness spreads fast over the next few hours, or you have trouble breathing, go to the nearest emergency department.",
  ],
  mole: [
    "! I'd like a dermatologist to look at this in person.",
    "A spot that bleeds or keeps changing should be checked by a dermatologist. Most turn out to be harmless, but it's important not to wait — please book an appointment within the next week or two.",
    "Take a clear photo now so you can show how it looks today.",
  ],
};

/* ---------- helpers ---------- */

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function scenarioFromCnn(cnn: CNNOutput | null): Scenario | null {
  const top = cnn?.top_k[0]?.condition;
  return SCENARIO_IDS.find((id) => SCENARIOS[id].cnn[0]?.condition === top) ?? null;
}

function titleFor(scenario: Scenario, area: string | null) {
  const prefix = SCENARIOS[scenario].titlePrefix;
  return area ? `${prefix}, ${area}` : prefix;
}

function painBand(n: number) {
  if (n <= 3) return "mild";
  if (n <= 6) return "moderate";
  if (n <= 8) return "severe";
  return "very severe";
}

function numbered(items: string[]) {
  return items.map((item, i) => `${String(i + 1).padStart(2, "0")} ${item}`);
}

function retrievalAnswer(text: string): { lines: string[]; sources: Source[] } {
  const sources = retrieve(text, 1);
  const note = sources[0];
  if (!note) {
    return {
      lines: [
        "That's a good question, and I don't want to guess. It's one to ask your dermatologist — you can take your case report with you.",
      ],
      sources,
    };
  }
  return {
    lines: [
      "Here's what I know about that:",
      note.snippet,
      "If you're unsure, your dermatologist can tell you for certain.",
    ],
    sources,
  };
}

/* ---------- engine ---------- */

export function respond({ context, event, cnn, profile, transcript }: EngineInput): EngineTurn {
  const ctx: DemoContext = { ...context };
  const patch: CasePatch = {};
  const statuses: string[] = [];
  let lines: string[] = [];
  let widget: Widget | null = null;
  let mood: DemoMetaEvent["mood"] = "happy";
  let sources: Source[] = [];
  let escalate = false;
  const flags: string[] = [];
  const name = firstName(profile.name);
  const area = areaFromText(transcript);

  const done = (): EngineTurn => ({
    statuses,
    text: lines.join("\n"),
    escalate,
    flags,
    meta: { context: ctx, widget, mood, sources, patch },
  });

  if (event.kind === "message") {
    const symptoms = symptomsFromText(transcript);
    if (symptoms.length) patch.symptoms = symptoms;
    if (area) patch.area = area;

    const redFlags = findRedFlags(event.text, ctx.scenario);
    if (redFlags.length > 0) {
      const kind: RedFlagKind = redFlags.some((f) => f.kind === "emergency")
        ? "emergency"
        : redFlags.some((f) => f.kind === "infection")
          ? "infection"
          : "mole";
      statuses.push("Checking for warning signs");
      ctx.stage = "redflag";
      lines = RED_FLAG_COPY[kind];
      widget = "redflag";
      mood = "concerned";
      escalate = true;
      flags.push(`red_flag:${kind}`, ...redFlags.map((f) => `symptom:${f.label}`));
      patch.status = "see-dermatologist";
      patch.symptoms = [...redFlags.map((f) => f.label), ...symptoms];
      if (!ctx.scenario) {
        const what = { emergency: "Urgent swelling", infection: "Spreading rash", mole: "Mole check" }[kind];
        patch.title = area ? `${what}, ${area}` : what;
      }
      sources = retrieve(kind === "mole" ? "mole changing bleeding abcde" : "fever spreading hot infection doctor", 1);
      return done();
    }
  }

  const scenario = ctx.scenario ? SCENARIOS[ctx.scenario] : null;

  switch (event.kind) {
    case "start": {
      ctx.stage = "describe";
      lines = [
        `Hi ${name}, I'm here with you. What's bothering your skin today?`,
        "Tell me in your own words — and add a photo whenever you're ready.",
      ];
      return done();
    }

    case "photo": {
      if ((event.quality === "poor" || event.quality === "unusable") && ctx.photoRetries < 2) {
        ctx.photoRetries += 1;
        mood = "thinking";
        widget = "photo";
        lines = [
          "Thank you. This one's a little dark or blurry for me to read well.",
          "Could you try again in natural light, about 15 cm away? Hold still for a second.",
        ];
        return done();
      }

      const fromCnn = scenarioFromCnn(cnn) ?? ctx.scenario ?? "contact-dermatitis";
      const firstPhoto = !ctx.hasPhoto;
      ctx.hasPhoto = true;
      ctx.scenario = fromCnn;
      patch.scenario = fromCnn;
      patch.title = titleFor(fromCnn, area);
      const top = cnn?.top_k[0];
      const def = SCENARIOS[fromCnn];

      lines = [
        event.quality === "acceptable"
          ? "Thanks — that's clear enough for me to work with."
          : "Thank you — the photo is clear and really helps.",
      ];
      if (top) {
        lines.push(
          `It looks most like ${top.condition.toLowerCase()} (${pct(top.confidence)}). That's a likelihood, not a diagnosis.`,
        );
      }

      if (!firstPhoto || !["describe", "await-photo"].includes(ctx.stage)) {
        lines.push("I've added it to your case.");
        if (ctx.stage === "satisfaction" || ctx.stage === "followup") widget = "satisfaction";
        if (ctx.stage === "pain") {
          lines.push(PAIN_Q);
          widget = "pain";
        }
        return done();
      }

      if (transcript.trim() === "") {
        ctx.stage = "describe";
        lines.push("Can you tell me a little about it — where it is, how long you've had it and how it feels?");
        return done();
      }

      ctx.stage = "questions";
      ctx.questionIndex = 1;
      lines.push("A few gentle questions so I understand it better.", `? ${def.questions[0]}`);
      return done();
    }

    case "pain": {
      ctx.pain = event.value;
      const id = ctx.scenario ?? scenarioFromText(transcript) ?? "contact-dermatitis";
      const def = SCENARIOS[id];
      ctx.scenario = id;
      ctx.stage = "satisfaction";
      statuses.push("Looking through dermatology notes");
      sources = retrieve(`${def.label} ${transcript}`, 2);
      if (sources.length) statuses.push(`Found ${sources.length}: ${sources.map((s) => s.title).join(", ")}`);
      statuses.push("Putting your summary together");

      const trigger = transcript.toLowerCase();
      const ack = def.acks.find((a) => a.trigger && a.when.some((w) => trigger.includes(w)));
      const reminder = def.reminder(area ?? "the area");
      patch.reminder = reminder;
      patch.scenario = id;
      patch.title = titleFor(id, area);

      const items = def.advice.map((a) => a.replace("{trigger}", ack?.trigger ? `, possibly the ${ack.trigger}` : ""));
      if (profile.allergies.includes("Fragrance") && (id === "contact-dermatitis" || id === "eczema")) {
        items.push(
          "You told me fragrance bothers your skin, so check labels for parfum and fragrance allergens — Ingredient check can do that for you.",
        );
      }
      if (event.value >= 8) {
        items.push("If the discomfort stops you sleeping or working, a doctor can prescribe something stronger.");
      }
      items.push(
        `I've set a reminder — "${reminder.title}" at ${reminder.time} — and I'll ask for a photo in a couple of days.`,
        `If ${def.warning}, please see a dermatologist.`,
      );

      lines = [
        event.value >= 8
          ? `${event.value} out of 10 — that's a lot to put up with. Thank you for telling me.`
          : `Thank you — ${event.value} out of 10, so ${painBand(event.value)}.`,
        "Here's what we worked out together:",
        ...numbered(items),
        "? Are you satisfied with your care?",
      ];
      widget = "satisfaction";
      return done();
    }

    case "satisfied": {
      ctx.satisfied = event.value;
      if (event.value === "yes") {
        ctx.stage = "closed";
        patch.status = "healing";
        lines = [
          `Thank you, ${name}. I've saved this case as Healing — you can reopen it any time, and I'll check in with you.`,
        ];
      } else {
        ctx.stage = "followup";
        lines = ["Of course — take your time. What else is on your mind?"];
      }
      return done();
    }

    case "message": {
      const text = event.text;
      switch (ctx.stage) {
        case "greet":
        case "describe": {
          if (ctx.hasPhoto && scenario) {
            ctx.stage = "questions";
            ctx.questionIndex = 1;
            patch.title = titleFor(ctx.scenario!, area);
            lines = ["Thank you for telling me.", `? ${scenario.questions[0]}`];
            return done();
          }
          const guess = scenarioFromText(transcript);
          ctx.scenario = guess;
          ctx.stage = "await-photo";
          widget = "photo";
          lines = [
            area ? `Thank you for telling me about your ${area}.` : "Thank you for telling me.",
            "A clear photo would really help me see it. Tap + Photo to take one, or upload one you already have.",
          ];
          return done();
        }

        case "await-photo": {
          const id = ctx.scenario ?? scenarioFromText(transcript) ?? "contact-dermatitis";
          ctx.scenario = id;
          ctx.stage = "questions";
          ctx.questionIndex = 1;
          patch.scenario = id;
          patch.title = titleFor(id, area);
          lines = [
            "That's okay — we can carry on without a photo. I'll be a little less sure, so a photo later still helps.",
            `? ${SCENARIOS[id].questions[0]}`,
          ];
          return done();
        }

        case "questions": {
          const def = scenario ?? SCENARIOS["contact-dermatitis"];
          const lower = text.toLowerCase();
          const ack = def.acks.find((a) => a.when.some((w) => lower.includes(w)));
          if (ack?.trigger) patch.trigger = ack.trigger;
          if (ctx.questionIndex < def.questions.length) {
            lines = [ack?.text ?? "Thank you.", `? ${def.questions[ctx.questionIndex]}`];
            ctx.questionIndex += 1;
          } else {
            ctx.stage = "pain";
            lines = [ack?.text ?? "Thank you, that helps.", PAIN_Q];
            widget = "pain";
          }
          return done();
        }

        case "pain": {
          const n = Number(/\b(10|[1-9])\b/.exec(text)?.[1]);
          if (n) return respond({ context: ctx, event: { kind: "pain", value: n }, cnn, profile, transcript });
          lines = ["Whenever you're ready — tap a face below, or just type a number from 1 to 10."];
          widget = "pain";
          return done();
        }

        case "redflag": {
          statuses.push("Searching dermatology notes");
          const answer = retrievalAnswer(text);
          sources = answer.sources;
          mood = "concerned";
          lines = [...answer.lines, "I'd still like a doctor to see this soon."];
          return done();
        }

        default: {
          // satisfaction / followup / closed: answer from the notes, keep the person in charge.
          statuses.push("Searching dermatology notes");
          const answer = retrievalAnswer(text);
          sources = answer.sources;
          lines = answer.lines;
          if (ctx.stage !== "closed") {
            ctx.stage = "satisfaction";
            lines.push("? Are you satisfied with your care?");
            widget = "satisfaction";
          }
          return done();
        }
      }
    }
  }
}
