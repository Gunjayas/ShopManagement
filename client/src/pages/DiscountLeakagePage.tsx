import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { DiscountLeakageReport } from '@shared/types';
import { fetchDiscountLeakage } from '../lib/api';
import { Button } from '../components/ui/button';
import { currentMonth, formatRs } from './report-format';
import { ReportError, ReportLoading } from './report-ui';

// Show how much listed-price value was given up in sales during the selected month.
export function DiscountLeakagePage(): ReactNode {
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<DiscountLeakageReport | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const loadReport = useCallback(async (): Promise<void> => { setErrorMessage(''); try { setReport(await fetchDiscountLeakage(month)); } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Discount leakage could not be loaded.'); } }, [month]);
  useEffect(() => { void loadReport(); }, [loadReport]);
  return <section className="grid gap-6"><ReportTitle title="Discount leakage" description="Leakage compares listed price with the actual selling price for each sale." /><div className="flex flex-wrap items-end gap-3"><label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor="discount-month">Month<input id="discount-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal" /></label><Button variant="outline" onClick={() => void loadReport()}>Refresh</Button></div>{errorMessage && <ReportError message={errorMessage} />}{!report && !errorMessage ? <ReportLoading /> : report && <div className="grid gap-3 sm:grid-cols-3"><StatCard label="Total leakage" value={formatRs(report.total_leakage)} /><StatCard label="Number of sales" value={String(report.sale_count)} /><StatCard label="Average discount" value={formatRs(report.avg_discount_per_sale)} /></div>}</section>;
}

// Give one leakage metric enough visual space to scan quickly on a phone.
function StatCard({ label, value }: { label: string; value: string }): ReactNode { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></article>; }

// Keep report titles consistent while explaining the business meaning of each view.
function ReportTitle({ title, description }: { title: string; description: string }): ReactNode { return <div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Reports</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-slate-600">{description}</p></div>; }