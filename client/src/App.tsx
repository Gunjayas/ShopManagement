import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { InventoryPage } from './pages/InventoryPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { SalesPage } from './pages/SalesPage';
import { LossEntriesPage } from './pages/LossEntriesPage';
import { BundleProfitabilityPage } from './pages/BundleProfitabilityPage';
import { DeadStockPage } from './pages/DeadStockPage';
import { DiscountLeakagePage } from './pages/DiscountLeakagePage';
import { MonthlyPlPage } from './pages/MonthlyPlPage';
import { MoversPage } from './pages/MoversPage';
import { ReportsPage } from './pages/ReportsPage';
import { TransitLossesReportPage } from './pages/TransitLossesReportPage';

// Route the owner between order workflows and individual inventory pricing.
function App(): ReactNode {
  return <BrowserRouter><AppShell><Routes><Route path="/orders" element={<OrdersPage />} /><Route path="/orders/:id" element={<OrderDetailPage />} /><Route path="/inventory" element={<InventoryPage />} /><Route path="/sales" element={<SalesPage />} /><Route path="/loss-entries" element={<LossEntriesPage />} /><Route path="/reports" element={<ReportsPage />} /><Route path="/reports/monthly-pl" element={<MonthlyPlPage />} /><Route path="/reports/dead-stock" element={<DeadStockPage />} /><Route path="/reports/movers" element={<MoversPage />} /><Route path="/reports/transit-losses" element={<TransitLossesReportPage />} /><Route path="/reports/discount-leakage" element={<DiscountLeakagePage />} /><Route path="/reports/bundle-profitability" element={<BundleProfitabilityPage />} /><Route path="*" element={<Navigate to="/orders" replace />} /></Routes></AppShell></BrowserRouter>;
}

export default App;
