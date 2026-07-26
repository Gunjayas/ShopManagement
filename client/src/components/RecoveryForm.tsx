import { useState } from 'react';
import type { ReactNode } from 'react';
import type { LossEntry, RecoverLossInput } from '@shared/types';
import { recoverLossEntry } from '../lib/api';
import { Button } from './ui/button';
import { Field } from './ui/Field';

interface RecoveryFormProps { lossEntry: LossEntry; onSaved: () => void; onCancel: () => void }

// Capture final recovery details and replacement bundle data without exposing immutable loss fields for editing.
export function RecoveryForm({ lossEntry, onSaved, onCancel }: RecoveryFormProps): ReactNode {
  const [recoveryStatus, setRecoveryStatus] = useState<'refunded' | 'replaced'>('refunded');
  const [recoveryValue, setRecoveryValue] = useState('');
  const [recoveryDate, setRecoveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState('');
  const [designName, setDesignName] = useState('');
  const [itemsOrdered, setItemsOrdered] = useState('');
  const [costPerItem, setCostPerItem] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Save the recovery outcome and refresh the immutable loss list after the transaction succeeds.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    const recoveryValues: RecoverLossInput = { recovery_status: recoveryStatus, recovery_value: Number(recoveryValue), recovery_date: recoveryDate };
    if (recoveryStatus === 'replaced') recoveryValues.new_bundle = { type, design_name: designName, items_ordered: Number(itemsOrdered), cost_per_item: Number(costPerItem) };
    setIsSaving(true);
    try { await recoverLossEntry(lossEntry.id, recoveryValues); onSaved(); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'The recovery could not be saved.'); }
    finally { setIsSaving(false); }
  };

  return <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl bg-slate-50 p-4"><div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor={`recovery-status-${lossEntry.id}`}><span>Recovery status</span><select id={`recovery-status-${lossEntry.id}`} value={recoveryStatus} onChange={(event) => setRecoveryStatus(event.target.value as 'refunded' | 'replaced')} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-base"><option value="refunded">Refunded</option><option value="replaced">Replaced</option></select></label><Field id={`recovery-value-${lossEntry.id}`} label="Recovery value" type="number" min="0" step="0.01" value={recoveryValue} onChange={(event) => setRecoveryValue(event.target.value)} required /><Field id={`recovery-date-${lossEntry.id}`} label="Recovery date" type="date" value={recoveryDate} onChange={(event) => setRecoveryDate(event.target.value)} required /></div>{recoveryStatus === 'replaced' && <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2"><p className="sm:col-span-2 text-sm font-semibold">New replacement bundle</p><Field id={`replacement-type-${lossEntry.id}`} label="Type" value={type} onChange={(event) => setType(event.target.value)} required /><Field id={`replacement-design-${lossEntry.id}`} label="Design name" value={designName} onChange={(event) => setDesignName(event.target.value)} required /><Field id={`replacement-items-${lossEntry.id}`} label="Items ordered" type="number" min="0" step="1" value={itemsOrdered} onChange={(event) => setItemsOrdered(event.target.value)} required /><Field id={`replacement-cost-${lossEntry.id}`} label="Cost per item" type="number" min="0" step="0.01" value={costPerItem} onChange={(event) => setCostPerItem(event.target.value)} required /></div>}{errorMessage && <p className="text-sm text-rose-700" role="alert">{errorMessage}</p>}<div className="flex flex-wrap gap-2"><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save recovery'}</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div></form>;
}