import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../context/AppContext';
import { getImageUrl } from '../../utils/api';

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, cartDispatch, cartTotal, shipping, grandTotal } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openCart', handleOpen);
    return () => window.removeEventListener('openCart', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  const amountNeededForFreeShipping = 500 - cartTotal;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-blush-600" size={20} />
            <h2 className="font-display text-xl text-gray-800">Your Cart</h2>
            <span className="bg-blush-100 text-blush-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {cart.length} item{cart.length !== 1 && 's'}
            </span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
              <div className="w-24 h-24 bg-blush-50 rounded-full flex items-center justify-center mb-2">
                <ShoppingBag size={40} className="text-blush-200" />
              </div>
              <h3 className="font-display text-xl text-gray-800">Your cart is empty</h3>
              <p className="text-gray-500 text-sm">Looks like you haven't added anything yet.</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="btn-primary mt-4"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => {
                const imgUrl = item.images?.[0]?.url || item.images?.[0];
                const price = parseFloat(item.discount_price || item.price);
                return (
                  <div key={`${item.id}-${index}`} className="flex gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    {/* Image */}
                    <Link to={`/product/${item.slug}`} onClick={() => setIsOpen(false)} className="shrink-0">
                      <img 
                        src={getImageUrl(imgUrl) || 'https://via.placeholder.com/80'} 
                        alt={item.name} 
                        className="w-20 h-24 object-cover rounded-lg bg-gray-50"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link to={`/product/${item.slug}`} onClick={() => setIsOpen(false)}>
                            <h4 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug hover:text-blush-600">
                              {item.name}
                            </h4>
                          </Link>
                          <button 
                            onClick={() => cartDispatch({ type: 'REMOVE', id: item.id, size: item.size, color: item.color })}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        {(item.size || item.color) && (
                          <div className="text-xs text-gray-500 mt-1 flex gap-2">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: <span className="capitalize">{item.color}</span></span>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="font-medium text-blush-600">
                          ₹{price.toLocaleString('en-IN')}
                        </div>
                        
                        {/* Stepper */}
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 h-8">
                          <button 
                            onClick={() => cartDispatch({ type: 'UPDATE_QTY', id: item.id, size: item.size, color: item.color, quantity: item.quantity - 1 })}
                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-gray-800">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => cartDispatch({ type: 'UPDATE_QTY', id: item.id, size: item.size, color: item.color, quantity: item.quantity + 1 })}
                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30"
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 bg-white p-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-800">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Shipping</span>
                {shipping === 0 ? (
                  <span className="text-green-600 font-medium">FREE</span>
                ) : (
                  <div className="text-right">
                    <span className="font-medium text-gray-800">₹50</span>
                    {amountNeededForFreeShipping > 0 && (
                      <p className="text-[10px] text-blush-600 mt-0.5">Add ₹{amountNeededForFreeShipping} more for free shipping!</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="font-medium text-gray-800">Total</span>
              <span className="font-display text-2xl text-blush-600 font-bold">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button onClick={handleCheckout} className="btn-primary w-full py-4 text-lg shadow-md shadow-blush-200">
                Proceed to Checkout
              </button>
              <button 
                onClick={() => cartDispatch({ type: 'CLEAR' })}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium tracking-wide uppercase self-center py-2"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
