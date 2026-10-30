"use client";

import { CaseList } from "@/components/cases";
import { Arrow, LinkButton } from "@/components/ui";
import { toSummary } from "@/demo/adapters";
import { DemoGate } from "@/demo/gate";
import { startedCases } from "@/demo/store";

export default function CasesPage() {
  return (
    <DemoGate>
      {(s) => {
        const cases = startedCases(s);
        return cases.length > 0 ? (
          <CaseList cases={cases.map(toSummary)} heading="Cases" headingLevel="h1" />
        ) : (
          <div className="flex flex-col items-start gap-5">
            <h1 className="display m-0 border-b border-venice pb-5 text-[52px] text-venice">Cases</h1>
            <p className="m-0 text-base">No cases yet. Each consultation becomes a case you can track.</p>
            <LinkButton href="/consult">
              Start a consultation <Arrow>+</Arrow>
            </LinkButton>
          </div>
        );
      }}
    </DemoGate>
  );
}
