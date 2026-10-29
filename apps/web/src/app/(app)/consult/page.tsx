import type { Metadata } from "next";

import { ConsultationView } from "@/components/consultation";
import { CONSULT_MODES, type ConsultMode } from "@/lib/consult-modes";

export const metadata: Metadata = { title: "Consultation" };

type Props = { searchParams: Promise<{ state?: string; case?: string }> };

/** `?state=camera|analyzing|closing|redflag` previews each designed state. */
export default async function ConsultPage({ searchParams }: Props) {
  const { state } = await searchParams;
  const mode = CONSULT_MODES.find((m) => m === state) ?? ("default" satisfies ConsultMode);
  return <ConsultationView key={mode} initialMode={mode} />;
}
