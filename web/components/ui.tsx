import { clsx } from "clsx";
import type { PropsWithChildren } from "react";

export function Container({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("rounded-2xl border border-slate-800 bg-slate-900/50 shadow-soft", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-4">
      <div>
        <div className="text-sm font-semibold tracking-wide text-slate-100">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-slate-400">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardBody({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("px-6 py-5", className)}>{children}</div>;
}

export function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1">
      <span className="text-xs text-slate-300">{label}</span>
      <span className="text-xs font-semibold text-slate-100">{value}</span>
    </div>
  );
}

export function Pill({ children }: PropsWithChildren) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/30 px-3 py-1 text-xs text-slate-200">
      {children}
    </span>
  );
}
