import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { MonthlyPlReport } from '@shared/types';
import { fetchMonthlyPl } from '../lib/api';
import { Button } from '../components/ui/button';
import { currentMonth, formatRs } from './report-format';
import { MetricRow, ReportError, ReportLoading } from './report-ui';

// Show the selected month's true profit after each correctly attributed income and expense.
export function MonthlyPlPage(): ReactNode {
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<MonthlyPlReport | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const loadReport = useCallback(async (): Promise<void> => { setErrorMessage(''); try { setReport(await fetchMonthlyPl(month)); } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Monthly P&L could not be loaded.'); } }, [month]);
  useEffect(() => { void loadReport(); }, [loadReport]);
  const profitTone = report && report.true_monthly_profit < 0 ? 'negative' : 'positive';
  return <section className="grid gap-6"><ReportHeading title="Monthly P&L" description="Income and expenses counted in the month they happened." /><div className="flex flex-wrap items-end gap-3"><label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor="pl-month">Month<input id="pl-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal" /></label><Button variant="outline" onClick={() => void loadReport()}>Refresh</Button></div>{errorMessage && <ReportError message={errorMessage} />}{!report && !errorMessage ? <ReportLoading /> : report && <dl className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><MetricRow label="Item profit" value={formatRs(report.total_item_profit)} /><MetricRow label="Transit losses" value={formatRs(report.total_transit_losses)} /><MetricRow label="Recoveries" value={formatRs(report.total_recoveries)} /><MetricRow label="Transportation fees" value={formatRs(report.transportation_fees)} /><MetricRow label="True monthly profit" value={formatRs(report.true_monthly_profit)} emphasis tone={profitTone} /></dl>}</section>;
}

// Keep report navigation and purpose visible above every report's controls.
function ReportHeading({ title, description }: { title: string; description: string }): ReactNode { return <div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Reports</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-slate-600">{description}</p></div>; }