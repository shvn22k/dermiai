"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CloseButton, Modal } from "@/components/modal";
import { Button, cx } from "@/components/ui";
import { SCENARIO_IDS, SCENARIOS } from "@/demo/scenarios";
import { demo } from "@/demo/store";
import { trace, useTrace } from "@/demo/trace";
import type { Scenario } from "@/demo/types";

const MOCKED: [string, string, string][] = [
  ["Web app, API routes, SSE streaming", "Real", "Same route → model client → SSE path as production"],
  ["Shared contracts", "Real", "Events are @dermiai/schemas types (VisionStreamEvent, DermiStreamEvent)"],
  ["CNN classifier", "Mock", "Canned result picked from the chat; real: ml/vision on Cloud Run"],
  ["Dermi", "Scripted", "Rule-based engine; real: fine-tuned LLM (CPT → SFT → DPO)"],
  ["Retrieval (RAG)", "Mock", "Keyword search over 10 demo notes; real: dermatology corpus index"],
  ["Accounts, cases, photos", "Browser", "localStorage; real: Supabase Auth, Postgres, Storage"],
  ["Ingredient label reading", "Mock", "Sample label text; matching against your profile is real"],
];

/** Demo banner + reset dialog + under-the-hood drawer. Mounted once in the root layout. */
export function DemoChrome() {
  const router = useRouter();
  const { open } = useTrace();
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-ink px-4 py-1.5 text-merino print:hidden">
        <span className="caps text-[10px] tracking-[0.12em] sm:text-[11px]">
          Demo · sample data, stored only in this browser · not medical advice
        </span>
        <span className="flex gap-1">
          <button
            type="button"
            onClick={() => trace.setOpen(!open)}
            aria-expanded={open}
            className="caps min-h-8 cursor-pointer rounded-tag px-2 text-[10px] text-merino hover:bg-merino/10 sm:text-[11px]"
          >
            Under the hood
          </button>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="caps min-h-8 cursor-pointer rounded-tag px-2 text-[10px] text-merino hover:bg-merino/10 sm:text-[11px]"
          >
            Reset demo
          </button>
        </span>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} labelledBy="reset-h" className="w-[min(560px,calc(100%-32px))]">
        <section className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between border-b border-venice pb-3">
            <h2 id="reset-h" className="display m-0 text-[28px] tracking-normal text-venice">
              Reset the demo
            </h2>
            <CloseButton onClick={() => setResetOpen(false)} />
          </div>
          <p className="m-0 text-[15px] leading-relaxed">
            This clears everything stored in this browser: profile, cases, photos and reminders.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                demo.reset("fresh");
                trace.clear();
                setResetOpen(false);
                router.push("/onboarding");
              }}
            >
              Start fresh, from onboarding
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                demo.reset("sample");
                trace.clear();
                setResetOpen(false);
                router.push("/dashboard");
              }}
            >
              Load the sample patient (Aanya)
            </Button>
          </div>
        </section>
      </Modal>

      {open && <UnderTheHood />}
    </>
  );
}

function UnderTheHood() {
  const { entries, override } = useTrace();
  const logEnd = useRef<HTMLLIElement>(null);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "end" });
  }, [entries.length]);

  return (
    <aside
      aria-label="Under the hood"
      className="fixed inset-y-0 right-0 z-40 flex w-[min(440px,100vw)] flex-col border-l border-venice bg-paper print:hidden"
    >
      <div className="flex items-center justify-between border-b border-venice px-5 py-3">
        <h2 className="display m-0 text-[26px] tracking-normal text-venice">Under the hood</h2>
        <CloseButton onClick={() => trace.setOpen(false)} label="Close panel" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 px-5 py-4">
        <details open className="flex flex-col gap-2">
          <summary className="caps cursor-pointer text-[11px] text-venice">
            What&apos;s real, what&apos;s mocked
          </summary>
          <dl className="m-0 flex flex-col border-t border-line text-[13px]">
            {MOCKED.map(([what, kind, how]) => (
              <div key={what} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-b border-line py-2">
                <dt className="font-normal">{what}</dt>
                <dd
                  className={cx(
                    "caps m-0 self-start rounded-tag px-1.5 py-0.5 text-[9.5px]",
                    kind === "Real" ? "bg-venice text-merino" : "bg-rock-tint text-ink",
                  )}
                >
                  {kind}
                </dd>
                <dd className="col-span-2 m-0 text-xs text-muted">{how}</dd>
              </div>
            ))}
          </dl>
        </details>

        <label className="caps flex flex-col gap-2 text-[11px] text-venice">
          Mock CNN result
          <select
            value={override ?? ""}
            onChange={(e) => trace.setOverride((e.target.value || null) as Scenario | null)}
            className="min-h-11 border-0 border-b-[1.5px] border-venice bg-transparent font-body text-sm font-light tracking-normal normal-case text-ink"
          >
            <option value="">Auto (from what you type)</option>
            {SCENARIO_IDS.map((id) => (
              <option key={id} value={id}>
                {SCENARIOS[id].cnn[0]!.condition}
              </option>
            ))}
          </select>
        </label>

        <section className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="caps m-0 text-[11px] text-venice">Live events ({entries.length})</h3>
            <button
              type="button"
              onClick={() => trace.clear()}
              className="caps min-h-8 cursor-pointer text-[10px] text-muted hover:text-venice"
            >
              Clear
            </button>
          </div>
          {entries.length === 0 ? (
            <p className="m-0 text-[13px] text-muted">
              Start a consultation or add a photo — every request and streamed event shows up here.
            </p>
          ) : (
            <ol className="m-0 flex min-h-0 flex-1 list-none flex-col gap-1 overflow-y-auto p-0">
              {entries.map((e) => (
                <li key={e.id}>
                  <details className="rounded-tag border border-line bg-merino/60 open:bg-merino">
                    <summary className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs">
                      <span className="text-muted tabular-nums">
                        {new Date(e.at).toLocaleTimeString("en-GB")}
                      </span>
                      <span className="font-normal">
                        {e.direction === "request" ? "POST" : "←"} {e.route.replace("/api/", "")}
                      </span>
                      <span
                        className={cx(
                          "caps ml-auto rounded-tag px-1.5 py-0.5 text-[9px]",
                          e.contract ? "bg-rock-tint text-ink" : "border border-stone text-muted",
                        )}
                      >
                        {e.label}
                        {e.count > 1 && ` ×${e.count}`}
                      </span>
                    </summary>
                    <pre className="m-0 max-h-72 overflow-auto border-t border-line px-2 py-1.5 text-[11px] leading-snug whitespace-pre-wrap break-words">
                      {pretty(e.json)}
                    </pre>
                  </details>
                </li>
              ))}
              <li ref={logEnd} aria-hidden="true" />
            </ol>
          )}
        </section>
      </div>
    </aside>
  );
}

function pretty(json: string) {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}
