"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ConsultationView } from "@/components/consultation";
import { DemoGate } from "@/demo/gate";
import { demo, newId } from "@/demo/store";

/** `/consult` starts a new consultation; `/consult?case=<id>` continues one. */
function Consult() {
  const router = useRouter();
  const caseParam = useSearchParams().get("case");
  const [draftId] = useState(newId);
  const id = caseParam ?? draftId;

  useEffect(() => {
    if (caseParam) return;
    demo.ensureDraft(draftId);
    router.replace(`/consult?case=${draftId}`);
  }, [caseParam, draftId, router]);

  return (
    <DemoGate>
      {(s) => {
        const c = s.cases.find((x) => x.id === id);
        if (!c) {
          return caseParam ? (
            <p className="text-base">That consultation isn&apos;t in this browser&apos;s demo data.</p>
          ) : (
            <div className="min-h-[60vh]" aria-busy="true" />
          );
        }
        return <ConsultationView key={c.id} c={c} profile={s.profile} />;
      }}
    </DemoGate>
  );
}

export default function ConsultPage() {
  return (
    <Suspense>
      <Consult />
    </Suspense>
  );
}
