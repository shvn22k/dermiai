import type { Metadata } from "next";

import { RemindersView } from "@/components/reminders";
import { PageHeader } from "@/components/ui";
import { reminders } from "@/lib/demo";

export const metadata: Metadata = { title: "Reminders" };

export default function RemindersPage() {
  return (
    <>
      <PageHeader
        title="Reminders"
        aside={<span className="caps text-[13px] text-venice">Small, gentle nudges</span>}
      />
      <RemindersView initial={reminders} />
    </>
  );
}
