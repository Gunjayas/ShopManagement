import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const reportLinks = [
  { path: '/reports/monthly-pl', name: 'Monthly P&L', description: 'True profit after fees and transit losses.' },
  { path: '/reports/dead-stock', name: 'Dead Stock', description: 'Units waiting too long to sell.' },
  { path: '/reports/movers', name: 'Fastest / Slowest Movers', description: 'See which designs sell fastest.' },
  { path: '/reports/transit-losses', name: 'Transit Loss', description: 'Losses, recoveries, and net impact.' },
  { path: '/reports/discount-leakage', name: 'Discount Leakage', description: 'Sales value given up below listed price.' },
  { path: '/reports/bundle-profitability', name: 'Bundle Profitability', description: 'Profit and loss history for every bundle.' },
];

// Give the owner a simple starting point for choosing one of the six business reports.
export function ReportsPage(): ReactNode {
  return <section className="grid gap-6"><div><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Business insight</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Reports</h1><p className="mt-2 text-slate-600">Choose a report to understand what is selling and where money is being lost.</p></div><div className="grid gap-3 sm:grid-cols-2">{reportLinks.map((report) => <Link key={report.path} to={report.path} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"><h2 className="font-semibold">{report.name}</h2><p className="mt-1 text-sm text-slate-500">{report.description}</p><p className="mt-4 text-sm font-semibold text-slate-900">Open report →</p></Link>)}</div></section>;
}