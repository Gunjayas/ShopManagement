import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Boxes, CircleDollarSign, PackageSearch, ReceiptText } from 'lucide-react';

interface AppShellProps { children: ReactNode }

// Frame every page with simple navigation between the two daily workspaces.
export function AppShell({ children }: AppShellProps): ReactNode {
  // Highlight the active workspace so navigation remains clear on a small screen.
  const linkClass = ({ isActive }: { isActive: boolean }): string => `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold sm:flex-initial sm:flex-row sm:px-3 sm:text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`;
  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <NavLink to="/orders" className="text-xl font-bold tracking-tight">Thread & Stock</NavLink>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 border-t border-slate-200 bg-white px-2 py-2 sm:static sm:flex-wrap sm:border-0 sm:p-0" aria-label="Main navigation"><NavLink to="/orders" className={linkClass}><Boxes className="size-4" />Orders</NavLink><NavLink to="/inventory" className={linkClass}><PackageSearch className="size-4" />Inventory</NavLink><NavLink to="/sales" className={linkClass}><CircleDollarSign className="size-4" />Sales</NavLink><NavLink to="/loss-entries" className={linkClass}><ReceiptText className="size-4" />Losses</NavLink><NavLink to="/reports" className={linkClass}><BarChart3 className="size-4" />Reports</NavLink></nav>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:py-8">{children}</main>
  </div>;
}