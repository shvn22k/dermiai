"use client";

import { type ChangeEvent, useRef, useState } from "react";

import { Dermi } from "@/components/dermi";
import { Arrow, Button, LinkButton, PageHeader, cx } from "@/components/ui";
import { processFile } from "@/demo/client";
import { DemoGate } from "@/demo/gate";
import { analyze, SAMPLE_LABELS, splitIngredients } from "@/demo/ingredients";
import { demo, makeEvent, startedCases } from "@/demo/store";
import type { DemoState } from "@/demo/types";
import type { IngredientLevel } from "@/lib/demo";

const HIGHLIGHTER = "255px 15px 225px 15px / 15px 225px 15px 255px";
const READING_STEPS = ["Finding the ingredients panel", "Reading the label", "Matching against your profile"];

/** Label check (design/screens/IngredientCheck.dc.html). OCR is mocked; matching is real. */
export default function IngredientCheckPage() {
  return (
    <>
      <PageHeader
        title="Ingredient check"
        aside={<span className="caps text-[13px] text-venice">Checked against your profile & cases</span>}
      />
      <DemoGate>{(s) => <IngredientCheck s={s} />}</DemoGate>
    </>
  );
}

type Product = { name: string; text: string; photo: string | null; scanned: string };

function IngredientCheck({ s }: { s: DemoState }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reading, setReading] = useState<number | null>(null);
  const [paste, setPaste] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const sampleIndex = useRef(0);
  const file = useRef<HTMLInputElement>(null);

  const cases = startedCases(s);
  const openCases = cases.filter((c) => c.status !== "resolved");
  const result = product
    ? analyze(splitIngredients(product.text), { profile: s.profile, cases, avoid: s.avoid })
    : null;

  const readLabel = (photo: string | null) => {
    const sample = SAMPLE_LABELS[sampleIndex.current % SAMPLE_LABELS.length]!;
    sampleIndex.current += 1;
    setSaved(null);
    setProduct(null);
    setReading(0);
    READING_STEPS.forEach((_, i) => setTimeout(() => setReading(i + 1), 650 * (i + 1)));
    setTimeout(() => {
      setReading(null);
      setProduct({ ...sample, photo, scanned: "just now" });
    }, 650 * (READING_STEPS.length + 1));
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    readLabel((await processFile(f)).dataUrl);
  };

  const checkPasted = () => {
    if (!paste.trim()) return;
    setSaved(null);
    setProduct({ name: "Your product", text: paste, photo: null, scanned: "just now" });
    setPasteOpen(false);
  };

  const linkCase = openCases[0];
  const saveToCase = () => {
    if (!linkCase || !result || !product) return;
    demo.updateCase(linkCase.id, (c) => ({
      ...c,
      events: [
        makeEvent({
          kind: "Ingredients",
          title: `${product.name} checked`,
          detail: result.flags.length
            ? result.flags.map((f) => `${f.names.join(" & ")} (${f.level})`).join("; ")
            : "Nothing clashed with your profile.",
          photoIds: [],
          pain: null,
        }),
        ...c.events,
      ],
    }));
    setSaved(`Saved to ${linkCase.title}.`);
  };

  return (
    <div className="flex flex-wrap items-start gap-10">
      <section aria-labelledby="prod-h" className="flex min-w-0 flex-[1_1_320px] flex-col gap-[18px]">
        <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-card bg-rock">
          {product?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from the upload
            <img src={product.photo} alt="Uploaded label" className="absolute inset-0 size-full object-cover" />
          ) : (
            <div
              aria-hidden="true"
              className="box-border flex h-[74%] w-[58%] -rotate-3 flex-col gap-[9px] bg-paper px-[18px] py-5"
            >
              <span className="caps text-[10px] font-semibold tracking-[0.12em] text-venice">Ingredients</span>
              {["100%", "88%", "94%", "76%", "90%", "60%"].map((w, i) => (
                <span
                  key={i}
                  className={`h-1 ${result && (i === 2 || i === 4) && result.clashes.length ? "bg-highlight-line" : "bg-line"}`}
                  style={{ width: w }}
                />
              ))}
            </div>
          )}
          {reading !== null && (
            <span className="absolute inset-x-0 h-0.5 animate-scan bg-venice shadow-[0_0_8px_var(--color-venice)]" />
          )}
          <span className="caps absolute top-3.5 left-3.5 rounded-[3px] bg-merino px-2 py-1 text-[11px] text-venice">
            {reading !== null
              ? READING_STEPS[Math.min(reading, READING_STEPS.length - 1)]
              : result
                ? `${result.items.length} ingredients read`
                : "No label yet"}
          </span>
        </div>
        {product && (
          <div className="flex flex-col gap-1">
            <h2 id="prod-h" className="display m-0 text-[30px] text-venice">
              {product.name}
            </h2>
            <span className="caps text-[11px] text-muted">
              {product.photo ? "Demo: sample label text" : "Pasted list"} · scanned {product.scanned}
            </span>
          </div>
        )}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => file.current?.click()} disabled={reading !== null}>
            Snap a label
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setPasteOpen((o) => !o)}>
            Paste a list
          </Button>
          <input ref={file} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        </div>
        {pasteOpen && (
          <div className="flex flex-col gap-2">
            <label htmlFor="paste" className="caps text-xs text-venice">
              Ingredient list
            </label>
            <textarea
              id="paste"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={5}
              placeholder="Aqua, Glycerin, Parfum, …"
              className="rounded-tag border border-line bg-paper p-3 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={checkPasted} disabled={!paste.trim()}>
                Check it
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPaste(SAMPLE_LABELS[0]!.text)}>
                Use a sample
              </Button>
            </div>
          </div>
        )}
        <dl className="m-0 flex flex-col border-t border-line">
          {[
            ["Allergies", s.profile?.allergies.join(", ") || "None listed"],
            ["Skin", s.profile?.skinType || "Not set"],
            ["Open case", linkCase ? `${linkCase.title} · ${linkCase.status}` : "None"],
            ["Avoid list", s.avoid.join(", ") || "Empty"],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-3 border-b border-line py-2.5">
              <dt className="text-[13px] text-muted">{k}</dt>
              <dd className="m-0 text-sm font-normal">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="res-h" className="flex min-w-0 flex-[999_1_520px] flex-col gap-7">
        {!result ? (
          <div className="flex flex-wrap items-end gap-5 rounded-card border border-line bg-paper px-[26px] py-6">
            <Dermi size={84} mood={reading !== null ? "thinking" : "happy"} />
            <div className="flex flex-[1_1_300px] flex-col gap-2">
              <span className="caps text-xs tracking-[0.12em] text-venice">
                {reading !== null ? "Reading your label…" : "How it works"}
              </span>
              <h2 id="res-h" className="display m-0 text-[28px] leading-[1.1] text-venice sm:text-[34px]">
                {reading !== null ? "One moment." : "Snap a product label and I'll check it against your skin."}
              </h2>
              <p className="m-0 text-[15px] leading-relaxed">
                I compare every ingredient with your allergies, your skin type and any case that&apos;s still
                healing. You can also paste an ingredient list.
              </p>
            </div>
          </div>
        ) : (
          <>
            <Verdict clashes={result.clashes.length} watches={result.flags.length - result.clashes.length} healing={linkCase ? linkCase.area || linkCase.title.split(",")[0]!.toLowerCase() : undefined} />

            <div className="flex flex-col gap-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2.5 border-b border-venice pb-2.5">
                <h3 className="caps m-0 text-[13px] tracking-[0.12em] text-venice">The label, marked up</h3>
                <div className="flex gap-4 text-[13px]">
                  <span className="bg-highlight px-1.5" style={{ borderRadius: HIGHLIGHTER }}>
                    clash
                  </span>
                  <span className="underline decoration-venice decoration-wavy underline-offset-4">watch</span>
                </div>
              </div>
              <p className="m-0 text-lg leading-loose">
                {result.items.map(([name, level], i) => (
                  <span key={`${name}-${i}`}>
                    <Ingredient name={name} level={level} rotate={i} />
                    {i < result.items.length - 1 ? ", " : "."}
                  </span>
                ))}
              </p>
            </div>

            {result.flags.length > 0 && (
              <div className="flex flex-col border-t border-venice">
                {result.flags.map((f) => (
                  <article
                    key={f.group}
                    className="grid grid-cols-1 gap-2 border-b border-line py-5 sm:grid-cols-[200px_1fr] sm:gap-6"
                  >
                    <div className="flex flex-col gap-1.5">
                      <h4 className="display m-0 text-2xl leading-[1.15] tracking-normal break-words hyphens-auto text-venice">
                        {f.names.join(" & ")}
                      </h4>
                      <span
                        className={cx(
                          "caps text-[11px] font-semibold tracking-[0.12em]",
                          f.level === "clash" ? "text-alert-text" : "text-venice",
                        )}
                      >
                        {f.level}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="m-0 text-[15px] leading-[1.65]">{f.why}</p>
                      <span className="text-[13px] text-muted">Related to · {f.related}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              {result.clashes.length > 0 && (
                <Button
                  onClick={() => {
                    demo.addAvoid(result.clashes.flatMap((f) => f.names));
                    setSaved("Added to your avoid list.");
                  }}
                >
                  Add to my avoid list
                </Button>
              )}
              {linkCase && (
                <Button variant="secondary" onClick={saveToCase}>
                  Save to {linkCase.title}
                </Button>
              )}
              <LinkButton href={linkCase ? `/consult?case=${linkCase.id}` : "/consult"} variant="ghost">
                Ask Dermi about it <Arrow />
              </LinkButton>
            </div>
            {saved && (
              <p role="status" className="m-0 -mt-3 text-sm text-venice">
                {saved}
              </p>
            )}
          </>
        )}
        <p className="m-0 text-[13px] text-muted">
          Ingredient checks are a guide, not a patch test. If you&apos;re unsure, ask your dermatologist.
        </p>
      </section>
    </div>
  );
}

function Verdict({ clashes, watches, healing }: { clashes: number; watches: number; healing?: string }) {
  if (clashes > 0) {
    return (
      <div role="status" className="flex flex-wrap items-end gap-5 rounded-card border border-alert-border bg-alert-tint px-[26px] py-6">
        <Dermi size={84} mood="concerned" />
        <div className="flex flex-[1_1_300px] flex-col gap-2">
          <span className="caps text-xs font-semibold tracking-[0.12em] text-alert-text">Worth pausing on</span>
          <h2 id="res-h" className="display m-0 text-[28px] leading-[1.1] text-alert-deep sm:text-[34px]">
            {clashes === 1 ? "One ingredient may" : `${clashes === 2 ? "Two" : clashes} ingredients may`} clash with your
            skin right now.
          </h2>
          <p className="m-0 text-[15px] leading-relaxed text-alert-ink">
            {healing
              ? `I'd keep this aside until your ${healing} has settled.`
              : "I'd skip this one, or patch test it first."}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div role="status" className="flex flex-wrap items-end gap-5 rounded-card border border-line bg-paper px-[26px] py-6">
      <Dermi size={84} mood={watches > 0 ? "thinking" : "happy"} />
      <div className="flex flex-[1_1_300px] flex-col gap-2">
        <span className="caps text-xs tracking-[0.12em] text-venice">{watches > 0 ? "Mostly fine" : "Looks good"}</span>
        <h2 id="res-h" className="display m-0 text-[28px] leading-[1.1] text-venice sm:text-[34px]">
          {watches > 0
            ? `Nothing clashes, but ${watches === 1 ? "one thing is" : "a couple of things are"} worth watching.`
            : "Nothing here clashes with your profile."}
        </h2>
      </div>
    </div>
  );
}

function Ingredient({ name, level, rotate }: { name: string; level: IngredientLevel; rotate: number }) {
  if (level === "clash") {
    return (
      <mark
        className="inline-block bg-highlight px-2 font-normal text-alert-deep"
        style={{ borderRadius: HIGHLIGHTER, transform: `rotate(${rotate % 2 === 0 ? -1 : 0.8}deg)` }}
      >
        {name}
        <span className="sr-only"> (clash)</span>
      </mark>
    );
  }
  if (level === "watch") {
    return (
      <span className="font-normal text-venice underline decoration-venice decoration-wavy decoration-[1.5px] underline-offset-[5px]">
        {name}
        <span className="sr-only"> (watch)</span>
      </span>
    );
  }
  return <>{name}</>;
}
