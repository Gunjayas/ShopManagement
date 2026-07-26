import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Order } from '@shared/types';
import { postOrder, patchOrder } from '../lib/api';
import { Button } from './ui/button';
import { Field } from './ui/Field';

interface OrderFormProps { order?: Order; onSaved: (order: Order) => void; onCancel?: () => void }

// Format an ISO timestamp for the date input while preserving the owner’s selected calendar day.
const dateInputValue = (date: string): string => date.slice(0, 10);

// Capture purchasing details and save either a new order or an existing editable order.
export function OrderForm({ order, onSaved, onCancel }: OrderFormProps): ReactNode {
  const [supplierOrCountry, setSupplierOrCountry] = useState(order?.supplierOrCountry ?? '');
  const [orderDate, setOrderDate] = useState(dateInputValue(order?.orderDate ?? new Date().toISOString()));
  const [transportationFee, setTransportationFee] = useState(String(order?.transportationFee ?? 0));
  const [expectedBundleCount, setExpectedBundleCount] = useState(String(order?.expectedBundleCount ?? 1));
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Submit valid form values and return the saved order to its parent page.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    try {
      const values = { supplier_or_country: supplierOrCountry, order_date: new Date(`${orderDate}T00:00:00`).toISOString(), transportation_fee: Number(transportationFee), expected_bundle_count: Number(expectedBundleCount) };
      const savedOrder = order ? await patchOrder(order.id, values) : await postOrder(values);
      onSaved(savedOrder);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The order could not be saved.');
    } finally { setIsSaving(false); }
  };

  return <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="grid gap-4 sm:grid-cols-2"><Field id="supplier" label="Supplier or country" value={supplierOrCountry} onChange={(event) => setSupplierOrCountry(event.target.value)} required /><Field id="order-date" label="Order date" type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} required /><Field id="transport-fee" label="Transportation fee" type="number" min="0" step="0.01" value={transportationFee} onChange={(event) => setTransportationFee(event.target.value)} required /><Field id="bundle-count" label="Expected bundle count" type="number" min="0" step="1" value={expectedBundleCount} onChange={(event) => setExpectedBundleCount(event.target.value)} required /></div>
    {errorMessage && <p className="text-sm text-rose-700" role="alert">{errorMessage}</p>}
    <div className="flex flex-wrap gap-2"><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : order ? 'Save changes' : 'Create order'}</Button>{onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}</div>
  </form>;
}