import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface AppShellProps { children: ReactNode }

// Frame every page with simple navigation between the two daily workspaces.
export function AppShell({ children }: AppShellProps): ReactNode {
  // Highlight the active workspace so navigation remains clear on a small screen.
  const linkClass = ({ isActive }: { isActive: boolean }): string => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`;
  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <NavLink to="/orders" className="text-xl font-bold tracking-tight">Thread & Stock</NavLink>
        <nav className="flex flex-wrap gap-2" aria-label="Main navigation"><NavLink to="/orders" className={linkClass}>Orders</NavLink><NavLink to="/inventory" className={linkClass}>Inventory</NavLink><NavLink to="/sales" className={linkClass}>Sales</NavLink><NavLink to="/loss-entries" className={linkClass}>Losses</NavLink></nav>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
  </div>;
}