import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Bundle } from '@shared/types';
import { patchBundle, postBundle } from '../lib/api';
import { Button } from './ui/button';
import { Field } from './ui/Field';

interface BundleFormProps { orderId: string; bundle?: Bundle; onSaved: (bundle: Bundle) => void; onCancel: () => void }

// Capture a new bundle or the three fields that remain editable while it is pending.
export function BundleForm({ orderId, bundle, onSaved, onCancel }: BundleFormProps): ReactNode {
  const [type, setType] = useState(bundle?.type ?? '');
  const [designName, setDesignName] = useState(bundle?.designName ?? '');
  const [itemsOrdered, setItemsOrdered] = useState(String(bundle?.itemsOrdered ?? 1));
  const [costPerItem, setCostPerItem] = useState(String(bundle?.costPerItem ?? 0));
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Save the allowed values without ever including items_ordered in an edit request.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    try {
      const editableValues = { type, design_name: designName, cost_per_item: Number(costPerItem) };
      const savedBundle = bundle
        ? await patchBundle(bundle.id, editableValues)
        : await postBundle(orderId, { ...editableValues, items_ordered: Number(itemsOrdered) });
      onSaved(savedBundle);
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'The bundle could not be saved.'); }
    finally { setIsSaving(false); }
  };

  return <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl bg-slate-50 p-4">
    <div className="grid gap-4 sm:grid-cols-2"><Field id={`type-${bundle?.id ?? 'new'}`} label="Type" value={type} onChange={(event) => setType(event.target.value)} required /><Field id={`design-${bundle?.id ?? 'new'}`} label="Design name" value={designName} onChange={(event) => setDesignName(event.target.value)} required />{!bundle && <Field id="items-ordered" label="Items ordered" type="number" min="0" step="1" value={itemsOrdered} onChange={(event) => setItemsOrdered(event.target.value)} required />}<Field id={`cost-${bundle?.id ?? 'new'}`} label="Cost per item" type="number" min="0" step="0.01" value={costPerItem} onChange={(event) => setCostPerItem(event.target.value)} required /></div>
    {errorMessage && <p className="text-sm text-rose-700" role="alert">{errorMessage}</p>}
    <div className="flex flex-wrap gap-2"><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : bundle ? 'Save bundle' : 'Add bundle'}</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div>
  </form>;
}