import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { DeadStockReportItem } from '@shared/types';
import { fetchDeadStock } from '../lib/api';
import { Button } from '../components/ui/button';
import { Field } from '../components/ui/Field';
import { formatRs } from './report-format';
import { ReportError, ReportLoading } from './report-ui';

// Show in-stock items whose bundle arrival date makes them older than the selected threshold.
export function DeadStockPage(): ReactNode {
  const [days, setDays] = useState(60);
  const [customDays, setCustomDays] = useState('60');
  const [items, setItems] = useState<DeadStockReportItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  // Reload the thresholded stock list so the count and cards reflect the current age choice.
  const loadReport = useCallback(async (): Promise<void> => { setErrorMessage(''); try { setItems(await fetchDeadStock(days)); } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Dead stock could not be loaded.'); } }, [days]);
  useEffect(() => { void loadReport(); }, [loadReport]);
  // Apply a valid custom age only after the owner has finished entering the threshold.
  const applyCustomDays = (): void => { const selectedDays = Number(customDays); if (Number.isInteger(selectedDays) && selectedDays >= 0) setDays(selectedDays); else setErrorMessage('Enter a non-negative whole number of days.'); };
  return <section className="grid gap-6"><div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Reports</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Dead stock</h1></div><div className="grid gap-3 sm:flex sm:items-end"><div className="flex gap-2">{[30, 60, 90].map((quickDays) => <Button key={quickDays} variant={days === quickDays ? 'default' : 'outline'} onClick={() => { setCustomDays(String(quickDays)); setDays(quickDays); }}>{quickDays} days</Button>)}</div><div className="flex items-end gap-2"><Field id="custom-days" label="Custom days" type="number" min="0" value={customDays} onChange={(event) => setCustomDays(event.target.value)} /><Button variant="outline" onClick={applyCustomDays}>Apply</Button></div></div>{errorMessage && <ReportError message={errorMessage} />}{items === null && !errorMessage ? <ReportLoading /> : items && <div className="grid gap-3"><p className="font-semibold">{items.length} items unsold for more than {days} days</p>{items.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No dead stock found.</p> : items.map((item) => <DeadStockCard key={item.item_id} item={item} />)}</div>}</section>;
}

// Present one stale inventory unit with its selling and cost context in a compact card.
function DeadStockCard({ item }: { item: DeadStockReportItem }): ReactNode { return <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{item.type} · {item.design_name}</h2>{item.variant && <p className="text-sm text-slate-500">Variant: {item.variant}</p>}</div><p className="text-right text-sm font-semibold text-amber-700">{item.days_in_stock} days</p></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Cost price</dt><dd className="font-semibold">{formatRs(item.cost_price)}</dd></div><div><dt className="text-slate-500">Listed price</dt><dd className="font-semibold">{formatRs(item.listed_price)}</dd></div></dl></article>; }