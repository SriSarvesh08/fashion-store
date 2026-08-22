import React, { useState } from 'react';
import { Search, Package, CheckCircle, Truck, MapPin, XCircle } from 'lucide-react';
import { ordersApi, getImageUrl } from '../utils/api';
import Spinner from '../components/common/Spinner';

const STEPS = [
  { id: 'placed', label: 'Order Placed', icon: Package },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'out-for-delivery', label: 'Out for Delivery', icon: MapPin },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle }
];

export default function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    
    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      const res = await ordersApi.track(orderId.trim(), phone.trim());
      setOrderData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 min-h-[70vh]">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl text-gray-900 mb-4">Track Your Order</h1>
        <p className="text-gray-500">Enter your order ID to see real-time updates.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-10">
        <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Order ID *</label>
            <input 
              type="text" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. ORD-12345678" 
              className="input uppercase"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Used for verification if provided" 
              className="input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary h-[46px] w-full md:w-auto px-8 shrink-0">
            {loading ? <Spinner size="sm" /> : <span className="flex items-center gap-2"><Search size={18}/> Track</span>}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-4 text-center bg-red-50 py-2 rounded-lg">{error}</p>}
      </div>

      {orderData && (
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 animate-slide-up">
          
          <div className="flex flex-col md:flex-row justify-between gap-6 mb-10 pb-8 border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-500 mb-1">Order #{orderData.id}</p>
              <h2 className="font-display text-2xl text-gray-900">Total: ₹{parseFloat(orderData.total).toLocaleString('en-IN')}</h2>
            </div>
            {orderData.status === 'cancelled' && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
                <XCircle size={20} /> Order Cancelled
              </div>
            )}
            {orderData.status !== 'cancelled' && orderData.tracking_number && (
              <div className="bg-blush-50 text-blush-800 px-5 py-3 rounded-xl border border-blush-100">
                <p className="text-xs uppercase tracking-wider font-bold mb-1">{orderData.tracking_carrier}</p>
                <p className="font-medium tracking-wide">{orderData.tracking_number}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          {orderData.status !== 'cancelled' ? (
            <div className="relative mb-12 py-4">
              {/* Desktop timeline line */}
              <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0"></div>
              
              <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-0 relative z-10">
                {STEPS.map((step, idx) => {
                  const currentIdx = STEPS.findIndex(s => s.id === orderData.status);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-3 text-center group">
                      <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors duration-500 border-4 shadow-sm ${
                        isCurrent 
                          ? 'bg-blush-600 text-white border-blush-200' 
                          : isCompleted 
                            ? 'bg-white text-blush-600 border-blush-600' 
                            : 'bg-white text-gray-300 border-gray-100'
                      }`}>
                        <Icon size={24} strokeWidth={isCompleted ? 2.5 : 2} />
                      </div>
                      <span className={`font-medium text-sm md:text-base ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mb-12">
              <p>This order was cancelled. Please contact support if you need assistance.</p>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-display text-xl text-gray-900 mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {orderData.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-16 h-20 object-cover rounded-lg bg-gray-50 border border-gray-100" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Qty: {item.quantity} 
                        {item.size && ` | Size: ${item.size}`} 
                        {item.color && ` | Color: ${item.color}`}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">₹{parseFloat(item.price).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-display text-xl text-gray-900 mb-4">Delivery Address</h3>
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="font-medium text-gray-900">{orderData.shipping_address.name}</p>
                <p className="text-gray-600 text-sm mt-2">{orderData.shipping_address.street}</p>
                <p className="text-gray-600 text-sm">{orderData.shipping_address.city}, {orderData.shipping_address.state}</p>
                <p className="text-gray-600 text-sm">{orderData.shipping_address.pincode}</p>
                <p className="text-gray-600 text-sm mt-3 pt-3 border-t border-gray-200">📞 {orderData.shipping_address.phone}</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
