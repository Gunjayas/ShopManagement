import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Order } from '@shared/types';
import { fetchOrders } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/button';
import { OrderForm } from '../components/OrderForm';

// Show ongoing and closed purchases in newest-first order and provide the new-order entry point.
export function OrdersPage(): ReactNode {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load the current purchase list whenever this workspace opens.
  useEffect(() => {
    const loadOrders = async (): Promise<void> => {
      try { setOrders(await fetchOrders()); }
      catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Orders could not be loaded.'); }
    };
    void loadOrders();
  }, []);

  return <section className="grid gap-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Purchasing</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Orders</h1></div><Button onClick={() => setShowForm((visible) => !visible)}>{showForm ? 'Hide form' : 'New order'}</Button></div>
    {showForm && <OrderForm onSaved={(savedOrder) => { setOrders((currentOrders) => [savedOrder, ...currentOrders]); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
    {errorMessage && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{errorMessage}</p>}
    <div className="grid gap-3">{orders.length === 0 && !errorMessage ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No orders yet. Add the first shipment to get started.</p> : orders.map((order) => <Link key={order.id} to={`/orders/${order.id}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-400 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><h2 className="font-semibold">{order.supplierOrCountry}</h2><p className="text-sm text-slate-500">{dateInputValue(order.orderDate)} · {order.expectedBundleCount} expected bundles</p></div><p className="text-sm text-slate-600">Transport: {order.transportationFee.toFixed(2)}</p><Badge tone={order.status === 'ongoing' ? 'warning' : 'success'}>{order.status}</Badge></Link>)}</div>
  </section>;
}

// Format an API date as the compact calendar value used in order cards.
const dateInputValue = (date: string): string => date.slice(0, 10);