import type { Metadata } from "next";

import { CaseList } from "@/components/cases";
import { Arrow, LinkButton } from "@/components/ui";
import { cases as demoCases } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cases" };

/** Cases list page displaying all cases for the current user */
export default async function CasesPage() {
  let userCases = demoCases;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: dbCases } = await supabase
        .from("cases")
        .select("*, case_images(id)")
        .order("updated_at", { ascending: false });

      if (dbCases) {
        userCases = dbCases.map((c) => ({
          id: c.id,
          name: c.title,
          area: c.body_site,
          photos: c.case_images ? c.case_images.length : 0,
          status: c.status,
          updated: new Date(c.updated_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          }),
          angle: c.placeholder_angle,
        }));
      }
    }
  } catch {
    // Fallback to demo cases if unauthenticated or offline
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-venice pb-3">
        <span className="caps text-xs text-venice">Your Records</span>
        <LinkButton href="/cases/new" size="sm">
          Start new case <Arrow>+</Arrow>
        </LinkButton>
      </div>
      <CaseList cases={userCases} heading="Cases" headingLevel="h1" />
    </div>
  );
}
