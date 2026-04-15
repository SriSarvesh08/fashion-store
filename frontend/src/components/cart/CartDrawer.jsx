import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../context/AppContext';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80&h=80&fit=crop';

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, cartDispatch, cartTotal, cartCount, shipping, grandTotal } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener('openCart', open);
    return () => window.removeEventListener('openCart', open);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl
        transform transition-transform duration-300 ease-out flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blush-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-blush-600" />
            <h2 className="font-display text-lg text-gray-800">Your Cart</h2>
            {cartCount > 0 && (
              <span className="bg-blush-100 text-blush-700 text-xs font-body px-2 py-0.5 rounded-full">{cartCount}</span>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-blush-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="text-blush-300" />
              </div>
              <p className="font-display text-lg text-gray-700 mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-400 font-body mb-6">Explore our beautiful collection</p>
              <Link
                to="/products"
                onClick={() => setIsOpen(false)}
                className="btn-primary text-sm"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, idx) => (
                <div key={`${item._id}-${item.size}-${item.color}-${idx}`}
                  className="flex gap-3 pb-4 border-b border-blush-50 last:border-0 animate-slide-up">
                  <img
                    src={item.images?.[0]?.url || PLACEHOLDER}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl flex-shrink-0 bg-blush-50"
                    onError={e => { e.target.src = PLACEHOLDER; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-gray-800 truncate">{item.name}</p>
                    {(item.size || item.color) && (
                      <p className="text-xs text-gray-400 font-body">
                        {[item.size, item.color].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="text-sm font-body font-semibold text-blush-600 mt-0.5">
                      ₹{((item.discountPrice || item.price) * item.quantity).toLocaleString('en-IN')}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-blush-200 rounded-lg">
                        <button
                          onClick={() => cartDispatch({ type: 'UPDATE_QTY', id: item._id, size: item.size, color: item.color, quantity: item.quantity - 1 })}
                          className="p-1 text-gray-500 hover:text-blush-600 disabled:opacity-30"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-sm font-body font-medium text-gray-700">{item.quantity}</span>
                        <button
                          onClick={() => cartDispatch({ type: 'UPDATE_QTY', id: item._id, size: item.size, color: item.color, quantity: item.quantity + 1 })}
                          className="p-1 text-gray-500 hover:text-blush-600"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => cartDispatch({ type: 'REMOVE', id: item._id, size: item.size, color: item.color })}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-blush-100 px-5 py-4 space-y-3 bg-blush-50/50">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-body text-gray-500">
                <span>Subtotal</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className={shipping === 0 ? 'text-green-600' : 'text-gray-500'}>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                  {shipping === 0 ? 'FREE 🎉' : `₹${shipping}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-blush-500 font-body">
                  Add ₹{(500 - cartTotal).toLocaleString('en-IN')} more for free shipping
                </p>
              )}
              <div className="flex justify-between font-body font-semibold text-gray-800 pt-1 border-t border-blush-200">
                <span>Total</span>
                <span className="text-blush-700">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button onClick={handleCheckout} className="btn-primary w-full text-center">
              Proceed to Checkout
            </button>
            <button
              onClick={() => cartDispatch({ type: 'CLEAR' })}
              className="w-full text-xs text-gray-400 hover:text-gray-600 font-body text-center py-1"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
