import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Bundle } from '@shared/types';
import { loseBundle } from '../lib/api';
import { ArrivalForm } from './ArrivalForm';
import { BundleForm } from './BundleForm';
import { Badge } from './ui/Badge';
import { Button } from './ui/button';

interface BundleCardProps { bundle: Bundle; onChanged: (bundle: Bundle) => void }
type ActiveAction = 'edit' | 'arrive' | null;

// Present one purchasing unit with only the actions its current state safely allows.
export function BundleCard({ bundle, onChanged }: BundleCardProps): ReactNode {
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const isPending = bundle.status === 'pending';

  // Record a full transit loss only after the owner confirms the irreversible action.
  const handleLost = async (): Promise<void> => {
    if (!window.confirm('Mark this entire bundle as lost? This creates a permanent loss record.')) return;
    setErrorMessage('');
    try { onChanged(await loseBundle(bundle.id)); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'The bundle could not be marked lost.'); }
  };

  // Replace the displayed bundle with its latest server state and close the active form.
  const handleChanged = (changedBundle: Bundle): void => { onChanged(changedBundle); setActiveAction(null); };

  return <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold">{bundle.type} · {bundle.designName}</h3><p className="mt-1 text-sm text-slate-500">{bundle.itemsOrdered} ordered · Cost {bundle.costPerItem.toFixed(2)} each · Total {(bundle.itemsOrdered * bundle.costPerItem).toFixed(2)}</p></div><Badge tone={bundle.status === 'pending' ? 'warning' : bundle.status === 'lost' ? 'danger' : 'success'}>{bundle.status}</Badge></div>
    {isPending && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setActiveAction('edit')}>Edit</Button><Button variant="outline" onClick={() => setActiveAction('arrive')}>Mark arrived</Button><Button variant="destructive" onClick={() => void handleLost()}>Mark lost</Button></div>}
    {activeAction === 'edit' && <BundleForm orderId={bundle.orderId} bundle={bundle} onSaved={handleChanged} onCancel={() => setActiveAction(null)} />}
    {activeAction === 'arrive' && <ArrivalForm bundle={bundle} onSaved={handleChanged} onCancel={() => setActiveAction(null)} />}
    {errorMessage && <p className="text-sm text-rose-700" role="alert">{errorMessage}</p>}
  </article>;
}