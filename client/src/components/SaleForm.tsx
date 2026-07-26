import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { InventoryItem, Bundle } from '@shared/types';
import { postSale } from '../lib/api';
import { Button } from './ui/button';
import { Field } from './ui/Field';

type InventoryWithBundle = InventoryItem & { bundle: Bundle };
interface SaleFormProps { inventory: InventoryWithBundle[]; onSaved: () => void }

// Record a sale from searchable stock while showing fixed cost and all pricing guidance as reference.
export function SaleForm({ inventory, onSaved }: SaleFormProps): ReactNode {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [sellingPrice, setSellingPrice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const selectedItem = inventory.find((item) => item.id === selectedItemId);
  const matchingItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return inventory.filter((item) => `${item.bundle.type} ${item.bundle.designName} ${item.variant ?? ''}`.toLowerCase().includes(normalizedSearch));
  }, [inventory, searchText]);
  const sellingPriceNumber = Number(sellingPrice);
  const discountExceedsThreshold = Boolean(
    selectedItem &&
    selectedItem.listedPrice > 0 &&
    Number.isFinite(sellingPriceNumber) &&
    (selectedItem.listedPrice - sellingPriceNumber) / selectedItem.listedPrice > (selectedItem.maxDiscountPercent / 100)
  );

  // Submit a sale after the owner has reviewed the selected item's pricing references.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    if (!selectedItem) { setErrorMessage('Select an in-stock item before recording the sale.'); return; }
    setIsSaving(true);
    try {
      await postSale({ item_id: selectedItem.id, sale_date: saleDate, selling_price: sellingPriceNumber });
      setSelectedItemId('');
      setSellingPrice('');
      onSaved();
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'The sale could not be recorded.'); }
    finally { setIsSaving(false); }
  };

  return <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="grid gap-4 sm:grid-cols-2"><Field id="item-search" label="Search in-stock items" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Type, design, or variant" /><label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor="sale-item"><span>Item</span><select id="sale-item" value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-base" required><option value="">Select item</option>{matchingItems.map((item) => <option key={item.id} value={item.id}>{item.bundle.type} · {item.bundle.designName}{item.variant ? ` · ${item.variant}` : ''}</option>)}</select></label></div>
    {selectedItem && <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3"><Reference label="Cost price" value={selectedItem.costPrice} /><Reference label="Marked price" value={selectedItem.markedPrice} /><Reference label="Listed price" value={selectedItem.listedPrice} /><Reference label="Target price" value={selectedItem.targetPrice} /><Reference label="Floor price" value={selectedItem.floorPrice} /><Reference label="Max discount" value={selectedItem.maxDiscountPercent} suffix="%" /></div>}
    <div className="grid gap-4 sm:grid-cols-2"><Field id="sale-date" label="Sale date" type="date" value={saleDate} onChange={(event) => setSaleDate(event.target.value)} required /><Field id="selling-price" label="Selling price" type="number" min="0" step="0.01" value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} required /></div>
    {discountExceedsThreshold && <p className="rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800" role="status">Discount exceeds your set threshold. You can still record this sale.</p>}
    {errorMessage && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{errorMessage}</p>}
    <Button type="submit" disabled={isSaving}>{isSaving ? 'Recording…' : 'Record sale'}</Button>
  </form>;
}

// Display one read-only price reference beside the sale controls.
function Reference({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }): ReactNode {
  return <div><p className="text-slate-500">{label}</p><p className="font-semibold">{value.toFixed(2)}{suffix}</p></div>;
}