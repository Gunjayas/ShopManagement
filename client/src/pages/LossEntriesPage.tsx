import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { LossEntry, LossEntryWithBundle } from '@shared/types';
import { fetchLossEntries } from '../lib/api';
import { RecoveryForm } from '../components/RecoveryForm';
import { Button } from '../components/ui/button';

// Provide a dedicated loss-history workspace with additive recovery controls.
export function LossEntriesPage(): ReactNode {
  const [lossEntries, setLossEntries] = useState<LossEntryWithBundle[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Load the newest loss records so recovery actions always start from current status.
  const loadLossEntries = async (): Promise<void> => {
    setErrorMessage('');
    try { setLossEntries(await fetchLossEntries()); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Loss entries could not be loaded.'); }
  };
  useEffect(() => { void loadLossEntries(); }, []);

  return <section className="grid gap-6"><div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Transit history</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Loss entries</h1></div>{errorMessage && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{errorMessage}</p>}<div className="grid gap-3">{lossEntries.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No transit loss entries have been recorded.</p> : lossEntries.map((lossEntry) => <LossEntryCard key={lossEntry.id} lossEntry={lossEntry} onSaved={loadLossEntries} />)}</div></section>;
}

// Present immutable loss facts and offer recovery only while the entry has no final outcome.
function LossEntryCard({ lossEntry, onSaved }: { lossEntry: LossEntryWithBundle; onSaved: () => Promise<void> }): ReactNode {
  const [isRecovering, setIsRecovering] = useState(false);
  const canRecover = lossEntry.recoveryStatus === 'none' || lossEntry.recoveryStatus === 'pending_claim';
  return <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><h2 className="font-semibold">{lossEntry.bundle.type} · {lossEntry.bundle.designName}</h2><p className="text-sm text-slate-500">Supplier: {lossEntry.bundle.order.supplierOrCountry}</p></div><dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3"><Detail label="Loss type" value={lossEntry.lossType.replace('_', ' ')} /><Detail label="Items lost" value={String(lossEntry.itemsLost)} /><Detail label="Loss value" value={lossEntry.lossValue.toFixed(2)} /><Detail label="Loss date" value={new Date(lossEntry.lossDate).toLocaleDateString()} /><Detail label="Recovery" value={lossEntry.recoveryStatus.replace('_', ' ')} /></dl>{canRecover && <Button variant="outline" onClick={() => setIsRecovering((recovering) => !recovering)}>{isRecovering ? 'Hide recovery form' : 'Record recovery'}</Button>}{isRecovering && <RecoveryForm lossEntry={lossEntry as LossEntry} onSaved={async () => { setIsRecovering(false); await onSaved(); }} onCancel={() => setIsRecovering(false)} />}</article>;
}

// Render a named loss fact consistently in the mobile-friendly summary grid.
function Detail({ label, value }: { label: string; value: string }): ReactNode { return <div><dt className="text-slate-500">{label}</dt><dd className="font-semibold capitalize">{value}</dd></div>; }