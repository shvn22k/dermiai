import type { Metadata } from "next";

import { CaseList } from "@/components/cases";
import { cases } from "@/lib/demo";

export const metadata: Metadata = { title: "Cases" };

/** Not in the handoff (the design's "Cases" nav pointed at a case detail); reuses the dashboard grid. */
export default function CasesPage() {
  return <CaseList cases={cases} heading="Cases" headingLevel="h1" />;
}
