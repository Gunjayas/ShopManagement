import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Bundle, InventoryItem, SaleWithItem } from '@shared/types';
import { fetchInventory, fetchSales, returnInventoryItem } from '../lib/api';
import { SaleForm } from '../components/SaleForm';
import { Button } from '../components/ui/button';

// Provide the complete sales workspace, including sale entry and hard-delete return controls.
export function SalesPage(): ReactNode {
  const [sales, setSales] = useState<SaleWithItem[]>([]);
  const [inStockItems, setInStockItems] = useState<Array<InventoryItem & { bundle: Bundle }>>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Reload both the ledger and selectable stock after every sale or return.
  const loadSalesWorkspace = async (): Promise<void> => {
    setErrorMessage('');
    try { setSales(await fetchSales()); setInStockItems(await fetchInventory('in_stock')); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Sales could not be loaded.'); }
  };
  useEffect(() => { void loadSalesWorkspace(); }, []);

  // Confirm the irreversible hard deletion before restoring the sold item.
  const handleReturn = async (sale: SaleWithItem): Promise<void> => {
    const confirmed = window.confirm('Process this return? The sale record will be permanently deleted and cannot be undone.');
    if (!confirmed) return;
    try { await returnInventoryItem(sale.itemId); await loadSalesWorkspace(); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'The return could not be processed.'); }
  };

  return <section className="grid gap-6"><div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Sales ledger</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Record and review sales</h1></div><SaleForm inventory={inStockItems} onSaved={loadSalesWorkspace} />{errorMessage && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{errorMessage}</p>}<div className="grid gap-3">{sales.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No sales have been recorded yet.</p> : sales.map((sale) => <SaleCard key={sale.id} sale={sale} onReturn={handleReturn} />)}</div></section>;
}

// Present one stored sale's item identity, prices, profit, and irreversible return action.
function SaleCard({ sale, onReturn }: { sale: SaleWithItem; onReturn: (sale: SaleWithItem) => Promise<void> }): ReactNode {
  return <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><h2 className="font-semibold">{sale.item.bundle.type} · {sale.item.bundle.designName}{sale.item.variant ? ` · ${sale.item.variant}` : ''}</h2><p className="text-sm text-slate-500">{new Date(sale.saleDate).toLocaleDateString()} · Cost {sale.item.costPrice.toFixed(2)}</p></div><dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3"><Value label="Selling price" value={sale.sellingPrice} /><Value label="Cost price" value={sale.item.costPrice} /><Value label="Profit" value={sale.profit} /></dl><Button variant="outline" onClick={() => void onReturn(sale)}>Process return</Button></article>;
}

// Render a compact monetary value in the sales summary.
function Value({ label, value }: { label: string; value: number }): ReactNode { return <div><dt className="text-slate-500">{label}</dt><dd className="font-semibold">{value.toFixed(2)}</dd></div>; }