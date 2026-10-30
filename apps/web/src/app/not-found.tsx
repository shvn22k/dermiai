import { Dermi } from "@/components/dermi";
import { Arrow, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-merino px-5 py-16 text-center">
      <div className="flex max-w-[560px] flex-col items-center gap-6 rounded-card border border-line bg-paper p-8 sm:p-12">
        <Dermi size={140} mood="concerned" body="#84B3CE" />
        <span className="caps text-xs text-venice">Error 404</span>
        <h1 className="display m-0 text-4xl text-venice sm:text-5xl">Page not found</h1>
        <p className="m-0 text-base leading-relaxed text-muted">
          Dermi couldn&apos;t find the page you were looking for. The link may have changed, or the case may have been archived.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <LinkButton href="/dashboard" size="lg">
            Go to Dashboard <Arrow />
          </LinkButton>
          <LinkButton href="/" variant="secondary" size="lg">
            Back to Home
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
