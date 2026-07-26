import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Bundle, InventoryItem } from '@shared/types';
import { PricingForm } from './PricingForm';
import { Badge } from './ui/Badge';
import { Button } from './ui/button';

type InventoryWithBundle = InventoryItem & { bundle: Bundle };
interface InventoryCardProps { item: InventoryWithBundle; onChanged: (item: InventoryItem) => void }

// Present one physical selling unit and all of its current pricing guidance without horizontal scrolling.
export function InventoryCard({ item, onChanged }: InventoryCardProps): ReactNode {
  const [isEditing, setIsEditing] = useState(false);

  // Apply a saved price update while retaining bundle context supplied by this card.
  const handleSaved = (savedItem: InventoryItem): void => { onChanged(savedItem); setIsEditing(false); };

  return <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-all text-xs text-slate-400">Item {item.id}</p><h2 className="mt-1 font-semibold">{item.bundle.type} · {item.bundle.designName}</h2><p className="text-sm text-slate-500">{item.variant ? `Variant: ${item.variant}` : 'No variant label'}</p></div><Badge tone={item.status === 'in_stock' ? 'success' : 'default'}>{item.status.replace('_', ' ')}</Badge></div>
    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6"><div><dt className="text-slate-500">Cost price</dt><dd className="font-semibold">{item.costPrice.toFixed(2)} <span className="text-xs font-normal text-slate-400">fixed</span></dd></div><PriceValue label="Marked" value={item.markedPrice} /><PriceValue label="Listed" value={item.listedPrice} /><PriceValue label="Target" value={item.targetPrice} /><PriceValue label="Floor" value={item.floorPrice} /><div><dt className="text-slate-500">Max discount</dt><dd className="font-semibold">{item.maxDiscountPercent}%</dd></div></dl>
    <div><Button variant="outline" onClick={() => setIsEditing((editing) => !editing)}>{isEditing ? 'Hide pricing form' : 'Edit pricing'}</Button></div>
    {isEditing && <PricingForm item={item} onSaved={handleSaved} onCancel={() => setIsEditing(false)} />}
  </article>;
}

// Render one monetary guide consistently within the compact pricing summary.
function PriceValue({ label, value }: { label: string; value: number }): ReactNode {
  return <div><dt className="text-slate-500">{label}</dt><dd className="font-semibold">{value.toFixed(2)}</dd></div>;
}