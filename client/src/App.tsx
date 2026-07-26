import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { InventoryPage } from './pages/InventoryPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { SalesPage } from './pages/SalesPage';
import { LossEntriesPage } from './pages/LossEntriesPage';

// Route the owner between order workflows and individual inventory pricing.
function App(): ReactNode {
  return <BrowserRouter><AppShell><Routes><Route path="/orders" element={<OrdersPage />} /><Route path="/orders/:id" element={<OrderDetailPage />} /><Route path="/inventory" element={<InventoryPage />} /><Route path="/sales" element={<SalesPage />} /><Route path="/loss-entries" element={<LossEntriesPage />} /><Route path="*" element={<Navigate to="/orders" replace />} /></Routes></AppShell></BrowserRouter>;
}

export default App;
