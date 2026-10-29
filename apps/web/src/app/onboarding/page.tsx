import type { Metadata } from "next";

import { OnboardingView } from "@/components/onboarding";

export const metadata: Metadata = { title: "Your skin profile" };

type Props = { searchParams: Promise<{ step?: string }> };

/** `?step=1..5` opens a specific step. */
export default async function OnboardingPage({ searchParams }: Props) {
  const { step } = await searchParams;
  const n = Math.min(5, Math.max(1, Number(step) || 1));
  return <OnboardingView key={n} initialStep={n} />;
}
