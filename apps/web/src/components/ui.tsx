import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

import type { CaseStatus } from "@/lib/demo";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "alert" | "alert-outline" | "ghost" | "on-rock";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-venice text-merino hover:text-merino hover:bg-ink",
  secondary: "border border-venice text-venice hover:bg-rock-tint/50 hover:text-venice",
  alert: "bg-alert text-alert-on hover:text-alert-on hover:bg-alert-text",
  "alert-outline": "border border-alert-text text-alert-text hover:text-alert-text hover:bg-alert-tint",
  ghost: "text-venice hover:text-ink",
  "on-rock": "border border-ink text-ink hover:text-ink hover:bg-rock-tint/40",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-11 px-4 text-xs",
  md: "min-h-12 px-5 text-[13px]",
  lg: "min-h-[54px] px-6 text-sm",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cx(
    "caps inline-flex cursor-pointer items-center justify-center gap-3.5 rounded-btn no-underline transition-colors",
    "disabled:cursor-default disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant, size, className, ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/** Words + arrows instead of icon sets (design rule). */
export function Arrow({ children = "→" }: { children?: ReactNode }) {
  return (
    <span aria-hidden="true" className="text-lg tracking-normal">
      {children}
    </span>
  );
}

/* ---------- Chips ---------- */

const STATUS_CHIP: Record<CaseStatus, string> = {
  open: "bg-rock-tint text-ink",
  healing: "bg-venice text-merino",
  resolved: "border border-stone text-muted",
  "see-dermatologist": "bg-alert-tint text-alert-text",
};

export const STATUS_LABEL: Record<CaseStatus, string> = {
  open: "Open",
  healing: "Healing",
  resolved: "Resolved",
  "see-dermatologist": "See a dermatologist",
};

export function StatusChip({
  status,
  label,
  size = "md",
  className,
}: {
  status: CaseStatus;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "caps shrink-0 rounded-tag",
        size === "sm" ? "px-2 py-1 text-[10px]" : "px-2.5 py-[5px] text-[11px]",
        STATUS_CHIP[status],
        className,
      )}
    >
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}

/** Selectable pill (onboarding allergies, reminder type/repeat). */
export function ToggleChip({
  selected,
  className,
  ...rest
}: ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "min-h-11 cursor-pointer rounded-[6px] px-4 text-[15px]",
        selected
          ? "border-[1.5px] border-venice bg-venice font-normal text-merino"
          : "m-[0.5px] border border-line-strong font-light text-ink hover:border-venice",
        className,
      )}
      {...rest}
    />
  );
}

/** Selectable card (onboarding skin type, tone, concerns). */
export function OptionCard({
  selected,
  className,
  ...rest
}: ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "flex cursor-pointer flex-col gap-2 rounded-btn text-left text-ink",
        selected
          ? "border-[1.5px] border-venice bg-rock-tint"
          : "m-[0.5px] border border-line bg-paper hover:border-venice",
        className,
      )}
      {...rest}
    />
  );
}

/* ---------- Form controls ---------- */

export const fieldLabelClass = "caps flex flex-col gap-2 text-xs text-venice";
export const underlineInputClass =
  "min-h-[46px] border-0 border-b-[1.5px] border-venice bg-transparent px-0.5 font-body text-base font-light tracking-normal normal-case text-ink outline-none placeholder:text-muted/70 focus-visible:outline-offset-4";

/** Pill switch. Uses role=switch so screen readers announce on/off. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "flex h-[30px] w-[52px] shrink-0 cursor-pointer items-center rounded-full border-[1.5px] border-venice p-[3px]",
        checked ? "justify-end bg-venice" : "justify-start bg-transparent",
      )}
    >
      <span className={cx("size-[22px] rounded-full", checked ? "bg-merino" : "bg-venice")} />
    </button>
  );
}

/* ---------- Pictures & marks ---------- */

/** Hatched photo placeholder. Swapped for signed Supabase image URLs once uploads are wired. */
export function Hatch({
  angle = -45,
  step = 7,
  className,
  style,
  children,
}: {
  angle?: number;
  step?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <span
      aria-hidden={children ? undefined : true}
      className={cx("block", className)}
      style={{
        background: `repeating-linear-gradient(${angle}deg, var(--color-hatch-line) 0 1px, var(--color-hatch-bg) 1px ${step}px)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Avatar({ initials, size = 38 }: { initials: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-rock font-label font-semibold text-ink"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {initials}
    </span>
  );
}

/** The hand-drawn tick from the design source. */
export function HandTick({ color = "currentColor", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5c1.6 1.4 2.8 2.7 4 4.3 2.8-4.4 5.6-7.6 9.5-10.6" />
    </svg>
  );
}

/** Wobbly face for the 1-10 discomfort scale; the mouth flattens then frowns as n rises. */
export function PainFace({ n, size = 28 }: { n: number; size?: number }) {
  const curve = 15.5 + (3 - (n - 1) * 0.67);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.2 3.3c4.7-.1 8.6 3.7 8.5 8.6.1 4.8-3.8 8.5-8.7 8.4-4.7.2-8.4-3.8-8.3-8.6C3.6 7 7.4 3.2 12.2 3.3z" />
      <path d="M9 10.2h.01M15.2 9.9h.01" strokeWidth="2.4" />
      <path d={`M8.2 15.6 Q12 ${curve.toFixed(1)} 15.9 15.3`} />
    </svg>
  );
}

/* ---------- Layout bits ---------- */

/** Page title row: big Ortica heading over a Venice rule. */
export function PageHeader({
  title,
  eyebrow,
  badge,
  aside,
  children,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  /** Sits beside the title (status chip). */
  badge?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-venice pb-5">
      <div className="flex flex-col gap-2.5">
        {eyebrow}
        <div className="flex flex-wrap items-center gap-3.5">
          <h1 className="display m-0 text-[40px] leading-none tracking-[-0.03em] text-venice sm:text-[52px]">
            {title}
          </h1>
          {badge}
        </div>
        {children}
      </div>
      {aside}
    </header>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="caps flex items-center gap-2 text-xs text-muted">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden="true">/</span>}
          {item.href ? (
            <Link href={item.href} className="no-underline">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Small Fustat section label (h2/h3 or plain span). */
export function Eyebrow({
  as: Tag = "span",
  className,
  children,
  id,
}: {
  as?: "span" | "h2" | "h3";
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <Tag id={id} className={cx("caps m-0 text-xs text-venice", className)}>
      {children}
    </Tag>
  );
}
