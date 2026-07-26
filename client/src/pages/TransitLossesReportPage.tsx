import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { TransitLossReport, TransitLossReportItem } from '@shared/types';
import { fetchTransitLosses } from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/Badge';
import { formatDate, formatRs, currentMonth } from './report-format';
import { MetricRow, ReportError, ReportLoading } from './report-ui';

// Show loss history by loss date while keeping recovery as an additive historical outcome.
export function TransitLossesReportPage(): ReactNode {
  const [month, setMonth] = useState('');
  const [report, setReport] = useState<TransitLossReport | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  // Reload loss history whenever the owner changes the loss-date filter.
  const loadReport = useCallback(async (): Promise<void> => { setErrorMessage(''); try { setReport(await fetchTransitLosses(month || undefined)); } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Transit losses could not be loaded.'); } }, [month]);
  useEffect(() => { void loadReport(); }, [loadReport]);
  return <section className="grid gap-6"><ReportTitle title="Transit loss" description="The optional month filters the date each loss was recorded." /><div className="flex flex-wrap items-end gap-3"><label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor="loss-month">Loss month<input id="loss-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal" /></label><Button variant="outline" onClick={() => { setMonth(currentMonth()); }}>This month</Button><Button variant="outline" onClick={() => { setMonth(''); }}>All time</Button></div>{errorMessage && <ReportError message={errorMessage} />}{!report && !errorMessage ? <ReportLoading /> : report && <><dl className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><MetricRow label="Total loss value" value={formatRs(report.total_loss_value)} /><MetricRow label="Total recovery value" value={formatRs(report.total_recovery_value)} /><MetricRow label="Total net loss" value={formatRs(report.total_net_loss)} emphasis /></dl><div className="grid gap-3">{report.entries.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No transit losses found.</p> : report.entries.map((entry) => <LossCard key={entry.loss_id} entry={entry} />)}</div></>}</section>;
}

// Present immutable loss facts and recovery details without allowing report users to edit history.
function LossCard({ entry }: { entry: TransitLossReportItem }): ReactNode { return <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{entry.type} · {entry.design_name}</h2><p className="text-sm text-slate-500">Supplier: {entry.supplier_or_country}</p></div><Badge tone={entry.net_loss > 0 ? 'danger' : 'success'}>{entry.loss_type.replace('_', ' ')}</Badge></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Loss date</dt><dd className="font-semibold">{formatDate(entry.loss_date)}</dd></div><div><dt className="text-slate-500">Recovery</dt><dd className="font-semibold capitalize">{entry.recovery_status.replace('_', ' ')}</dd></div><div><dt className="text-slate-500">Loss value</dt><dd className="font-semibold">{formatRs(entry.loss_value)}</dd></div><div><dt className="text-slate-500">Recovery value</dt><dd className="font-semibold">{formatRs(entry.recovery_value)}</dd></div><div><dt className="text-slate-500">Net loss</dt><dd className="font-semibold">{formatRs(entry.net_loss)}</dd></div></dl></article>; }

// Keep report titles consistent while explaining the business meaning of each view.
function ReportTitle({ title, description }: { title: string; description: string }): ReactNode { return <div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Reports</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-slate-600">{description}</p></div>; }