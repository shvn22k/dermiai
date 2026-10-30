"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Arrow, Button, fieldLabelClass, underlineInputClass } from "@/components/ui";
import { hasPublicEnv } from "@/lib/env.public";
import { createClient } from "@/lib/supabase/client";

/** Magic-link form wired to supabase.auth.signInWithOtp with demo fallback. */
export function SignInForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!hasPublicEnv()) {
      setSubmitted(true);
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const isLive = hasPublicEnv();
    return (
      <div role="status" className="flex flex-col gap-3 border-t border-line pt-4">
        {isLive ? (
          <>
            <p className="m-0 text-[15px] leading-relaxed text-venice font-medium">
              Check your inbox! We sent a magic link to <span className="underline">{email}</span>.
            </p>
            <p className="m-0 text-[13px] text-muted">
              Click the link in the email to sign in immediately.
            </p>
          </>
        ) : (
          <>
            <p className="m-0 text-[15px] leading-relaxed">
              Supabase environment variables are not configured, so no email was sent.
            </p>
            <Link
              href="/dashboard"
              className="caps inline-flex min-h-11 items-center gap-2 text-[13px] no-underline"
            >
              Continue to the demo <Arrow />
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {errorMsg && (
        <div className="rounded-[4px] border border-alert-border bg-alert-soft px-3 py-2 text-[13px] text-alert-text">
          {errorMsg}
        </div>
      )}
      <label htmlFor="email" className={fieldLabelClass}>
        Email
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={underlineInputClass}
          disabled={loading}
        />
      </label>
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Sending link…" : "Email me a sign-in link"} <Arrow />
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
