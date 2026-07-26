import type { InputHTMLAttributes, ReactNode } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> { label: string }

// Label each input clearly so the owner can complete forms without guessing field meaning.
export function Field({ label, id, ...props }: FieldProps): ReactNode {
  return <label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor={id}><span>{label}</span><input id={id} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal outline-none ring-slate-400 focus:ring-2" {...props} /></label>;
}