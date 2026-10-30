import type { Metadata } from "next";

import { Dermi } from "@/components/dermi";
import { Arrow, Avatar, Button, LinkButton, PageHeader } from "@/components/ui";
import { profile as demoProfile } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your Profile" };

const TONE_SWATCHES: Record<string, string> = {
  I: "#F6E3D4",
  II: "#EBCBB0",
  III: "#D4A585",
  IV: "#B57F5A",
  V: "#8A5A3B",
  VI: "#5A3A28",
};

export default async function ProfilePage() {
  let userEmail = "aanya@example.com";
  let currentProfile = demoProfile;
  let medications: string[] = [
    "Product: Gentle foaming cleanser (AM · PM)",
    "Product: Niacinamide 10% serum (AM)",
    "Product: SPF 50 sunscreen (AM)",
    "Medication: Cetirizine 10 mg (As needed)",
  ];
  let concerns: string[] = ["Rashes & itching", "Sensitivity"];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || "";
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (dbProfile) {
        const fullName = dbProfile.full_name || user.email?.split("@")[0] || "User";
        const firstName = dbProfile.first_name || fullName.split(" ")[0] || "User";
        currentProfile = {
          name: fullName,
          firstName,
          initials: (firstName[0] || "U").toUpperCase(),
          skinType: dbProfile.skin_type || "Normal",
          fitzpatrick: dbProfile.fitzpatrick_tone || "IV",
          allergies: dbProfile.allergies || [],
        };
        if (dbProfile.medications && dbProfile.medications.length > 0) {
          medications = dbProfile.medications;
        }
        if (dbProfile.concerns && dbProfile.concerns.length > 0) {
          concerns = dbProfile.concerns;
        }
      }
    }
  } catch {
    // Fall back to demo data if offline
  }

  const swatchColor = TONE_SWATCHES[currentProfile.fitzpatrick] ?? "#B57F5A";

  return (
    <>
      <PageHeader
        title="Your skin profile"
        eyebrow={<span className="caps text-xs text-venice">Personal Health Record</span>}
        aside={
          <div className="flex gap-3">
            <LinkButton href="/onboarding" variant="secondary">
              Update questionnaire <Arrow />
            </LinkButton>
            <form action="/auth/signout" method="POST">
              <Button type="submit" variant="ghost" className="text-muted hover:text-alert-text">
                Sign out
              </Button>
            </form>
          </div>
        }
      >
        <span className="text-sm text-muted">
          Dermi checks your photos, ingredient queries, and case logs against this profile.
        </span>
      </PageHeader>

      <div className="flex flex-wrap items-start gap-10">
        <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-8">
          {/* User Identity Card */}
          <section className="flex flex-wrap items-center gap-6 rounded-card border border-line bg-paper p-6 sm:p-8">
            <Avatar initials={currentProfile.initials} size={68} />
            <div className="flex flex-col gap-1">
              <span className="display text-2xl text-venice sm:text-3xl">{currentProfile.name}</span>
              <span className="text-sm text-muted">{userEmail}</span>
              <span className="caps text-[11px] text-venice mt-1">
                Fitzpatrick Tone {currentProfile.fitzpatrick} · {currentProfile.skinType} skin
              </span>
            </div>
          </section>

          {/* Skin Type & Tone */}
          <section className="flex flex-col gap-4 rounded-card border border-line bg-paper p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="display m-0 text-2xl text-venice">Skin Characteristics</h2>
              <span className="caps text-xs text-muted">Baseline</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="flex flex-col gap-2 rounded-btn bg-rock-tint/30 p-4">
                <span className="caps text-xs text-venice font-medium">Skin Type</span>
                <span className="text-lg font-normal text-ink capitalize">{currentProfile.skinType}</span>
                <span className="text-xs text-muted leading-relaxed">
                  Influences oiliness, barrier resilience, and sensitivity to active ingredients.
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-btn bg-rock-tint/30 p-4">
                <span className="caps text-xs text-venice font-medium">Fitzpatrick Tone</span>
                <div className="flex items-center gap-3">
                  <span
                    className="size-6 rounded-full border border-line shadow-inner"
                    style={{ backgroundColor: swatchColor }}
                    aria-hidden="true"
                  />
                  <span className="text-lg font-normal text-ink">Type {currentProfile.fitzpatrick}</span>
                </div>
                <span className="text-xs text-muted leading-relaxed">
                  Helps Dermi interpret erythema (redness) and post-inflammatory pigmentation fairly.
                </span>
              </div>
            </div>
          </section>

          {/* Known Allergies */}
          <section className="flex flex-col gap-4 rounded-card border border-line bg-paper p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="display m-0 text-2xl text-venice">Allergies &amp; Sensitivities</h2>
              <span className="caps text-xs text-alert-text">{currentProfile.allergies.length} Flagged</span>
            </div>

            <p className="m-0 text-sm leading-relaxed text-muted">
              Dermi cross-references cosmetic labels and lotions against these ingredients in the ingredient scanner.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {currentProfile.allergies.length > 0 ? (
                currentProfile.allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="caps inline-flex items-center gap-1.5 rounded-tag border border-alert-border bg-alert-tint/50 px-3 py-1.5 text-xs text-alert-text font-medium"
                  >
                    <span>⚠</span> {allergy}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted">No known allergies logged.</span>
              )}
            </div>
          </section>

          {/* Active Products & Medications */}
          <section className="flex flex-col gap-4 rounded-card border border-line bg-paper p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="display m-0 text-2xl text-venice">Current Products &amp; Meds</h2>
              <span className="caps text-xs text-muted">{medications.length} items</span>
            </div>

            <ul className="m-0 list-none p-0 flex flex-col gap-2.5">
              {medications.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-btn border border-line px-4 py-3 text-sm"
                >
                  <span className="font-light text-ink">{item}</span>
                  <span className="caps text-[11px] text-muted">Active</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar notes */}
        <aside className="flex flex-[1_1_320px] flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-card bg-rock p-6 sm:p-7">
            <Dermi size={90} body="#F5EEDD" />
            <h3 className="display m-0 text-2xl text-ink">Calm &amp; personalized</h3>
            <p className="m-0 text-sm leading-relaxed text-ink">
              Your profile helps Dermi remember your skin background during consultations so you never have to re-explain yourself.
            </p>
            <LinkButton href="/consult" variant="primary" size="md" className="mt-2">
              Start new consultation <Arrow />
            </LinkButton>
          </div>

          <div className="flex flex-col gap-3 rounded-card border border-line bg-paper p-6">
            <span className="caps text-xs text-venice">Primary Skin Concerns</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {concerns.map((c) => (
                <span
                  key={c}
                  className="caps inline-flex rounded-tag bg-rock-tint px-2.5 py-1 text-xs text-venice"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
