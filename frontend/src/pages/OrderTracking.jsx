import React, { useState } from 'react';
import { Package, Search, Truck, CheckCircle, Circle, Clock } from 'lucide-react';
import { ordersApi } from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['placed', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered'];
const STATUS_LABELS = {
  placed: 'Order Placed', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', 'out-for-delivery': 'Out for Delivery', delivered: 'Delivered'
};

export default function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) { toast.error('Enter order ID'); return; }
    setLoading(true);
    try {
      const res = await ordersApi.track(orderId.trim(), phone.trim());
      setOrder(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order not found');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={28} className="text-blush-600" />
        </div>
        <h1 className="font-display text-3xl text-gray-800 mb-2">Track Your Order</h1>
        <p className="text-gray-500 font-body">Enter your order ID to check the status</p>
      </div>

      <form onSubmit={handleTrack} className="card p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">Order ID</label>
            <input
              value={orderId}
              onChange={e => setOrderId(e.target.value.toUpperCase())}
              placeholder="e.g. VNZ-12345678"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">Phone (optional, for security)</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Registered phone number"
              className="input"
              type="tel"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <Search size={16} />
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </div>
      </form>

      {order && (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-400 font-body">Order ID</p>
              <p className="font-body font-bold text-blush-700 text-xl">#{order.orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 font-body">Total</p>
              <p className="font-body font-semibold text-gray-700">₹{order.pricing?.total?.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Status Timeline */}
          {order.status !== 'cancelled' ? (
            <div className="mb-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-blush-100" />
                <div
                  className="absolute top-4 left-4 h-0.5 bg-blush-500 transition-all duration-500"
                  style={{ width: `${currentStep > 0 ? (currentStep / (STATUS_STEPS.length - 1)) * 100 : 0}%` }}
                />
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const current = i === currentStep;
                  return (
                    <div key={step} className="relative flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                        ${done ? 'bg-blush-500' : 'bg-blush-100'}`}>
                        {done ? <CheckCircle size={16} className="text-white" /> : <Circle size={16} className="text-blush-300" />}
                      </div>
                      <p className={`text-[10px] font-body mt-1.5 text-center max-w-[60px] leading-tight
                        ${current ? 'text-blush-700 font-semibold' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                        {STATUS_LABELS[step]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-body font-medium text-red-600">❌ This order has been cancelled</p>
            </div>
          )}

          {/* Tracking number */}
          {order.tracking?.trackingNumber && (
            <div className="bg-blush-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-blush-500" />
                <div>
                  <p className="text-sm font-body font-medium text-gray-700">Tracking Number</p>
                  <p className="text-sm text-blush-600 font-body">{order.tracking.trackingNumber}</p>
                  {order.tracking.carrier && <p className="text-xs text-gray-400 font-body">via {order.tracking.carrier}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Customer info */}
          <div className="border-t border-blush-100 pt-4">
            <p className="text-sm font-body font-medium text-gray-700 mb-1">{order.customer?.name}</p>
            <p className="text-xs text-gray-400 font-body">
              {order.customer?.address?.street}, {order.customer?.address?.city},&nbsp;
              {order.customer?.address?.state} - {order.customer?.address?.pincode}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
