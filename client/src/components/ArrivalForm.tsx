import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Bundle } from '@shared/types';
import { arriveBundle } from '../lib/api';
import { Button } from './ui/button';
import { Field } from './ui/Field';

interface ArrivalFormProps { bundle: Bundle; onSaved: (bundle: Bundle) => void; onCancel: () => void }

// Capture the actual arrival event, including backdated dates needed for stock aging reports.
export function ArrivalForm({ bundle, onSaved, onCancel }: ArrivalFormProps): ReactNode {
  const [itemsReceived, setItemsReceived] = useState(String(bundle.itemsOrdered));
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().slice(0, 10));
  const [variant, setVariant] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Ask the server to atomically receive stock and record any transit shortfall.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    try {
      const arrivedBundle = await arriveBundle(bundle.id, { items_received: Number(itemsReceived), arrival_date: new Date(`${arrivalDate}T00:00:00`).toISOString(), variant });
      onSaved(arrivedBundle);
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'The bundle could not be marked arrived.'); }
    finally { setIsSaving(false); }
  };

  return <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl bg-emerald-50 p-4">
    <p className="text-sm text-emerald-800">Backdated arrival dates are allowed.</p>
    <div className="grid gap-4 sm:grid-cols-3"><Field id={`received-${bundle.id}`} label="Items received" type="number" min="0" max={bundle.itemsOrdered} step="1" value={itemsReceived} onChange={(event) => setItemsReceived(event.target.value)} required /><Field id={`arrival-${bundle.id}`} label="Arrival date" type="date" value={arrivalDate} onChange={(event) => setArrivalDate(event.target.value)} required /><Field id={`variant-${bundle.id}`} label="Variant (optional)" value={variant} onChange={(event) => setVariant(event.target.value)} /></div>
    {errorMessage && <p className="text-sm text-rose-700" role="alert">{errorMessage}</p>}
    <div className="flex flex-wrap gap-2"><Button type="submit" disabled={isSaving}>{isSaving ? 'Receiving…' : 'Confirm arrival'}</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div>
  </form>;
}