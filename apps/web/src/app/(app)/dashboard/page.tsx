import type { Metadata } from "next";

import { CaseList } from "@/components/cases";
import { Dermi } from "@/components/dermi";
import { Greeting, TodayLabel } from "@/components/greeting";
import { TodayReminders } from "@/components/today";
import { Arrow, Avatar, LinkButton } from "@/components/ui";
import { cases, profile, reminders, todayReminderIds } from "@/lib/demo";

export const metadata: Metadata = { title: "Dashboard" };

type Props = { searchParams: Promise<{ preview?: string }> };

/** Dashboard (design/screens/Dashboard, DashboardEmpty, DashboardMobile). `?preview=empty` shows the empty state. */
export default async function DashboardPage({ searchParams }: Props) {
  const { preview } = await searchParams;
  const myCases = preview === "empty" ? [] : cases;
  const today = preview === "empty" ? [] : reminders.filter((r) => todayReminderIds.includes(r.id));

  return myCases.length === 0 ? <EmptyDashboard /> : <FullDashboard today={today} />;
}

function FullDashboard({ today }: { today: typeof reminders }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 sm:hidden">
        <span className="caps text-[11px] tracking-[0.12em] text-venice">
          <TodayLabel short />
        </span>
        <Avatar initials={profile.initials} size={44} />
      </div>

      <section className="flex flex-wrap items-end gap-4 overflow-hidden rounded-card bg-rock px-[18px] pt-[18px] sm:gap-8 sm:px-[clamp(24px,3vw,40px)] sm:pt-8">
        <div className="-mb-1.5 hidden sm:block">
          <Dermi size={150} body="#F5EEDD" />
        </div>
        <div className="flex flex-[1_1_340px] flex-col gap-3 sm:pb-8">
          <span className="caps hidden text-[13px] tracking-[0.12em] text-ink sm:block">
            <TodayLabel />
          </span>
          <h1 className="display m-0 text-[36px] leading-[1.02] tracking-[-0.03em] text-ink sm:text-[52px]">
            <Greeting name={profile.firstName} />
          </h1>
          <div className="flex items-end gap-3">
            <Dermi size={72} body="#F5EEDD" className="sm:hidden" />
            <p className="m-0 max-w-[540px] text-[15px] leading-relaxed text-ink sm:text-[17px]">
              Your forearm patch looked calmer in yesterday&apos;s photo. Keep the new lotion aside,
              and I&apos;ll check in again tonight.
            </p>
          </div>
        </div>
        <div className="w-full pb-[18px] sm:w-auto sm:pb-8">
          <LinkButton href="/consult" size="lg" className="w-full justify-between sm:w-auto">
            Start new consultation <Arrow>+</Arrow>
          </LinkButton>
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-10">
        <div className="min-w-0 flex-[999_1_520px]">
          <CaseList cases={cases} heading="Your cases" />
        </div>
        <aside className="flex-[1_1_320px] max-lg:order-first">
          <TodayReminders items={today} initialDone={["m1"]} />
        </aside>
      </div>
    </>
  );
}

function EmptyDashboard() {
  return (
    <>
      <div className="flex flex-col gap-2 border-b border-venice pb-5">
        <span className="caps text-[13px] tracking-[0.12em] text-venice">
          <TodayLabel />
        </span>
        <h1 className="display m-0 text-[40px] tracking-[-0.03em] text-venice sm:text-[52px]">
          Welcome, {profile.firstName}.
        </h1>
      </div>

      <div className="flex flex-wrap items-start gap-10">
        <section
          aria-labelledby="empty-h"
          className="grid min-w-0 flex-[999_1_520px] grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] overflow-hidden rounded-card border border-line"
        >
          <div className="flex min-h-[300px] items-end justify-center bg-rock pt-10 sm:min-h-[380px]">
            <div className="mb-7">
              <Dermi size={220} body="#F5EEDD" className="size-[180px] sm:size-[220px]" />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-5 bg-paper p-8 sm:p-10">
            <span className="caps text-xs tracking-[0.12em] text-venice">No cases yet</span>
            <h2
              id="empty-h"
              className="display m-0 text-[32px] leading-[1.08] text-venice sm:text-[40px]"
            >
              Nothing to look at — and that&apos;s a good thing.
            </h2>
            <p className="m-0 text-base leading-[1.65]">
              When something&apos;s bothering your skin, start a consultation. I&apos;ll ask a few
              gentle questions and keep everything together in one case.
            </p>
            <LinkButton href="/consult" size="lg" className="self-start text-[13px]">
              Start your first consultation <Arrow>+</Arrow>
            </LinkButton>
          </div>
        </section>

        <aside aria-labelledby="rem-empty-h" className="flex flex-[1_1_320px] flex-col gap-4">
          <div className="border-b border-venice pb-3">
            <h2 id="rem-empty-h" className="display m-0 text-[30px] text-venice">
              Today
            </h2>
          </div>
          <p className="m-0 text-[15px] leading-relaxed">
            No reminders yet. A simple morning and night routine is a lovely place to start.
          </p>
          <LinkButton href="/reminders" variant="secondary" className="self-start">
            Add a reminder
          </LinkButton>
        </aside>
      </div>
    </>
  );
}
