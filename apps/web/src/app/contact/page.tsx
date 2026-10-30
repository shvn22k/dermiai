"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Dermi } from "@/components/dermi";
import { Logo } from "@/components/nav";
import { Arrow, Button, fieldLabelClass, underlineInputClass } from "@/components/ui";

const wrap = "mx-auto max-w-4xl px-[clamp(20px,4vw,48px)]";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General feedback");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-merino text-ink">
      <header className="border-b border-venice bg-paper">
        <div className={`${wrap} flex items-center justify-between py-4`}>
          <Logo />
          <Link href="/" className="caps text-[13px] text-venice no-underline hover:text-ink">
            <Arrow>←</Arrow> Back to home
          </Link>
        </div>
      </header>

      <main className={`${wrap} flex-1 py-14 sm:py-20`}>
        <div className="flex flex-col gap-4 border-b border-venice pb-8">
          <span className="caps text-[13px] tracking-[0.12em] text-venice">We&apos;re here to help</span>
          <h1 className="display m-0 text-[42px] leading-[1.05] tracking-[-0.03em] text-venice sm:text-[56px]">
            Get in touch with the team.
          </h1>
          <p className="m-0 max-w-[620px] text-lg leading-relaxed text-muted">
            Have a suggestion for Dermi, an ingredient request, or a technical inquiry? We respond to every thoughtful note.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-12 pt-10">
          <section aria-labelledby="form-h" className="flex flex-col gap-6">
            <h2 id="form-h" className="display m-0 text-2xl text-venice">
              Send us a message
            </h2>

            {submitted ? (
              <div role="status" className="rounded-card border border-line bg-paper p-8 flex flex-col gap-4">
                <span className="caps text-xs text-venice">Thank you!</span>
                <p className="m-0 text-base leading-relaxed">
                  Your message has been received. Our team will review your note and get back to you at <strong>{email}</strong> shortly.
                </p>
                <Button variant="secondary" onClick={() => setSubmitted(false)} className="self-start">
                  Send another note
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-card border border-line bg-paper p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label htmlFor="name" className={fieldLabelClass}>
                    Your Name
                    <input
                      id="name"
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aanya Rao"
                      className={underlineInputClass}
                    />
                  </label>
                  <label htmlFor="email" className={fieldLabelClass}>
                    Email Address
                    <input
                      id="email"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={underlineInputClass}
                    />
                  </label>
                </div>

                <label htmlFor="subject" className={fieldLabelClass}>
                  Topic
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="min-h-[46px] w-full border-0 border-b-[1.5px] border-venice bg-transparent px-1 text-base font-light text-ink outline-none"
                  >
                    <option value="General feedback">General feedback &amp; impressions</option>
                    <option value="Clinical or safety concern">Clinical or safety concern</option>
                    <option value="Ingredient database suggestion">Ingredient database suggestion</option>
                    <option value="Bug or issue report">Bug or issue report</option>
                  </select>
                </label>

                <label htmlFor="message" className={fieldLabelClass}>
                  Message
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you experienced or how we can improve Dermi…"
                    className="w-full border-0 border-b-[1.5px] border-venice bg-transparent px-1 py-2 text-base font-light text-ink outline-none placeholder:text-muted/70"
                  />
                </label>

                <Button type="submit" size="lg" className="self-start">
                  Send message <Arrow />
                </Button>
              </form>
            )}
          </section>

          <aside className="flex flex-col gap-6">
            <div className="rounded-card border border-line bg-paper p-6 flex flex-col gap-4">
              <span className="caps text-xs text-venice">Direct Channels</span>
              <div className="flex flex-col gap-3 text-sm">
                <div>
                  <span className="font-medium text-ink block">Product &amp; Support</span>
                  <a href="mailto:support@dermiai.com" className="text-muted hover:text-venice">
                    support@dermiai.com
                  </a>
                </div>
                <div>
                  <span className="font-medium text-ink block">Clinical Review</span>
                  <a href="mailto:clinical@dermiai.com" className="text-muted hover:text-venice">
                    clinical@dermiai.com
                  </a>
                </div>
                <div>
                  <span className="font-medium text-ink block">Research &amp; Datasets</span>
                  <a href="mailto:research@dermiai.com" className="text-muted hover:text-venice">
                    research@dermiai.com
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-card bg-rock p-6 flex flex-col items-center text-center gap-3">
              <Dermi size={90} body="#F5EEDD" />
              <p className="m-0 text-sm leading-relaxed text-ink">
                DermiAI is an open academic and applied ML project designed for safe decision support.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-line py-8">
        <div className={`${wrap} caps flex flex-wrap items-center justify-between gap-4 text-xs text-muted`}>
          <span>© 2026 DermiAI</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="no-underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="no-underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
