"use client";

import { RemindersView } from "@/components/reminders";
import { PageHeader } from "@/components/ui";
import { DemoGate } from "@/demo/gate";
import { startedCases } from "@/demo/store";

export default function RemindersPage() {
  return (
    <>
      <PageHeader
        title="Reminders"
        aside={<span className="caps text-[13px] text-venice">Small, gentle nudges</span>}
      />
      <DemoGate>{(s) => <RemindersView items={s.reminders} cases={startedCases(s)} />}</DemoGate>
    </>
  );
}
