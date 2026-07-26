import { useState } from 'react';
import type { ReactNode } from 'react';
import type { InventoryItem } from '@shared/types';
import { patchPricing } from '../lib/api';
import { Button } from './ui/button';
import { Field } from './ui/Field';

interface PricingFormProps { item: InventoryItem; onSaved: (item: InventoryItem) => void; onCancel: () => void }

// Capture the five selling-price guides while keeping acquisition cost outside the editable form.
export function PricingForm({ item, onSaved, onCancel }: PricingFormProps): ReactNode {
  const [markedPrice, setMarkedPrice] = useState(String(item.markedPrice));
  const [listedPrice, setListedPrice] = useState(String(item.listedPrice));
  const [targetPrice, setTargetPrice] = useState(String(item.targetPrice));
  const [floorPrice, setFloorPrice] = useState(String(item.floorPrice));
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(String(item.maxDiscountPercent));
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Save only mutable pricing guidance and return the updated item to its inventory card.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    try {
      const pricingValues = { marked_price: Number(markedPrice), listed_price: Number(listedPrice), target_price: Number(targetPrice), floor_price: Number(floorPrice), max_discount_percent: Number(maxDiscountPercent) };
      onSaved(await patchPricing(item.id, pricingValues));
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Pricing could not be saved.'); }
    finally { setIsSaving(false); }
  };

  return <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl bg-slate-50 p-4">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Field id={`marked-${item.id}`} label="Marked price" type="number" min="0" step="0.01" value={markedPrice} onChange={(event) => setMarkedPrice(event.target.value)} required /><Field id={`listed-${item.id}`} label="Listed price" type="number" min="0" step="0.01" value={listedPrice} onChange={(event) => setListedPrice(event.target.value)} required /><Field id={`target-${item.id}`} label="Target price" type="number" min="0" step="0.01" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} required /><Field id={`floor-${item.id}`} label="Floor price" type="number" min="0" step="0.01" value={floorPrice} onChange={(event) => setFloorPrice(event.target.value)} required /><Field id={`discount-${item.id}`} label="Max discount %" type="number" min="0" step="0.01" value={maxDiscountPercent} onChange={(event) => setMaxDiscountPercent(event.target.value)} required /></div>
    <p className="text-xs text-slate-500">Cost price is fixed when inventory is generated and cannot be changed here.</p>
    {errorMessage && <p className="text-sm text-rose-700" role="alert">{errorMessage}</p>}
    <div className="flex flex-wrap gap-2"><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save pricing'}</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div>
  </form>;
}