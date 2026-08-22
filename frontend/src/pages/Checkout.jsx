import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Trash2, X, Tag } from 'lucide-react';
import { useCart } from '../context/AppContext';
import { ordersApi, paymentsApi, couponsApi, getImageUrl } from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export default function Checkout() {
  const { cart, cartTotal, shipping, grandTotal, cartDispatch } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', 
    street: '', city: '', state: '', pincode: ''
  });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    if (cart.length === 0 && !processing) {
      navigate('/products');
      toast.error('Your cart is empty');
    }
  }, [cart, navigate, processing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Valid 10-digit phone required';
    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.pincode.trim() || !/^[0-9]{6}$/.test(formData.pincode)) newErrors.pincode = 'Valid 6-digit pincode required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await couponsApi.validate(couponCode, cartTotal);
      setAppliedCoupon({
        code: res.data.code,
        discountAmount: res.data.discount
      });
      setCouponCode('');
      toast.success('Coupon applied!');
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const finalTotal = appliedCoupon ? Math.max(0, grandTotal - appliedCoupon.discountAmount) : grandTotal;

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return toast.error('Please fix the errors in the delivery details');
    }

    setProcessing(true);

    try {
      // 1. Prepare items
      const items = cart.map(item => ({
        product_id: item.id,
        name: item.name,
        price: parseFloat(item.discount_price || item.price),
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
        image: item.images?.[0]?.url || null
      }));

      // 2. Create Order in backend
      const orderPayload = {
        items,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email,
        address_street: formData.street,
        address_city: formData.city,
        address_state: formData.state,
        address_pincode: formData.pincode,
        payment_method: paymentMethod,
        subtotal: cartTotal,
        shipping_fee: shipping,
        discount: appliedCoupon ? appliedCoupon.discountAmount : 0,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        total: finalTotal
      };

      const orderRes = await ordersApi.create(orderPayload);
      const orderId = orderRes.data.order_id;

      // 3. Handle Payment Method
      if (paymentMethod === 'cod') {
        cartDispatch({ type: 'CLEAR' });
        navigate(`/order-success/${orderId}`);
        return;
      }

      if (paymentMethod === 'razorpay') {
        // Create Razorpay order
        const rzpOrderRes = await paymentsApi.createOrder({ orderId });
        const { id: rzpOrderId, amount, currency } = rzpOrderRes.data;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_stub', 
          amount,
          currency,
          name: "Vino'z Fashion",
          description: `Order ${orderId}`,
          order_id: rzpOrderId,
          handler: async function (response) {
            try {
              // Immediately disable processing flag isn't strictly needed as we show a loading toast and redirect, 
              // but keeping processing=true prevents re-clicking background elements if modal closes weirdly.
              toast.loading('Verifying payment...', { id: 'verify' });
              await paymentsApi.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId
              });
              toast.success('Payment successful!', { id: 'verify' });
              cartDispatch({ type: 'CLEAR' });
              navigate(`/order-success/${orderId}`);
            } catch (err) {
              toast.error(err.response?.data?.error || 'Payment verification failed', { id: 'verify' });
              setProcessing(false);
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone
          },
          theme: { color: "#c9748f" },
          modal: {
            ondismiss: function() {
              toast.error('Payment cancelled by user');
              setProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error(response.error.description || 'Payment failed');
          setProcessing(false);
        });
        rzp.open();
      }

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to place order. Please try again.');
      setProcessing(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="font-display text-3xl md:text-4xl text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Delivery Details */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="font-display text-2xl text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blush-100 text-blush-600 flex items-center justify-center text-sm font-bold">1</span>
                Delivery Details
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={`input ${errors.name ? 'border-red-300 focus:ring-red-200' : ''}`} placeholder="Jane Doe" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`input ${errors.phone ? 'border-red-300 focus:ring-red-200' : ''}`} placeholder="10-digit mobile number" maxLength={10} />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Optional)</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" placeholder="For order tracking updates" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address / Area *</label>
                  <input type="text" name="street" value={formData.street} onChange={handleChange} className={`input ${errors.street ? 'border-red-300 focus:ring-red-200' : ''}`} placeholder="House no, Building, Street, Area" />
                  {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={`input ${errors.city ? 'border-red-300 focus:ring-red-200' : ''}`} />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <select name="state" value={formData.state} onChange={handleChange} className={`input bg-white ${errors.state ? 'border-red-300 focus:ring-red-200' : ''}`}>
                      <option value="">Select State</option>
                      {STATES.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={`input ${errors.pincode ? 'border-red-300 focus:ring-red-200' : ''}`} maxLength={6} />
                    {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="font-display text-2xl text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blush-100 text-blush-600 flex items-center justify-center text-sm font-bold">2</span>
                Payment Method
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-xl border-blush-600 bg-blush-50">
                  <input type="radio" name="payment" checked={true} readOnly className="w-4 h-4 text-blush-600 focus:ring-blush-500" />
                  <div className="ml-3 flex-1">
                    <span className="block text-sm font-medium text-gray-900">Pay Online (UPI, Cards, NetBanking)</span>
                  </div>
                  <span className="badge bg-blush-600 text-white shadow-sm px-3">Secure</span>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column - Summary (Sticky) */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="font-display text-2xl text-gray-800 mb-6">Order Summary</h2>
              
              {/* Items list */}
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <img src={getImageUrl(item.images?.[0]?.url)} alt={item.name} className="w-16 h-20 object-cover rounded-lg bg-gray-50 shrink-0" />
                    <div className="flex-1 py-1">
                      <h4 className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</h4>
                      <div className="text-xs text-gray-500 mt-1 flex gap-2">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: <span className="capitalize">{item.color}</span></span>}
                        <span>Qty: {item.quantity}</span>
                      </div>
                      <div className="font-medium text-gray-900 mt-1">₹{parseFloat(item.discount_price || item.price).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="mb-6 pt-6 border-t border-gray-100">
                {appliedCoupon ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-green-700">
                      <Tag size={16} />
                      <span className="text-sm font-medium">{appliedCoupon.code} applied</span>
                    </div>
                    <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 p-1">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={couponCode} 
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Have a coupon code?" 
                        className="input"
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="bg-gray-900 text-white px-4 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                      >
                        {validatingCoupon ? <Spinner size="sm" /> : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 text-sm pt-6 border-t border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">FREE</span>
                  ) : (
                    <span className="font-medium text-gray-900">₹50</span>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
                  <span className="font-medium text-gray-800">Total</span>
                  <span className="font-display text-2xl text-blush-600 font-bold">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                disabled={processing}
                className="w-full btn-primary py-4 text-lg mt-8 flex items-center justify-center gap-2 shadow-lg shadow-blush-200"
              >
                {processing ? <Spinner size="sm" /> : (
                  <>
                    <Lock size={18} /> Place Order
                  </>
                )}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                <ShieldCheck size={14} className="text-green-500" />
                Payments are 100% secure & encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
