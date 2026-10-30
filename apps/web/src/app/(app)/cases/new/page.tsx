"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Dermi } from "@/components/dermi";
import {
  Arrow,
  Breadcrumb,
  Button,
  fieldLabelClass,
  LinkButton,
  PageHeader,
  PainFace,
  underlineInputClass,
} from "@/components/ui";

const BODY_AREAS = [
  "Face (forehead, cheeks, chin)",
  "Jawline & neck",
  "Left arm / forearm",
  "Right arm / forearm",
  "Chest & torso",
  "Back / shoulders",
  "Elbows / knees",
  "Legs / feet",
  "Hands & wrists",
  "Other / general",
];

export default function NewCasePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [bodySite, setBodySite] = useState(BODY_AREAS[0]!);
  const [customSite, setCustomSite] = useState("");
  const [painLevel, setPainLevel] = useState(3);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const site = bodySite === "Other / general" && customSite.trim() ? customSite.trim() : bodySite;

    if (!title.trim()) {
      setErrorMsg("Please give your concern a title");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body_site: site,
          status: "open",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to create case (${res.status})`);
      }

      const newCase = await res.json();
      router.push(`/consult?case=${newCase.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create case");
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Start a new case"
        eyebrow={<Breadcrumb items={[{ label: "Cases", href: "/cases" }, { label: "New case" }]} />}
        aside={
          <LinkButton href="/cases" variant="secondary">
            Cancel
          </LinkButton>
        }
      >
        <span className="text-sm text-muted">
          Tell Dermi what you&apos;re noticing. Each case keeps your photos, notes, and pain tracking organized together.
        </span>
      </PageHeader>

      <div className="flex flex-wrap items-start gap-10">
        <form
          onSubmit={handleSubmit}
          className="flex min-w-0 flex-[999_1_500px] flex-col gap-8 rounded-card border border-line bg-paper p-6 sm:p-10"
        >
          {errorMsg && (
            <div className="rounded-[4px] border border-alert-border bg-alert-soft px-4 py-3 text-sm text-alert-text">
              {errorMsg}
            </div>
          )}

          <label htmlFor="case-title" className={fieldLabelClass}>
            What are you noticing?
            <input
              id="case-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Itchy red patch, Dry flakey spot, Flare-up"
              className={underlineInputClass}
              disabled={loading}
            />
          </label>

          <label htmlFor="body-site" className={fieldLabelClass}>
            Where is it on your body?
            <select
              id="body-site"
              value={bodySite}
              onChange={(e) => setBodySite(e.target.value)}
              className="min-h-[46px] w-full border-0 border-b-[1.5px] border-venice bg-transparent px-1 text-base font-light text-ink outline-none"
              disabled={loading}
            >
              {BODY_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          {bodySite === "Other / general" && (
            <label htmlFor="custom-site" className={fieldLabelClass}>
              Specific location
              <input
                id="custom-site"
                type="text"
                value={customSite}
                onChange={(e) => setCustomSite(e.target.value)}
                placeholder="e.g. Left collarbone"
                className={underlineInputClass}
                disabled={loading}
              />
            </label>
          )}

          <div className="flex flex-col gap-3 border-t border-line pt-6">
            <div className="flex items-center justify-between">
              <span className={fieldLabelClass}>Current discomfort or itch level</span>
              <div className="flex items-center gap-2 text-venice">
                <PainFace n={painLevel} size={24} />
                <span className="display text-xl">{painLevel} / 10</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={painLevel}
              onChange={(e) => setPainLevel(Number(e.target.value))}
              className="accent-venice h-2 w-full cursor-pointer rounded-lg bg-rock-tint"
              disabled={loading}
            />
            <span className="text-xs text-muted">
              {painLevel <= 3
                ? "Mild — noticeable but easy to ignore"
                : painLevel <= 6
                  ? "Moderate — noticeably uncomfortable or itchy"
                  : painLevel <= 8
                    ? "Severe — hard to focus on other things"
                    : "Very severe — overwhelming or painful"}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-venice pt-6">
            <LinkButton href="/cases" variant="ghost">
              Back
            </LinkButton>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Starting case…" : "Continue to consultation"} <Arrow />
            </Button>
          </div>
        </form>

        <aside className="flex flex-[1_1_300px] flex-col gap-6">
          <div className="rounded-card bg-rock p-6 sm:p-8 flex flex-col items-center text-center gap-4">
            <Dermi size={120} body="#F5EEDD" />
            <h3 className="display m-0 text-2xl text-ink">We&apos;ll take it one step at a time</h3>
            <p className="m-0 text-sm leading-relaxed text-ink">
              Once your case is started, you can photograph the area in good light and chat through when it began.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
