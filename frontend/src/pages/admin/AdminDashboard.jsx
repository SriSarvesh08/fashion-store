import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingBag, Package, Clock, IndianRupee, ChevronRight } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminApi } from '../../utils/api';
import Spinner from '../../components/common/Spinner';

const STATUS_COLORS = {
  placed: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  'out-for-delivery': 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminSidebar><div className="flex justify-center py-20"><Spinner size="lg" /></div></AdminSidebar>;

  const { stats = {}, recentOrders = [], dailyRevenue = [] } = data || {};

  const statCards = [
    { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-blush-600', bg: 'bg-blush-50' },
    { label: "Today's Revenue", value: `₹${(stats.todayRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Orders', value: stats.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Orders', value: stats.pendingOrders || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Active Products', value: stats.totalProducts || 0, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: "Today's Orders", value: stats.todayOrders || 0, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <AdminSidebar>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-400 font-body">Welcome back to Vino'z Fashion</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-body text-gray-400 uppercase tracking-wide">{label}</p>
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={15} className={color} />
                </div>
              </div>
              <p className="font-display text-xl md:text-2xl text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="card overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-body font-semibold text-gray-700">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-blush-600 font-body flex items-center gap-1 hover:gap-2 transition-all">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Order ID', 'Customer', 'Total', 'Payment', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-body font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400 font-body text-sm">No orders yet</td></tr>
                ) : recentOrders.map(order => (
                  <tr key={order._id} className="hover:bg-blush-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-body font-medium text-blush-700">#{order.orderId}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-body text-gray-700">{order.customer?.name}</p>
                      <p className="text-xs font-body text-gray-400">{order.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-body font-semibold text-gray-700">
                      ₹{order.pricing?.total?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${order.payment?.method === 'cod' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {order.payment?.method === 'cod' ? 'COD' : 'Online'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/admin/orders" className="text-xs text-blush-500 hover:text-blush-700 font-body">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue chart (simple bar chart) */}
        {dailyRevenue.length > 0 && (
          <div className="card p-5">
            <h2 className="font-body font-semibold text-gray-700 mb-4">Revenue – Last 7 Days</h2>
            <div className="flex items-end gap-2 h-32">
              {dailyRevenue.map((d, i) => {
                const maxRev = Math.max(...dailyRevenue.map(x => x.revenue), 1);
                const heightPct = (d.revenue / maxRev) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-xs text-gray-400 font-body">{d.revenue ? `₹${(d.revenue/1000).toFixed(1)}k` : '—'}</p>
                    <div className="w-full bg-blush-100 rounded-t-md relative" style={{ height: `${Math.max(heightPct, 4)}%` }}>
                      <div className="absolute inset-0 bg-blush-400 rounded-t-md" />
                    </div>
                    <p className="text-[10px] text-gray-400 font-body">{d._id?.slice(5)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}
