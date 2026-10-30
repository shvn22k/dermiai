"use client";

import { CaseList } from "@/components/cases";
import { Dermi } from "@/components/dermi";
import { Greeting, TodayLabel } from "@/components/greeting";
import { TodayReminders } from "@/components/today";
import { Arrow, Avatar, LinkButton } from "@/components/ui";
import { toReminder, toSummary } from "@/demo/adapters";
import { DemoGate, firstNameOf, initialsOf } from "@/demo/gate";
import { demo, startedCases, todayKey, todaysReminders } from "@/demo/store";
import type { DemoCase, DemoState } from "@/demo/types";

/** Dashboard (design/screens/Dashboard, DashboardEmpty, DashboardMobile), from browser demo state. */
export default function DashboardPage() {
  return <DemoGate>{(s) => <Dashboard s={s} />}</DemoGate>;
}

function Dashboard({ s }: { s: DemoState }) {
  const cases = startedCases(s);
  const today = todaysReminders(s);
  const name = firstNameOf(s.profile?.name);
  if (cases.length === 0) return <EmptyDashboard s={s} name={name} />;

  return (
    <>
      <div className="flex items-start justify-between gap-3 sm:hidden">
        <span className="caps text-[11px] tracking-[0.12em] text-venice">
          <TodayLabel short />
        </span>
        <Avatar initials={initialsOf(s.profile?.name ?? "")} size={44} />
      </div>

      <section className="flex flex-wrap items-end gap-4 overflow-hidden rounded-card bg-rock px-[18px] pt-[18px] sm:gap-8 sm:px-[clamp(24px,3vw,40px)] sm:pt-8">
        <div className="-mb-1.5 hidden sm:block">
          <Dermi size={150} body="#F5EEDD" mood={heroMood(cases)} />
        </div>
        <div className="flex flex-[1_1_340px] flex-col gap-3 sm:pb-8">
          <span className="caps hidden text-[13px] tracking-[0.12em] text-ink sm:block">
            <TodayLabel />
          </span>
          <h1 className="display m-0 text-[36px] leading-[1.02] tracking-[-0.03em] text-ink sm:text-[52px]">
            <Greeting name={name} />
          </h1>
          <div className="flex items-end gap-3">
            <Dermi size={72} body="#F5EEDD" mood={heroMood(cases)} className="sm:hidden" />
            <p className="m-0 max-w-[540px] text-[15px] leading-relaxed text-ink sm:text-[17px]">
              {heroMessage(cases)}
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
          <CaseList cases={cases.map(toSummary)} heading="Your cases" />
        </div>
        <aside className="flex-[1_1_320px] max-lg:order-first">
          {today.length > 0 ? (
            <TodayReminders
              items={today.map(toReminder)}
              doneIds={s.ticks[todayKey()] ?? []}
              onToggle={demo.toggleTick}
            />
          ) : (
            <NoReminders />
          )}
        </aside>
      </div>
    </>
  );
}

function heroMood(cases: DemoCase[]) {
  return cases.some((c) => c.status === "see-dermatologist") ? "concerned" : "happy";
}

/** "left forearm" when we know where it is, otherwise the case name ("itchy patch"). */
function where(c: DemoCase) {
  return c.area || c.title.split(",")[0]!.toLowerCase();
}

function heroMessage(cases: DemoCase[]) {
  const urgent = cases.find((c) => c.status === "see-dermatologist");
  if (urgent) {
    return `Please don't forget: I'd like a dermatologist to see your ${where(urgent)} soon. Your case report is ready to take with you.`;
  }
  const healing = cases.find((c) => c.status === "healing" && c.pains.length > 1);
  if (healing) {
    const first = healing.pains[0]!.value;
    const last = healing.pains.at(-1)!.value;
    if (last < first) {
      return `Your ${where(healing)} is calming down — discomfort went from ${first} to ${last}. Keep going, and I'll check in again tonight.`;
    }
  }
  const open = cases.find((c) => c.status === "open" || c.status === "healing");
  if (open) {
    return `How's your ${where(open)} today? Open the case to log a check-in, or carry on where we left off.`;
  }
  return "Everything's resolved. If something new comes up, I'm here.";
}

function NoReminders() {
  return (
    <section className="flex flex-col gap-4">
      <div className="border-b border-venice pb-3">
        <h2 className="display m-0 text-[30px] text-venice">Today</h2>
      </div>
      <p className="m-0 text-[15px] leading-relaxed">
        No reminders today. A simple morning and night routine is a lovely place to start.
      </p>
      <LinkButton href="/reminders" variant="secondary" className="self-start">
        Add a reminder
      </LinkButton>
    </section>
  );
}

function EmptyDashboard({ s, name }: { s: DemoState; name: string }) {
  const hasProfile = s.profile !== null;
  return (
    <>
      <div className="flex flex-col gap-2 border-b border-venice pb-5">
        <span className="caps text-[13px] tracking-[0.12em] text-venice">
          <TodayLabel />
        </span>
        <h1 className="display m-0 text-[40px] tracking-[-0.03em] text-venice sm:text-[52px]">
          Welcome{hasProfile ? `, ${name}` : ""}.
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
              {hasProfile
                ? "When something's bothering your skin, start a consultation. I'll ask a few gentle questions and keep everything together in one case."
                : "Start with your skin profile — it takes about two minutes and helps me give you better answers."}
            </p>
            <LinkButton
              href={hasProfile ? "/consult" : "/onboarding"}
              size="lg"
              className="self-start text-[13px]"
            >
              {hasProfile ? "Start your first consultation" : "Set up your skin profile"}{" "}
              <Arrow>{hasProfile ? "+" : "→"}</Arrow>
            </LinkButton>
          </div>
        </section>

        <aside className="flex-[1_1_320px]">
          {todaysReminders(s).length > 0 ? (
            <TodayReminders
              items={todaysReminders(s).map(toReminder)}
              doneIds={s.ticks[todayKey()] ?? []}
              onToggle={demo.toggleTick}
            />
          ) : (
            <NoReminders />
          )}
        </aside>
      </div>
    </>
  );
}
