import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { MoverReportItem } from '@shared/types';
import { fetchMovers } from '../lib/api';
import { Button } from '../components/ui/button';
import { ReportError, ReportLoading } from './report-ui';

// Show design groups from fastest to slowest, with a toggle for the owner's other perspective.
export function MoversPage(): ReactNode {
  const [movers, setMovers] = useState<MoverReportItem[] | null>(null);
  const [showSlowestFirst, setShowSlowestFirst] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Reload the database-aggregated mover groups when the screen opens.
  const loadReport = useCallback(async (): Promise<void> => { setErrorMessage(''); try { setMovers(await fetchMovers()); } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Mover report could not be loaded.'); } }, []);
  useEffect(() => { void loadReport(); }, [loadReport]);
  const displayedMovers = movers ? [...movers].sort((first, second) => showSlowestFirst ? (second.avg_days_to_sale ?? Number.POSITIVE_INFINITY) - (first.avg_days_to_sale ?? Number.POSITIVE_INFINITY) : (first.avg_days_to_sale ?? Number.POSITIVE_INFINITY) - (second.avg_days_to_sale ?? Number.POSITIVE_INFINITY)) : [];
  return <section className="grid gap-6"><ReportTitle title="Fastest / slowest movers" description="Sales speed is averaged from each item's bundle arrival to its sale date." /><Button variant="outline" onClick={() => setShowSlowestFirst((isSlowest) => !isSlowest)}>{showSlowestFirst ? 'Show fastest first' : 'Show slowest first'}</Button>{errorMessage && <ReportError message={errorMessage} />}{!movers && !errorMessage ? <ReportLoading /> : <div className="grid gap-3">{displayedMovers.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No sold groups found.</p> : displayedMovers.map((mover) => <article key={`${mover.type}-${mover.design_name}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-semibold">{mover.type} · {mover.design_name}</h2><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Units sold</dt><dd className="font-semibold">{mover.units_sold}</dd></div><div><dt className="text-slate-500">Average days to sell</dt><dd className="font-semibold">{mover.avg_days_to_sale === null ? '—' : `${mover.avg_days_to_sale.toFixed(1)} days`}</dd></div></dl></article>)}</div>}</section>;
}

// Keep report titles consistent while explaining the business meaning of each view.
function ReportTitle({ title, description }: { title: string; description: string }): ReactNode { return <div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Reports</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-slate-600">{description}</p></div>; }