/**
 * DEMO BRANCH ONLY. Ingredient matching against the person's profile, open cases and avoid list.
 * Label reading (OCR) is mocked with sample labels; this matching runs on whatever text it gets.
 */
import type { DemoCase, DemoProfile } from "@/demo/types";
import type { IngredientLevel } from "@/lib/demo";

export const SAMPLE_LABELS = [
  {
    name: "Soothing Body Lotion",
    text: "Aqua, Glycerin, Cetearyl Alcohol, Caprylic/Capric Triglyceride, Butyrospermum Parkii (Shea) Butter, Dimethicone, Parfum (Fragrance), Methylisothiazolinone, Linalool, Limonene, Tocopherol, Sodium Hydroxide",
  },
  {
    name: "Clear Skin Gel Moisturiser",
    text: "Aqua, Glycerin, Niacinamide, Isopropyl Myristate, Dimethicone, Sodium Hyaluronate, Cocos Nucifera (Coconut) Oil, Phenoxyethanol, Tocopherol",
  },
  {
    name: "Daily Foaming Wash",
    text: "Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Glycerin, Sodium Chloride, Methylparaben, Propylparaben, Citric Acid",
  },
];

type Ctx = { profile: DemoProfile | null; cases: DemoCase[]; avoid: string[] };

type Rule = {
  group: string;
  re: RegExp;
  level: (c: Ctx) => { level: IngredientLevel; why: string; related: string } | null;
};

const has = (c: Ctx, allergy: string) => c.profile?.allergies.includes(allergy) ?? false;
const openCase = (c: Ctx, scenarios: string[]) =>
  c.cases.find((x) => x.started && x.status !== "resolved" && x.scenario && scenarios.includes(x.scenario));
const skin = (c: Ctx) => c.profile?.skinType.toLowerCase() ?? "";

const RULES: Rule[] = [
  {
    group: "Fragrance",
    re: /\b(parfum|fragrance|perfume|aroma)\b/i,
    level: (c) => {
      if (has(c, "Fragrance"))
        return {
          level: "clash",
          why: "You told me fragrance has bothered your skin before. It's one of the most common causes of allergic contact dermatitis.",
          related: ["fragrance allergy", openCase(c, ["contact-dermatitis"])?.title].filter(Boolean).join(", "),
        };
      const healing = openCase(c, ["contact-dermatitis", "eczema"]);
      if (healing || skin(c) === "sensitive")
        return {
          level: "watch",
          why: "Fragrance is a common trigger for irritated or healing skin.",
          related: healing?.title ?? "sensitive skin",
        };
      return null;
    },
  },
  {
    group: "Fragrance allergens",
    re: /\b(linalool|limonene|citronellol|geraniol|eugenol|coumarin|hexyl cinnamal|citral|benzyl salicylate)\b/i,
    level: (c) =>
      has(c, "Fragrance") || skin(c) === "sensitive"
        ? {
            level: "watch",
            why: "Fragrance components that can become more irritating as a product ages and meets air. Not a problem for everyone, but worth noting with your profile.",
            related: has(c, "Fragrance") ? "fragrance allergy" : "sensitive skin",
          }
        : null,
  },
  {
    group: "Methylisothiazolinone",
    re: /methyl(chloro)?isothiazolinone/i,
    level: (c) => {
      const dermatitis = openCase(c, ["contact-dermatitis"]);
      return {
        level: has(c, "Methylisothiazolinone") || dermatitis ? "clash" : "watch",
        why: "A preservative that's often linked to contact allergy, especially in leave-on products like lotions. Best avoided while your skin heals.",
        related: dermatitis?.title ?? (has(c, "Methylisothiazolinone") ? "your MI allergy" : "common contact allergen"),
      };
    },
  },
  {
    group: "Parabens",
    re: /\b\w*paraben\b/i,
    level: (c) =>
      has(c, "Parabens")
        ? { level: "clash", why: "You listed parabens as an allergy.", related: "paraben allergy" }
        : null,
  },
  {
    group: "Lanolin",
    re: /lanolin|wool (fat|wax)|adeps lanae/i,
    level: (c) =>
      has(c, "Lanolin")
        ? { level: "clash", why: "You listed lanolin as an allergy.", related: "lanolin allergy" }
        : openCase(c, ["eczema"])
          ? { level: "watch", why: "Lanolin can irritate eczema-prone skin in some people.", related: "eczema" }
          : null,
  },
  {
    group: "Sulfates",
    re: /sodium (lauryl|laureth) sulfate|ammonium lauryl sulfate|\bsles?\b/i,
    level: (c) => {
      if (has(c, "Sulfates"))
        return { level: "clash", why: "You listed sulfates as a sensitivity.", related: "sulfate sensitivity" };
      const eczema = openCase(c, ["eczema"]);
      if (eczema || ["dry", "sensitive"].includes(skin(c)))
        return {
          level: "watch",
          why: "Strong foaming cleansers can strip dry or eczema-prone skin. A cream cleanser may be kinder.",
          related: eczema?.title ?? `${skin(c)} skin`,
        };
      return null;
    },
  },
  {
    group: "PPD",
    re: /phenylenediamine|\bppd\b/i,
    level: (c) =>
      has(c, "Hair dye (PPD)")
        ? { level: "clash", why: "You listed hair dye (PPD) as an allergy.", related: "PPD allergy" }
        : { level: "watch", why: "A strong contact allergen found in dark hair dyes. Patch test first.", related: "common allergen" },
  },
  {
    group: "Pore-clogging oils",
    re: /isopropyl (myristate|palmitate)|coconut\)? oil|cocos nucifera|cocoa butter|theobroma cacao/i,
    level: (c) => {
      const acne = openCase(c, ["acne"]);
      if (acne || c.profile?.concerns.includes("Acne") || skin(c) === "oily")
        return {
          level: "watch",
          why: "Can clog pores in acne-prone skin. Fine for many people, but worth watching while you have breakouts.",
          related: acne?.title ?? "acne-prone skin",
        };
      return null;
    },
  },
  {
    group: "Drying alcohol",
    re: /alcohol denat|denatured alcohol|\bsd alcohol/i,
    level: (c) =>
      ["dry", "sensitive"].includes(skin(c)) || openCase(c, ["eczema"])
        ? { level: "watch", why: "Can dry out and sting dry or sensitive skin.", related: `${skin(c) || "dry"} skin` }
        : null,
  },
];

export type Flag = { group: string; names: string[]; level: IngredientLevel; why: string; related: string };

export function splitIngredients(text: string): string[] {
  return text
    .replace(/^\s*ingredients\s*:?/i, "")
    .split(/,(?![^(]*\))|\n|;/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

export function analyze(ingredients: string[], ctx: Ctx) {
  const levels = new Map<string, IngredientLevel>(ingredients.map((i) => [i, "ok"]));
  const flags: Flag[] = [];
  const rank = { ok: 0, watch: 1, clash: 2 } as const;
  const mark = (name: string, level: IngredientLevel) => {
    if (rank[level] > rank[levels.get(name) ?? "ok"]) levels.set(name, level);
  };

  for (const rule of RULES) {
    const names = ingredients.filter((i) => rule.re.test(i));
    if (names.length === 0) continue;
    const verdict = rule.level(ctx);
    if (!verdict) continue;
    names.forEach((n) => mark(n, verdict.level));
    flags.push({ group: rule.group, names, ...verdict });
  }

  // Anything the person typed as an allergy, or added to their avoid list.
  const known = new Set(["Fragrance", "Methylisothiazolinone", "Parabens", "Lanolin", "Sulfates", "Hair dye (PPD)", "Nickel", "Latex"]);
  const custom = [
    ...(ctx.profile?.allergies.filter((a) => !known.has(a)).map((a) => ({ term: a, why: `You listed ${a} as an allergy.` })) ?? []),
    ...ctx.avoid.map((a) => ({ term: a, why: "It's on your avoid list." })),
  ];
  for (const { term, why } of custom) {
    const names = ingredients.filter((i) => i.toLowerCase().includes(term.toLowerCase()));
    if (names.length === 0 || flags.some((f) => f.level === "clash" && names.every((n) => f.names.includes(n)))) continue;
    names.forEach((n) => mark(n, "clash"));
    flags.push({ group: term, names, level: "clash", why, related: "your profile" });
  }

  flags.sort((a, b) => rank[b.level] - rank[a.level]);
  return {
    items: ingredients.map((i) => [i, levels.get(i) ?? "ok"] as [string, IngredientLevel]),
    flags,
    clashes: flags.filter((f) => f.level === "clash"),
  };
}
