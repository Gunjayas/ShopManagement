import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Bundle, InventoryItem, ItemStatus } from '@shared/types';
import { fetchInventory } from '../lib/api';
import { InventoryCard } from '../components/InventoryCard';

type InventoryWithBundle = InventoryItem & { bundle: Bundle };

// Provide a filterable pricing workspace for every individual physical stock item.
export function InventoryPage(): ReactNode {
  const [status, setStatus] = useState<'' | ItemStatus>('');
  const [inventory, setInventory] = useState<InventoryWithBundle[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Reload stock whenever the owner selects a different operational status.
  useEffect(() => {
    const loadInventory = async (): Promise<void> => {
      setErrorMessage('');
      try { setInventory(await fetchInventory(status)); }
      catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Inventory could not be loaded.'); }
    };
    void loadInventory();
  }, [status]);

  // Merge a pricing response into the existing row while retaining its bundle identity.
  const handleItemChanged = (changedItem: InventoryItem): void => {
    setInventory((current) => current.map((item) => item.id === changedItem.id ? { ...item, ...changedItem } : item));
  };

  return <section className="grid gap-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Selling units</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Inventory pricing</h1></div><label className="grid gap-1.5 text-sm font-medium text-slate-700"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as '' | ItemStatus)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-base"><option value="">All statuses</option><option value="in_stock">In stock</option><option value="sold">Sold</option><option value="damaged">Damaged</option><option value="returned">Returned</option></select></label></div>
    {errorMessage && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{errorMessage}</p>}
    <div className="grid gap-3">{inventory.length === 0 && !errorMessage ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No inventory items match this status. Items appear after a bundle arrives.</p> : inventory.map((item) => <InventoryCard key={item.id} item={item} onChanged={handleItemChanged} />)}</div>
  </section>;
}