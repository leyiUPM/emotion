"use client";

import { clsx } from "clsx";

export type TabKey = "analyze" | "dashboard" | "explore";

export function Tabs({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
}) {
  const tabs: Array<{ key: TabKey; label: string; desc: string }> = [
    { key: "analyze", label: "Analyze", desc: "Run emotion detection" },
    { key: "dashboard", label: "Dashboard", desc: "Charts and summaries" },
    { key: "explore", label: "Explore", desc: "Search and filter feedback" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            "rounded-2xl border px-4 py-3 text-left transition",
            value === t.key
              ? "border-slate-600 bg-slate-900/80"
              : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
          )}
        >
          <div className="text-sm font-semibold text-slate-100">{t.label}</div>
          <div className="mt-1 text-xs text-slate-400">{t.desc}</div>
        </button>
      ))}
    </div>
  );
}
