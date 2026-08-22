import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit2, X, Package } from 'lucide-react';
import { ordersApi, getImageUrl } from '../../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  const [updateForm, setUpdateForm] = useState({
    status: '',
    tracking_carrier: '',
    tracking_number: ''
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersApi.getAll({ limit: 100 });
      setOrders(res.data.orders);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setUpdateForm({
      status: order.status,
      tracking_carrier: order.tracking_carrier || '',
      tracking_number: order.tracking_number || ''
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await ordersApi.updateStatus(selectedOrder.id, updateForm);
      toast.success('Order updated successfully');
      setIsModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.shipping_address?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track customer orders</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Order ID or Name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blush-300 text-sm bg-white"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blush-300 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out-for-delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 whitespace-nowrap">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center"><Spinner size="md" /></td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{order.shipping_address?.name}</p>
                      <p className="text-xs text-gray-500">{order.shipping_address?.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.items?.reduce((sum, i) => sum + i.quantity, 0)} items
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ₹{parseFloat(order.total).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        order.payment_method === 'cod' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        order.status === 'shipped' || order.status === 'out-for-delivery' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openUpdateModal(order)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 ml-auto">
                        <Edit2 size={12} /> Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !updating && setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl text-gray-900">Update Order</h2>
              <button onClick={() => !updating && setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Order ID</p>
                <p className="font-medium text-gray-900">{selectedOrder.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total</p>
                <p className="font-bold text-gray-900">₹{parseFloat(selectedOrder.total).toLocaleString('en-IN')}</p>
              </div>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Status *</label>
                <select 
                  required
                  value={updateForm.status} 
                  onChange={e => setUpdateForm({...updateForm, status: e.target.value})} 
                  className="input bg-white"
                >
                  <option value="placed">Placed</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="out-for-delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {(updateForm.status === 'shipped' || updateForm.status === 'out-for-delivery' || updateForm.status === 'delivered') && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blush-50 rounded-xl border border-blush-100">
                  <div className="col-span-2"><p className="text-xs font-bold text-blush-800 uppercase tracking-wide">Tracking Information</p></div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Carrier / Courier</label>
                    <input 
                      type="text" 
                      value={updateForm.tracking_carrier} 
                      onChange={e => setUpdateForm({...updateForm, tracking_carrier: e.target.value})} 
                      className="input py-2"
                      placeholder="e.g. BlueDart, Delhivery"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tracking Number</label>
                    <input 
                      type="text" 
                      value={updateForm.tracking_number} 
                      onChange={e => setUpdateForm({...updateForm, tracking_number: e.target.value})} 
                      className="input py-2"
                      placeholder="e.g. 1234567890"
                    />
                  </div>
                </div>
              )}

              <button type="submit" disabled={updating} className="btn-primary w-full py-3 flex justify-center items-center gap-2">
                {updating ? <Spinner size="sm" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
