import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OrderSuccess() {
  const { orderId } = useParams();

  useEffect(() => {
    // Fire confetti on mount
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#c9748f', '#e8a4b8', '#a8516e']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#c9748f', '#e8a4b8', '#a8516e']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 bg-gray-50/50">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 max-w-lg w-full text-center animate-slide-up">
        
        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>

        <h1 className="font-display text-4xl text-gray-900 mb-4">Order Placed! 🎉</h1>
        
        <p className="text-gray-600 mb-6 font-body text-lg">
          Thank you for shopping with us. Your order has been received and is being processed.
        </p>

        <div className="bg-blush-50 border border-blush-100 rounded-2xl p-6 mb-8">
          <p className="text-sm text-blush-700 font-bold uppercase tracking-wide mb-1">Order ID</p>
          <p className="font-display text-2xl text-blush-900 font-bold">{orderId}</p>
        </div>

        <p className="text-sm text-gray-500 mb-10">
          We'll send you an email confirmation with order details and tracking info shortly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/track-order" className="btn-outline flex items-center justify-center gap-2">
            Track Order
          </Link>
          <Link to="/products" className="btn-primary flex items-center justify-center gap-2">
            Continue Shopping <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
