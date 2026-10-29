"use client";

import Link from "next/link";
import { useState } from "react";

import { Arrow, Button, fieldLabelClass, underlineInputClass } from "@/components/ui";

/** Magic-link form. Wire to supabase.auth.signInWithOtp (redirect: /auth/callback) when auth lands. */
export function SignInForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div role="status" className="flex flex-col gap-3 border-t border-line pt-4">
        <p className="m-0 text-[15px] leading-relaxed">
          Sign-in isn&apos;t connected yet, so no email was sent.
        </p>
        <Link href="/dashboard" className="caps inline-flex min-h-11 items-center gap-2 text-[13px] no-underline">
          Continue to the demo <Arrow />
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="flex flex-col gap-5"
    >
      <label htmlFor="email" className={fieldLabelClass}>
        Email
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={underlineInputClass}
        />
      </label>
      <Button type="submit" size="lg">
        Email me a sign-in link <Arrow />
      </Button>
      <p className="m-0 text-[13px] text-muted">
        New here?{" "}
        <Link href="/onboarding" className="font-normal">
          Set up your skin profile
        </Link>
      </p>
    </form>
  );
}
