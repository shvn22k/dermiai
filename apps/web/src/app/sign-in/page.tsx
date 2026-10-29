import type { Metadata } from "next";

import { Dermi } from "@/components/dermi";
import { Logo } from "@/components/nav";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

/** Not in the design handoff; built from its tokens and the empty-dashboard split card. */
export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-venice">
        <div className="mx-auto max-w-7xl px-[clamp(20px,4vw,48px)] py-4">
          <Logo size={36} />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <section
          aria-labelledby="signin-h"
          className="grid w-full max-w-[880px] grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] overflow-hidden rounded-card border border-line"
        >
          <div className="flex min-h-[240px] items-end justify-center bg-rock pt-8">
            <div className="mb-6">
              <Dermi size={180} body="#F5EEDD" className="size-[140px] sm:size-[180px]" />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-5 bg-paper p-8 sm:p-10">
            <span className="caps text-xs tracking-[0.12em] text-venice">Welcome back</span>
            <h1 id="signin-h" className="display m-0 text-[40px] leading-[1.05] text-venice">
              Sign in to DermiAI
            </h1>
            <p className="m-0 text-[15px] leading-relaxed">
              We&apos;ll email you a one-time link. No password to remember.
            </p>
            <SignInForm />
          </div>
        </section>
      </main>
    </div>
  );
}
