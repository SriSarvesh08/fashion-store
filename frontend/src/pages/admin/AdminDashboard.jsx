import React, { useState, useEffect } from 'react';
import { IndianRupee, ShoppingBag, Clock, CheckCircle2, TrendingUp, Package } from 'lucide-react';
import { adminApi, getImageUrl } from '../../utils/api';
import Spinner from '../../components/common/Spinner';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminApi.dashboard();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Spinner size="lg" /></div>;
  if (error) return <div className="p-10 text-red-500 bg-red-50 rounded-xl m-8">{error}</div>;
  if (!data) return null;

  const { stats, recentOrders, revenueChart } = data;

  const statCards = [
    { title: 'Total Revenue', value: `₹${parseFloat(stats.totalRevenue).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Today\'s Revenue', value: `₹${parseFloat(stats.todayRevenue).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-blush-600', bg: 'bg-blush-100' },
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Today\'s Orders', value: stats.todayOrders, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'Active Products', value: stats.activeProducts, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-100' },
  ];

  // Find max revenue for chart scaling
  const maxRev = Math.max(...revenueChart.map(d => parseFloat(d.revenue)), 1);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      
      <div>
        <h1 className="font-display text-3xl text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{stat.title}</p>
                <h3 className="font-display text-2xl text-gray-900">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart (Pure CSS) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-xl text-gray-800 mb-8">Revenue (Last 7 Days)</h2>
          
          <div className="flex items-end justify-between h-64 gap-2 pb-2">
            {revenueChart.map((day, idx) => {
              const rev = parseFloat(day.revenue);
              const heightPct = (rev / maxRev) * 100;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  <div className="w-full relative flex justify-center items-end h-full">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                      ₹{rev.toLocaleString('en-IN')}
                    </div>
                    {/* Bar */}
                    <div 
                      className="w-full max-w-[40px] bg-blush-200 group-hover:bg-blush-500 rounded-t-sm transition-all duration-500 ease-out"
                      style={{ height: `${Math.max(heightPct, 2)}%` }} // min height 2% for visibility
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-3 rotate-45 md:rotate-0 origin-left whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl text-gray-800">Recent Orders</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-10">No recent orders</p>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {order.items && order.items.length > 0 && (
                        <img src={getImageUrl(order.items[0].image)} alt="Item" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.id}</p>
                      <p className="text-xs text-gray-500">{order.shipping_address?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">₹{parseFloat(order.total).toLocaleString('en-IN')}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
