import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, RotateCcw,
  Tag, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

const nav = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { path: '/admin/coupons', label: 'Coupons', icon: Tag },
];

export default function AdminSidebar({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('vnz_admin_token');
    navigate('/admin/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      <div className="px-5 py-5 border-b border-gray-100">
        <h1 className="font-display text-lg text-blush-700">Vino'z <span className="italic">Fashion</span></h1>
        <p className="text-xs text-gray-400 font-body">Admin Panel</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-colors
                ${active ? 'bg-blush-50 text-blush-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}>
              <Icon size={17} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-blush-400" />}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-body text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 flex-shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="relative w-56 flex flex-col bg-white z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-600">
            <Menu size={20} />
          </button>
          <h2 className="font-display text-base text-blush-700">Admin</h2>
          <button onClick={logout} className="p-2 text-gray-400">
            <LogOut size={18} />
          </button>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
