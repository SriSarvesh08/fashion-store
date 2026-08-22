import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, RefreshCcw, Tag, LogOut, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/coupons', label: 'Coupons', icon: Tag },
];

export default function AdminSidebar({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('vnz_admin_token');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-display text-2xl text-blush-700 leading-none">
          Vino'z <span className="italic">Admin</span>
        </h2>
        <p className="text-[10px] tracking-widest text-gray-400 mt-1 uppercase font-body">Management Portal</p>
      </div>

      <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
        {NAV_LINKS.map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path || (link.path !== '/admin' && location.pathname.startsWith(link.path));
          return (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-blush-50 text-blush-700 font-medium border border-blush-100/50' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-blush-600' : 'text-gray-400'} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <aside className="w-72 max-w-[80vw] h-full relative z-10 animate-slide-in">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 -right-12 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-100 h-16 flex items-center px-4 shrink-0 shadow-sm sticky top-0 z-50">
          <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <Menu size={24} />
          </button>
          <h2 className="font-display text-xl text-blush-700 ml-2">
            Vino'z <span className="italic text-gray-500">Admin</span>
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
