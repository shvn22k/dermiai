"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
/** Minute-rounded so the snapshot is stable between renders. */
const getMinute = () => Math.floor(Date.now() / 60_000);
const getServerMinute = () => null;

/** Current time in the viewer's timezone. Null during SSR so the server never guesses it. */
function useNow(): Date | null {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  return minute === null ? null : new Date(minute * 60_000);
}

export function TodayLabel({ short = false }: { short?: boolean }) {
  const now = useNow();
  if (!now) return <span>&nbsp;</span>;
  return (
    <span>
      {now.toLocaleDateString("en-GB", {
        weekday: short ? "short" : "long",
        day: "numeric",
        month: short ? "short" : "long",
      })}
    </span>
  );
}

export function Greeting({ name }: { name: string }) {
  const h = useNow()?.getHours() ?? 9;
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return (
    <>
      Good {part}, {name}.
    </>
  );
}
