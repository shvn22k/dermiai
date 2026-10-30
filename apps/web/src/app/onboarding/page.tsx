"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { OnboardingView } from "@/components/onboarding";
import { DemoGate } from "@/demo/gate";

function Onboarding() {
  const step = Math.min(5, Math.max(1, Number(useSearchParams().get("step")) || 1));
  return (
    <DemoGate>
      {(s) => <OnboardingView key={step} initialStep={step} initial={s.profile} />}
    </DemoGate>
  );
}

/** `?step=1..5` opens a specific step. */
export default function OnboardingPage() {
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  );
}
