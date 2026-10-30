"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Dermi } from "@/components/dermi";
import { Logo } from "@/components/nav";
import {
  Arrow,
  Button,
  cx,
  fieldLabelClass,
  OptionCard,
  ToggleChip,
  underlineInputClass,
} from "@/components/ui";
import { demo } from "@/demo/store";
import type { DemoProfile } from "@/demo/types";

const STEP_LABELS = ["Skin type", "Skin tone", "Allergies", "Products & medications", "Concerns"];

const DERMI_SAYS = [
  "Let's start simple. By mid-afternoon, how does your skin usually feel?",
  "Skin conditions look different across skin tones. Choosing yours helps me read your photos more fairly.",
  "Has your skin reacted to anything before? I'll check products against this list.",
  "What's on your skin right now? Include any creams or tablets a doctor prescribed.",
  "Last one. What would you most like help with? Pick as many as you like.",
];

const SKIN_TYPES = [
  ["oily", "Oily", "Shiny by midday, visible pores"],
  ["dry", "Dry", "Feels tight, can flake"],
  ["combination", "Combination", "Oily T-zone, drier cheeks"],
  ["normal", "Normal", "Mostly balanced and comfortable"],
  ["sensitive", "Sensitive", "Reacts easily, stings or reddens"],
  ["unsure", "Not sure", "Dermi can help you work it out"],
] as const;

/** Fitzpatrick I-VI. Swatches are content (skin tones), not theme colours. */
const TONES = [
  ["#F6E3D4", "Very fair", "I"],
  ["#EBCBB0", "Fair", "II"],
  ["#D4A585", "Medium", "III"],
  ["#B57F5A", "Olive", "IV"],
  ["#8A5A3B", "Brown", "V"],
  ["#5A3A28", "Deep", "VI"],
] as const;

const ALLERGIES = [
  "Fragrance",
  "Nickel",
  "Lanolin",
  "Parabens",
  "Latex",
  "Sulfates",
  "Methylisothiazolinone",
  "Hair dye (PPD)",
  "None I know of",
];

const CONCERNS = [
  ["Acne", "Breakouts, blackheads"],
  ["Rashes & itching", "Red, itchy or bumpy"],
  ["Pigmentation", "Dark spots, uneven tone"],
  ["Dryness", "Flaky or rough patches"],
  ["Eczema", "Recurring flare-ups"],
  ["Sensitivity", "Stinging, redness"],
  ["Scalp", "Dandruff, itchy scalp"],
  ["Moles & spots", "Keep an eye on changes"],
] as const;

type Product = { kind: "Product" | "Medication"; name: string; when: string };

function toggleIn(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

const h1 =
  "display m-0 text-[36px] leading-[1.05] tracking-[-0.03em] text-venice sm:text-[52px]";

/** Five-step skin profile (design/screens/Onboarding.dc.html). Demo: saves to browser storage. */
export function OnboardingView({
  initialStep = 1,
  initial,
}: {
  initialStep?: number;
  initial: DemoProfile | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState(initial?.name ?? "");
  const [skinType, setSkinType] = useState(
    SKIN_TYPES.find(([, label]) => label === initial?.skinType)?.[0] ?? "",
  );
  const [tone, setTone] = useState(initial?.tone ?? 0);
  const [allergies, setAllergies] = useState<string[]>(
    initial?.allergies.filter((a) => ALLERGIES.includes(a)) ?? [],
  );
  const [otherAllergy, setOtherAllergy] = useState(
    initial?.allergies.filter((a) => !ALLERGIES.includes(a)).join(", ") ?? "",
  );
  const [concerns, setConcerns] = useState<string[]>(initial?.concerns ?? []);
  const [draft, setDraft] = useState("");
  const [products, setProducts] = useState<Product[]>(initial?.products ?? []);

  const save = () => {
    const extra = otherAllergy
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    demo.setProfile({
      name: name.trim() || "Friend",
      skinType: SKIN_TYPES.find(([id]) => id === skinType)?.[1] ?? "Not sure",
      tone,
      allergies: [...allergies.filter((a) => a !== "None I know of"), ...extra],
      products,
      concerns,
    });
  };
  const finish = () => {
    save();
    router.push("/dashboard");
  };

  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const addProduct = () => {
    const name = draft.trim();
    if (!name) return;
    setProducts((p) => [...p, { kind: "Product", name, when: "Daily" }]);
    setDraft("");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-venice">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-[clamp(20px,4vw,48px)] py-4">
          <Logo size={36} />
          <span className="caps order-last w-full text-[13px] text-venice sm:order-none sm:w-auto">
            Your skin profile · step {step} of 5
          </span>
          <button
            type="button"
            onClick={finish}
            className="caps cursor-pointer py-3 text-[13px] text-venice hover:text-ink"
          >
            Save &amp; finish later
          </button>
        </div>
      </header>

      <main className="mx-auto box-border flex w-full max-w-7xl flex-1 flex-wrap items-start gap-12 px-[clamp(20px,4vw,48px)] pt-10 pb-16">
        <aside className="flex max-w-[380px] flex-[1_1_300px] flex-col gap-[22px]">
          <ol aria-label="Progress" className="m-0 flex list-none flex-col border-t border-line p-0">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const state = n < step ? "Done" : n === step ? "Now" : "";
              return (
                <li
                  key={label}
                  aria-current={n === step ? "step" : undefined}
                  className={cx(
                    "flex items-center gap-3.5 border-b border-line py-3",
                    n === step ? "text-venice" : n < step ? "text-ink" : "text-muted",
                  )}
                >
                  <span className="caps w-[22px] text-xs">0{n}</span>
                  <span className={cx("flex-1 text-[15px]", n === step ? "font-medium" : "font-light")}>
                    {label}
                  </span>
                  <span className="caps text-[11px]">{state}</span>
                </li>
              );
            })}
          </ol>
          <div className="flex items-start gap-3.5 pt-2">
            <Dermi size={88} mood={step === 2 ? "thinking" : "happy"} />
            <div
              aria-live="polite"
              className="display flex-1 -rotate-1 rounded-tag border border-line bg-paper px-[18px] py-4 text-xl leading-[1.3] tracking-normal text-ink"
            >
              {DERMI_SAYS[step - 1]}
            </div>
          </div>
          <p className="m-0 text-sm leading-relaxed text-muted">
            You can change any of this later in Profile. Not sure? Skip — Dermi will ask again when
            it matters.
          </p>
        </aside>

        <section aria-labelledby="ob-title" className="flex min-w-0 flex-[999_1_560px] flex-col gap-7">
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <label htmlFor="ob-name" className={cx(fieldLabelClass, "max-w-[420px]")}>
                What should Dermi call you?
                <input
                  id="ob-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className={underlineInputClass}
                />
              </label>
              <h1 id="ob-title" className={h1}>
                What&apos;s your skin type?
              </h1>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3">
                {SKIN_TYPES.map(([id, label, hint]) => (
                  <OptionCard
                    key={id}
                    selected={skinType === id}
                    onClick={() => setSkinType(id)}
                    className="px-5 py-[18px]"
                  >
                    <span className="caps text-sm text-venice">{label}</span>
                    <span className="text-[15px] leading-normal">{hint}</span>
                  </OptionCard>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <h1 id="ob-title" className={h1}>
                Which skin tone is closest to yours?
              </h1>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(130px,100%),1fr))] gap-3">
                {TONES.map(([hex, label, roman], i) => (
                  <OptionCard
                    key={roman}
                    selected={tone === i + 1}
                    onClick={() => setTone(i + 1)}
                    className="px-2.5 pt-2.5 pb-3.5"
                  >
                    <span className="h-[88px] w-full rounded-tag" style={{ background: hex }} />
                    <span className="caps text-xs text-venice">Type {roman}</span>
                    <span className="text-[15px]">{label}</span>
                  </OptionCard>
                ))}
              </div>
              <p className="m-0 text-sm text-muted">
                Based on the Fitzpatrick scale. Used only to read your photos more fairly.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <h1 id="ob-title" className={h1}>
                Any known allergies or sensitivities?
              </h1>
              <div className="flex flex-wrap gap-2.5">
                {ALLERGIES.map((a) => (
                  <ToggleChip
                    key={a}
                    selected={allergies.includes(a)}
                    onClick={() => setAllergies((l) => toggleIn(l, a))}
                  >
                    {a}
                  </ToggleChip>
                ))}
              </div>
              <label htmlFor="ob-allergy" className={cx(fieldLabelClass, "max-w-[420px]")}>
                Something else?
                <input
                  id="ob-allergy"
                  type="text"
                  value={otherAllergy}
                  onChange={(e) => setOtherAllergy(e.target.value)}
                  placeholder="e.g. tea tree oil"
                  className={underlineInputClass}
                />
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6">
              <h1 id="ob-title" className={h1}>
                What are you using right now?
              </h1>
              <ul className="m-0 flex list-none flex-col border-t border-line p-0">
                {products.map((p, i) => (
                  <li
                    key={`${p.name}-${i}`}
                    className="grid min-h-14 grid-cols-[1fr_44px] items-center gap-x-3.5 border-b border-line py-1 sm:grid-cols-[110px_1fr_auto_44px]"
                  >
                    <span className="caps text-[11px] text-venice max-sm:col-span-2 max-sm:pt-1">
                      {p.kind}
                    </span>
                    <span className="text-base max-sm:row-start-2">{p.name}</span>
                    <span className="text-[13px] text-muted max-sm:hidden">{p.when}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => setProducts((list) => list.filter((_, j) => j !== i))}
                      className="size-11 cursor-pointer text-[22px] font-light text-muted hover:text-venice max-sm:row-start-2"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addProduct();
                }}
                className="flex flex-wrap items-end gap-3"
              >
                <label htmlFor="ob-product" className={cx(fieldLabelClass, "flex-[1_1_280px]")}>
                  Add a product or medication
                  <input
                    id="ob-product"
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="e.g. Retinol 0.3% night cream"
                    className={underlineInputClass}
                  />
                </label>
                <Button type="submit" variant="secondary" className="min-h-[46px]">
                  Add
                </Button>
              </form>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-6">
              <h1 id="ob-title" className={h1}>
                What would you like help with?
              </h1>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(210px,100%),1fr))] gap-3">
                {CONCERNS.map(([label, hint]) => (
                  <OptionCard
                    key={label}
                    selected={concerns.includes(label)}
                    onClick={() => setConcerns((l) => toggleIn(l, label))}
                    className="px-5 py-[18px]"
                  >
                    <span className="caps text-sm text-venice">{label}</span>
                    <span className="text-sm">{hint}</span>
                  </OptionCard>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-venice pt-[22px]">
            <Button variant="ghost" onClick={back} disabled={step === 1} className="px-1">
              <Arrow>←</Arrow> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={next}
                className="text-muted"
                hidden={step === 5}
                disabled={step === 1 && !name.trim()}
              >
                Skip
              </Button>
              {step < 5 ? (
                <Button
                  onClick={next}
                  disabled={step === 1 && !name.trim()}
                  className="min-h-[52px] px-[26px]"
                >
                  Continue <Arrow />
                </Button>
              ) : (
                <Button onClick={finish} className="min-h-[52px] px-[26px]">
                  Finish &amp; meet Dermi <Arrow />
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
