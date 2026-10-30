"use client";

import type { ReactNode } from "react";

import { useDemo } from "@/demo/store";
import type { DemoState } from "@/demo/types";

/** Renders children once the browser store is loaded (it is null during SSR/hydration). */
export function DemoGate({ children }: { children: (state: DemoState) => ReactNode }) {
  const state = useDemo();
  if (!state) return <div className="min-h-[60vh]" aria-busy="true" />;
  return <>{children(state)}</>;
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0]![0]! + (parts.length > 1 ? parts.at(-1)![0]! : "")).toUpperCase();
}

export function firstNameOf(name: string | undefined) {
  return name?.trim().split(/\s+/)[0] || "there";
}
