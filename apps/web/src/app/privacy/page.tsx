import type { Metadata } from "next";
import Link from "next/link";

import { Dermi } from "@/components/dermi";
import { Logo } from "@/components/nav";
import { Arrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DermiAI handles your skin photos, consultations, and health data.",
};

const wrap = "mx-auto max-w-4xl px-[clamp(20px,4vw,48px)]";

export default function PrivacyPage() {
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
          <span className="caps text-[13px] tracking-[0.12em] text-venice">Data &amp; Privacy</span>
          <h1 className="display m-0 text-[42px] leading-[1.05] tracking-[-0.03em] text-venice sm:text-[56px]">
            Your skin data belongs entirely to you.
          </h1>
          <p className="m-0 max-w-[620px] text-lg leading-relaxed text-muted">
            DermiAI handles personal skin photographs and health conversations. We believe medical privacy must be the default, not an afterthought.
          </p>
        </div>

        <div className="flex flex-col gap-12 pt-10">
          <section className="flex flex-col gap-3">
            <span className="display text-2xl text-venice">01. Private, Scoped Photo Storage</span>
            <p className="m-0 text-base leading-relaxed">
              When you photograph a skin lesion or rash, the picture uploads straight from your browser into a private encrypted storage bucket. It never touches third-party public hosting. Row Level Security (RLS) ensures that only your authenticated account can ever read or delete the image.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <span className="display text-2xl text-venice">02. No Training on User Photos</span>
            <p className="m-0 text-base leading-relaxed">
              We never use your uploaded skin photos or consultation chats to train our neural network or LLM models without your explicit, separate opt-in consent. The models evaluate your photos on-the-fly and keep no copies in cache once your consultation response completes.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <span className="display text-2xl text-venice">03. Ephemeral AI Inference</span>
            <p className="m-0 text-base leading-relaxed">
              When running vision classification, DermiAI generates a 60-second single-use download token solely for the classifier to assess image features. Once inference is complete, the token expires immediately.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <span className="display text-2xl text-venice">04. Complete Data Erasure</span>
            <p className="m-0 text-base leading-relaxed">
              When you delete a case in DermiAI, all associated photo files, CNN probability outputs, timeline milestones, and chat messages are permanently deleted from both PostgreSQL and Supabase Storage.
            </p>
          </section>

          <section className="rounded-card border border-line bg-paper p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <Dermi size={90} mood="happy" />
            <div className="flex flex-col gap-2">
              <span className="caps text-xs text-venice">Questions or data requests?</span>
              <p className="m-0 text-sm leading-relaxed">
                If you have questions about your stored health records or wish to request an account export, reach out to our team at{" "}
                <a href="mailto:privacy@dermiai.com" className="font-normal underline">
                  privacy@dermiai.com
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-line py-8">
        <div className={`${wrap} caps flex flex-wrap items-center justify-between gap-4 text-xs text-muted`}>
          <span>© 2026 DermiAI</span>
          <div className="flex gap-4">
            <Link href="/terms" className="no-underline">
              Terms of Service
            </Link>
            <Link href="/contact" className="no-underline">
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
