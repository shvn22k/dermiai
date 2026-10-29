"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Dermi } from "@/components/dermi";
import { Arrow, Avatar, cx } from "@/components/ui";
import { profile } from "@/lib/demo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", short: "Home" },
  { href: "/cases", label: "Cases", short: "Cases", also: ["/consult"] },
  { href: "/reminders", label: "Reminders", short: "Remind" },
  { href: "/ingredients", label: "Ingredient check", short: "Check" },
  { href: "/onboarding", label: "Profile", short: "You" },
] as const;

function useActive() {
  const pathname = usePathname();
  return (item: (typeof NAV)[number]) =>
    [item.href, ...("also" in item ? item.also : [])].some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-venice no-underline">
      <Dermi size={size} />
      <span className="display" style={{ fontSize: size * 0.7 }}>
        DermiAI
      </span>
    </Link>
  );
}

/** Desktop navigation (design/screens/Sidebar.dc.html). */
export function Sidebar() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Main"
      className="sticky top-0 flex h-dvh flex-col gap-9 overflow-y-auto px-5 pt-7 pb-6"
    >
      <Logo size={38} />
      <div className="flex flex-col gap-0.5 border-t border-line pt-3.5">
        {NAV.map((item, i) => {
          const on = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={cx(
                "flex min-h-11 items-center gap-2.5 rounded-[6px] px-2.5 text-[15px] no-underline",
                on
                  ? "bg-rock-tint font-medium text-venice"
                  : "font-light text-ink hover:bg-rock-tint/40",
              )}
            >
              <span className={cx("caps w-5 text-[11px]", on ? "text-venice" : "text-muted")}>
                0{i + 1}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
      <Link
        href="/consult"
        className="caps flex min-h-12 items-center justify-between rounded-btn bg-venice px-4 text-[13px] text-merino no-underline hover:bg-ink hover:text-merino"
      >
        New consultation <Arrow>+</Arrow>
      </Link>
      <div className="mt-auto flex flex-col gap-[18px]">
        <p className="m-0 border-t border-line pt-3.5 text-[13px] leading-relaxed text-muted">
          Dermi supports, not replaces, a dermatologist.
        </p>
        <Link href="/onboarding" className="flex min-h-11 items-center gap-3 text-ink no-underline">
          <Avatar initials={profile.initials} size={40} />
          <span className="flex flex-col gap-px">
            <span className="text-sm font-normal">{profile.name}</span>
            <span className="text-xs text-muted">
              {profile.skinType} · Type {profile.fitzpatrick}
            </span>
          </span>
        </Link>
      </div>
    </nav>
  );
}

/** Mobile bottom navigation (design/screens/DashboardMobile.dc.html). */
export function TabBar() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-venice bg-paper px-1.5 pt-1.5 pb-[max(env(safe-area-inset-bottom),14px)]"
    >
      {NAV.map((item, i) => {
        const on = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cx(
              "caps flex min-h-[52px] flex-col items-center justify-center gap-1.5 text-[10px] tracking-[0.08em] no-underline",
              on ? "text-venice" : "text-muted",
            )}
          >
            <span className="display text-lg tracking-normal">0{i + 1}</span>
            <span
              className={cx("border-b-2 pb-[3px]", on ? "border-venice" : "border-transparent")}
            >
              {item.short}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
