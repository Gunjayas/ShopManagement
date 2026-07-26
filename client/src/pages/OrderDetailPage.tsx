import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Bundle, Order } from '@shared/types';
import { closeOrder, fetchBundles, fetchOrder } from '../lib/api';
import { BundleCard } from '../components/BundleCard';
import { BundleForm } from '../components/BundleForm';
import { OrderForm } from '../components/OrderForm';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/button';

// Combine the order header and its bundle workflow in one mobile-friendly detail workspace.
export function OrderDetailPage(): ReactNode {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [activeForm, setActiveForm] = useState<'edit-order' | 'add-bundle' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Load the order and its bundles together so the workspace is internally consistent.
  useEffect(() => {
    const loadDetail = async (): Promise<void> => {
      try { const [loadedOrder, loadedBundles] = await Promise.all([fetchOrder(id), fetchBundles(id)]); setOrder(loadedOrder); setBundles(loadedBundles); }
      catch (error) { setErrorMessage(error instanceof Error ? error.message : 'The order detail could not be loaded.'); }
    };
    void loadDetail();
  }, [id]);

  // Close the order without checking bundle states because closure is intentionally unrestricted.
  const handleCloseOrder = async (): Promise<void> => {
    try { setOrder(await closeOrder(id)); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'The order could not be closed.'); }
  };

  // Replace a changed bundle without disturbing the rest of the order detail.
  const handleBundleChanged = (changedBundle: Bundle): void => setBundles((current) => current.map((bundle) => bundle.id === changedBundle.id ? changedBundle : bundle));

  if (errorMessage && !order) return <p className="rounded-lg bg-rose-50 p-4 text-rose-700">{errorMessage}</p>;
  if (!order) return <p className="text-slate-500">Loading order…</p>;
  return <section className="grid gap-6">
    <Link to="/orders" className="text-sm font-semibold text-slate-600">← Back to orders</Link>
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-slate-500">Order {order.orderDate.slice(0, 10)}</p><h1 className="text-2xl font-bold">{order.supplierOrCountry}</h1></div><Badge tone={order.status === 'ongoing' ? 'warning' : 'success'}>{order.status}</Badge></div><div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p>Transportation fee: {order.transportationFee.toFixed(2)}</p><p>Expected bundles: {order.expectedBundleCount}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setActiveForm('edit-order')}>Edit order</Button>{order.status !== 'closed' && <Button onClick={() => void handleCloseOrder()}>Close order</Button>}</div></div>
    {activeForm === 'edit-order' && <OrderForm order={order} onSaved={(savedOrder) => { setOrder(savedOrder); setActiveForm(null); }} onCancel={() => setActiveForm(null)} />}
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Shipment units</p><h2 className="text-2xl font-bold">Bundles</h2></div><Button onClick={() => setActiveForm('add-bundle')}>Add bundle</Button></div>
    {activeForm === 'add-bundle' && <BundleForm orderId={id} onSaved={(savedBundle) => { setBundles((current) => [...current, savedBundle]); setActiveForm(null); }} onCancel={() => setActiveForm(null)} />}
    <div className="grid gap-3">{bundles.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No bundles have been added to this order.</p> : bundles.map((bundle) => <BundleCard key={bundle.id} bundle={bundle} onChanged={handleBundleChanged} />)}</div>
    {errorMessage && <p className="text-sm text-rose-700" role="alert">{errorMessage}</p>}
  </section>;
}