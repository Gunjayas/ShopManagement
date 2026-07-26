import type { ReactNode } from 'react';

// Show a report metric as a clear label-and-value row on narrow screens.
export function MetricRow({ label, value, emphasis = false, tone = 'default' }: { label: string; value: string; emphasis?: boolean; tone?: 'default' | 'positive' | 'negative' }): ReactNode {
  const toneClass = tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-rose-700' : 'text-slate-950';
  return <div className={`flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0 ${emphasis ? 'text-lg font-bold' : 'text-sm'}`}><dt className="text-slate-500">{label}</dt><dd className={toneClass}>{value}</dd></div>;
}

// Provide a consistent loading placeholder while a report request is in flight.
export function ReportLoading(): ReactNode { return <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Loading report…</p>; }

// Provide the same plain-English error presentation across every report screen.
export function ReportError({ message }: { message: string }): ReactNode { return <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{message}</p>; }