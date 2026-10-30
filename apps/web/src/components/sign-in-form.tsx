"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Arrow, Button, fieldLabelClass, underlineInputClass } from "@/components/ui";
import { demo, getState } from "@/demo/store";

/** Demo: no accounts. Signing in continues this browser's demo, or loads the sample patient. */
export function SignInForm() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div role="status" className="flex flex-col gap-3 border-t border-line pt-4">
        <p className="m-0 text-[15px] leading-relaxed">
          This is a demo, so there are no accounts and no email was sent. Pick how you&apos;d like to look
          around:
        </p>
        <Button
          onClick={() => {
            if (!getState().profile) demo.reset("sample");
            router.push("/dashboard");
          }}
        >
          Continue <Arrow />
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            demo.reset("sample");
            router.push("/dashboard");
          }}
        >
          Load the sample patient (Aanya)
        </Button>
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
        <a href="/onboarding" className="font-normal">
          Set up your skin profile
        </a>
      </p>
    </form>
  );
}
