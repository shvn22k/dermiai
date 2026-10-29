import type { Metadata } from "next";

import { Dermi } from "@/components/dermi";
import { Arrow, Button, LinkButton, PageHeader } from "@/components/ui";
import { cases, type IngredientLevel, profile, scannedProduct } from "@/lib/demo";

export const metadata: Metadata = { title: "Ingredient check" };

const HIGHLIGHTER = "255px 15px 225px 15px / 15px 225px 15px 255px";

/** Label scan result (design/screens/IngredientCheck.dc.html). No backend yet: needs OCR + an ingredient source. */
export default function IngredientCheckPage() {
  const p = scannedProduct;
  const openCase = cases.find((c) => c.status === "healing");
  let clashIndex = 0;

  return (
    <>
      <PageHeader
        title="Ingredient check"
        aside={
          <span className="caps text-[13px] text-venice">Checked against your profile & cases</span>
        }
      />

      <div className="flex flex-wrap items-start gap-10">
        <section aria-labelledby="prod-h" className="flex min-w-0 flex-[1_1_320px] flex-col gap-[18px]">
          <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-card bg-rock">
            <div
              aria-hidden="true"
              className="box-border flex h-[74%] w-[58%] -rotate-3 flex-col gap-[9px] bg-paper px-[18px] py-5"
            >
              <span className="caps text-[10px] font-semibold tracking-[0.12em] text-venice">
                Ingredients
              </span>
              {["100%", "88%", "94%", "76%", "90%", "60%"].map((w, i) => (
                <span
                  key={i}
                  className={`h-1 ${i === 2 || i === 4 ? "bg-highlight-line" : "bg-line"}`}
                  style={{ width: w }}
                />
              ))}
            </div>
            <span className="caps absolute top-3.5 left-3.5 rounded-[3px] bg-merino px-2 py-1 text-[11px] text-venice">
              {p.ingredients.length} ingredients read
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <h2 id="prod-h" className="display m-0 text-[30px] text-venice">
              {p.name}
            </h2>
            <span className="caps text-[11px] text-muted">
              {p.brand} · scanned {p.scanned}
            </span>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1">Snap a label</Button>
            <Button variant="secondary" className="flex-1">
              Upload
            </Button>
          </div>
          <dl className="m-0 flex flex-col border-t border-line">
            {[
              ["Allergy", profile.allergies.join(", ")],
              ["Skin", profile.skinType],
              ["Open case", openCase ? `${openCase.name} · ${openCase.status}` : "None"],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px_1fr] gap-3 border-b border-line py-2.5">
                <dt className="text-[13px] text-muted">{k}</dt>
                <dd className="m-0 text-sm font-normal">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="res-h" className="flex min-w-0 flex-[999_1_520px] flex-col gap-7">
          <div
            role="status"
            className="flex flex-wrap items-end gap-5 rounded-card border border-alert-border bg-alert-tint px-[26px] py-6"
          >
            <Dermi size={84} mood="concerned" />
            <div className="flex flex-[1_1_300px] flex-col gap-2">
              <span className="caps text-xs font-semibold tracking-[0.12em] text-alert-text">
                Worth pausing on
              </span>
              <h2
                id="res-h"
                className="display m-0 text-[28px] leading-[1.1] text-alert-deep sm:text-[34px]"
              >
                Two ingredients may clash with your skin right now.
              </h2>
              <p className="m-0 text-[15px] leading-relaxed text-alert-ink">
                This looks like the lotion you started before your forearm flared. I&apos;d keep it
                aside until the patch has fully healed.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2.5 border-b border-venice pb-2.5">
              <h3 className="caps m-0 text-[13px] tracking-[0.12em] text-venice">
                The label, marked up
              </h3>
              <div className="flex gap-4 text-[13px]">
                <span className="bg-highlight px-1.5" style={{ borderRadius: HIGHLIGHTER }}>
                  clash
                </span>
                <span className="underline decoration-venice decoration-wavy underline-offset-4">
                  watch
                </span>
              </div>
            </div>
            <p className="m-0 text-lg leading-loose">
              {p.ingredients.map(([name, level], i) => (
                <span key={name}>
                  <Ingredient name={name} level={level} rotate={level === "clash" ? clashIndex++ : 0} />
                  {i < p.ingredients.length - 1 ? ", " : "."}
                </span>
              ))}
            </p>
          </div>

          <div className="flex flex-col border-t border-venice">
            {p.flags.map((f) => (
              <article
                key={f.name}
                className="grid grid-cols-1 gap-2 border-b border-line py-5 sm:grid-cols-[200px_1fr] sm:gap-6"
              >
                <div className="flex flex-col gap-1.5">
                  <h4 className="display m-0 text-2xl leading-[1.15] tracking-normal break-words text-venice">
                    {f.name}
                  </h4>
                  <span
                    className={`caps text-[11px] font-semibold tracking-[0.12em] ${f.level === "clash" ? "text-alert-text" : "text-venice"}`}
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

          <div className="flex flex-wrap items-center gap-2.5">
            <Button>Add to my avoid list</Button>
            <LinkButton href="/consult" variant="secondary">
              Ask Dermi about it <Arrow />
            </LinkButton>
          </div>
          <p className="m-0 text-[13px] text-muted">
            Ingredient checks are a guide, not a patch test. If you&apos;re unsure, ask your
            dermatologist.
          </p>
        </section>
      </div>
    </>
  );
}

function Ingredient({ name, level, rotate }: { name: string; level: IngredientLevel; rotate: number }) {
  if (level === "clash") {
    return (
      <mark
        className="inline-block bg-highlight px-2 font-normal text-alert-deep"
        style={{
          borderRadius: HIGHLIGHTER,
          transform: `rotate(${rotate % 2 === 0 ? -1 : 0.8}deg)`,
        }}
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
