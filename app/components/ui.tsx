import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Centered 640px column used by every screen. */
export function Page({ children, gap = "gap-8" }: { children: ReactNode; gap?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-4 pt-40 pb-16">
      <div className={`flex w-full max-w-[640px] flex-col items-start ${gap}`}>{children}</div>
    </main>
  );
}

/** Grey ⓘ icon that shows a dark tooltip on hover only. */
export function Info({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex shrink-0">
      <span
        tabIndex={0}
        aria-label={text}
        className="cursor-default text-[14px] leading-[1.5] font-semibold text-hint outline-none"
      >
        ⓘ
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute top-full left-[-11px] z-10 mt-2 w-[240px] rounded-[8px] bg-ink px-3 py-2 text-left text-[13px] leading-[1.5] font-normal whitespace-normal text-white group-hover:visible"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/tooltip-pointer.svg" alt="" width={8} height={4} className="absolute top-[-4px] left-[14px]" />
        {text}
      </span>
    </span>
  );
}

/** Field label with its ⓘ icon. */
export function Label({ children, info, className = "text-[13px] font-medium" }: { children: ReactNode; info: string; className?: string }) {
  return (
    <div className="flex items-center gap-[6px] leading-[1.5] whitespace-nowrap">
      <span className={`text-ink ${className}`}>{children}</span>
      <Info text={info} />
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const look =
    variant === "primary"
      ? "border-line bg-accent text-white"
      : "border-accent bg-white text-accent";
  return (
    <button
      type="button"
      className={`flex h-[46px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] border px-5 text-[14px] leading-[1.5] font-semibold whitespace-nowrap ${look} ${className}`}
      {...props}
    />
  );
}

/** Button with its ⓘ icon 8px to the right, vertically centered. */
export function ButtonWithInfo({ info, ...props }: ButtonProps & { info: string }) {
  return (
    <div className="flex items-center gap-2">
      <Button {...props} />
      <Info text={info} />
    </div>
  );
}

export const inputClass =
  "h-12 w-full min-w-0 rounded-[8px] border border-line bg-white px-[14px] text-[14px] leading-[1.5] text-ink placeholder:text-hint";
