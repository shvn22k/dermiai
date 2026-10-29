"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { cx } from "@/components/ui";

/** Native <dialog> (focus trap, Esc, inert background). Backdrop click closes. */
export function Modal({
  open,
  onClose,
  labelledBy,
  label,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cx(
        "mx-auto mt-[72px] max-h-[calc(100dvh-96px)] w-[min(760px,calc(100%-32px))] max-w-none rounded-card border-0 bg-paper p-0 text-ink",
        className,
      )}
    >
      {open && children}
    </dialog>
  );
}

export function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="size-11 cursor-pointer text-[28px] font-light text-venice"
    >
      ×
    </button>
  );
}
