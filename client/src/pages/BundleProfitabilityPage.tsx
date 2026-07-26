import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { BundleProfitabilityReportItem } from '@shared/types';
import { fetchBundleProfitability } from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/Badge';
import { formatRs } from './report-format';
import { ReportError, ReportLoading } from './report-ui';

type SortField = 'net' | 'total_profit' | 'total_loss' | 'units_sold';

// Let the owner compare every bundle by the profitability measure most useful for the current decision.
export function BundleProfitabilityPage(): ReactNode {
  const [bundles, setBundles] = useState<BundleProfitabilityReportItem[] | null>(null);
  const [sortField, setSortField] = useState<SortField>('net');
  const [ascending, setAscending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Reload all bundle history when the profitability screen opens.
  const loadReport = useCallback(async (): Promise<void> => { setErrorMessage(''); try { setBundles(await fetchBundleProfitability()); } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Bundle profitability could not be loaded.'); } }, []);
  useEffect(() => { void loadReport(); }, [loadReport]);
  // Change the selected business measure or reverse its display direction.
  const changeSort = (nextField: SortField): void => { if (nextField === sortField) setAscending((isAscending) => !isAscending); else { setSortField(nextField); setAscending(false); } };
  const displayedBundles = bundles ? [...bundles].sort((first, second) => { const difference = second[sortField] - first[sortField]; return ascending ? -difference : difference; }) : [];
  return <section className="grid gap-6"><ReportTitle title="Bundle profitability" description="Every bundle stays visible, including lost, refunded, and replaced history." /><div className="flex flex-wrap gap-2">{(['net', 'total_profit', 'total_loss', 'units_sold'] as SortField[]).map((field) => <Button key={field} variant={field === sortField ? 'default' : 'outline'} onClick={() => changeSort(field)}>{field.replace('_', ' ')} {field === sortField ? (ascending ? '↑' : '↓') : ''}</Button>)}</div>{errorMessage && <ReportError message={errorMessage} />}{!bundles && !errorMessage ? <ReportLoading /> : <div className="grid gap-3">{displayedBundles.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No bundles found.</p> : displayedBundles.map((bundle) => <BundleCard key={bundle.bundle_id} bundle={bundle} />)}</div>}</section>;
}

// Present one bundle's identity, status, stock counts, and historical financial result together.
function BundleCard({ bundle }: { bundle: BundleProfitabilityReportItem }): ReactNode { const netTone = bundle.net > 0 ? 'text-emerald-700' : bundle.net < 0 ? 'text-rose-700' : 'text-slate-500'; return <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{bundle.type} · {bundle.design_name}</h2><p className="text-sm text-slate-500">Supplier: {bundle.supplier_or_country}</p></div><Badge>{bundle.status}</Badge></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Ordered / received</dt><dd className="font-semibold">{bundle.items_ordered} / {bundle.items_received}</dd></div><div><dt className="text-slate-500">Units sold</dt><dd className="font-semibold">{bundle.units_sold}</dd></div><div><dt className="text-slate-500">Total profit</dt><dd className="font-semibold">{formatRs(bundle.total_profit)}</dd></div><div><dt className="text-slate-500">Total loss</dt><dd className="font-semibold">{formatRs(bundle.total_loss)}</dd></div></dl><div className={`border-t border-slate-100 pt-3 text-lg font-bold ${netTone}`}>Net: {formatRs(bundle.net)}</div></article>; }

// Keep report titles consistent while explaining the business meaning of each view.
function ReportTitle({ title, description }: { title: string; description: string }): ReactNode { return <div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Reports</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-slate-600">{description}</p></div>; }