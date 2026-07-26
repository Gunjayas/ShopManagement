import type { ReactNode } from 'react';

interface BadgeProps { children: ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger' }

// Show a compact status label that remains legible on a narrow screen.
export function Badge({ children, tone = 'default' }: BadgeProps): ReactNode {
  const toneClass = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-700',
  }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}