import React, { useEffect, useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { ordersApi } from '../../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const STATUSES = ['placed','confirmed','processing','shipped','out-for-delivery','delivered','cancelled'];

const STATUS_COLORS = {
  placed: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  'out-for-delivery': 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [tracking, setTracking] = useState({ carrier: '', trackingNumber: '' });
  const [updating, setUpdating] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await ordersApi.getAll(params);
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [search, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!newStatus || !selected) return;
    setUpdating(true);
    try {
      await ordersApi.updateStatus(selected._id, {
        status: newStatus,
        tracking: tracking.trackingNumber ? tracking : undefined
      });
      toast.success('Status updated');
      setSelected(null);
      fetchOrders();
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(false); }
  };

  return (
    <AdminSidebar>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-gray-800">Orders</h1>
          <span className="text-sm text-gray-400 font-body">{pagination.total} total</span>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search order, name, phone..."
              className="input pl-9 text-sm py-2"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input text-sm py-2 w-40"
          >
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-body font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-16 text-gray-400 font-body">No orders found</td></tr>
                  ) : orders.map(order => (
                    <tr key={order._id} className="hover:bg-blush-50/20">
                      <td className="px-4 py-3 text-sm font-body font-medium text-blush-700 whitespace-nowrap">#{order.orderId}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-body text-gray-700">{order.customer?.name}</p>
                        <p className="text-xs font-body text-gray-400">{order.customer?.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-body text-gray-600">{order.items?.length}</td>
                      <td className="px-4 py-3 text-sm font-body font-semibold text-gray-700 whitespace-nowrap">
                        ₹{order.pricing?.total?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${order.payment?.method === 'cod' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {order.payment?.method?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-body text-gray-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelected(order); setNewStatus(order.status); setTracking({ carrier: order.tracking?.carrier || '', trackingNumber: order.tracking?.trackingNumber || '' }); }}
                          className="text-xs text-blush-500 hover:text-blush-700 font-body underline">
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(pagination.pages)].map((_, i) => (
              <button key={i} onClick={() => fetchOrders(i + 1)}
                className={`w-8 h-8 rounded-full text-sm font-body transition-colors
                  ${pagination.page === i + 1 ? 'bg-blush-600 text-white' : 'bg-white border border-blush-200 text-gray-600 hover:bg-blush-50'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Update Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="font-body font-semibold text-gray-800 mb-4">Update Order #{selected.orderId}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-600 mb-1.5">Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input capitalize">
                    {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>

                {['shipped', 'out-for-delivery'].includes(newStatus) && (
                  <>
                    <div>
                      <label className="block text-sm font-body font-medium text-gray-600 mb-1.5">Carrier</label>
                      <input value={tracking.carrier} onChange={e => setTracking(t => ({ ...t, carrier: e.target.value }))}
                        placeholder="e.g. Delhivery, DTDC" className="input" />
                    </div>
                    <div>
                      <label className="block text-sm font-body font-medium text-gray-600 mb-1.5">Tracking Number</label>
                      <input value={tracking.trackingNumber} onChange={e => setTracking(t => ({ ...t, trackingNumber: e.target.value }))}
                        placeholder="Tracking number" className="input" />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setSelected(null)} className="btn-outline flex-1 py-2.5">Cancel</button>
                <button onClick={handleUpdateStatus} disabled={updating} className="btn-primary flex-1 py-2.5">
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}
