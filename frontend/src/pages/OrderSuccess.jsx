// ─── OrderSuccess.jsx ─────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { ordersApi } from '../utils/api';

export function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    ordersApi.track(orderId).then(res => setOrder(res.data)).catch(() => {});
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="font-display text-3xl text-gray-800 mb-2">Order Placed! 🎉</h1>
        <p className="text-gray-500 font-body mb-6">Thank you! Your order has been confirmed.</p>

        <div className="card p-6 mb-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 font-body">Order ID</p>
            <p className="font-body font-bold text-blush-700 text-lg">#{orderId}</p>
          </div>
          {order && (
            <>
              <div className="flex justify-between text-sm font-body text-gray-500 mb-1">
                <span>Payment</span>
                <span className="capitalize font-medium text-gray-700">
                  {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-body text-gray-500">
                <span>Total</span>
                <span className="font-semibold text-blush-700">₹{order.pricing?.total?.toLocaleString('en-IN')}</span>
              </div>
              {order.customer?.email && (
                <p className="text-xs text-gray-400 font-body mt-4 text-center">
                  Confirmation sent to {order.customer.email}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Link to="/track-order" className="btn-outline flex items-center gap-2">
            <Package size={16} /> Track Order
          </Link>
          <Link to="/products" className="btn-primary flex items-center gap-2">
            Shop More <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
