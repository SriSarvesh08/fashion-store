import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ChevronDown, Tag, X } from 'lucide-react';
import { useCart } from '../context/AppContext';
import { ordersApi, paymentsApi, couponsApi, getImageUrl } from '../utils/api';
import toast from 'react-hot-toast';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry'];

const PLACEHOLDER = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80&h=80&fit=crop';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal, shipping, grandTotal, cartDispatch } = useCart();
  const [paymentMethod] = useState('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    street: '', city: '', state: 'Tamil Nadu', pincode: ''
  });
  const [errors, setErrors] = useState({});

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="font-display text-2xl text-gray-400 mb-4">Your cart is empty</p>
        <button onClick={() => navigate('/products')} className="btn-primary">Browse Products</button>
      </div>
    );
  }

  const discount = couponApplied?.discount || 0;
  const finalTotal = grandTotal - discount;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Valid 10-digit phone required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.street.trim()) e.street = 'Address required';
    if (!form.city.trim()) e.city = 'City required';
    if (!form.state) e.state = 'State required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Valid 6-digit pincode required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponsApi.validate(couponCode, cartTotal);
      setCouponApplied(res.data);
      toast.success(`Coupon applied! Saved ₹${res.data.discount}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const buildOrderPayload = () => ({
    customer: {
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode }
    },
    items: cart.map(i => ({
      product: i._id,
      quantity: i.quantity,
      size: i.size,
      color: i.color
    })),
    payment: { method: paymentMethod },
    couponCode: couponApplied?.code
  });



  const handleRazorpay = async () => {
    if (!validate()) { toast.error('Please fill all required fields'); return; }
    setPlacing(true);

    try {
      // 1. Create order in DB
      const orderRes = await ordersApi.create(buildOrderPayload());
      const { orderId, _id: orderDbId, total } = orderRes.data;

      // 2. Create Razorpay order
      const rzpRes = await paymentsApi.createOrder({ amount: total, receipt: orderId });
      const { orderId: rzpOrderId, keyId } = rzpRes.data;

      // 3. Open Razorpay checkout
      const options = {
        key: keyId,
        amount: total * 100,
        currency: 'INR',
        name: "Vino'z Fashion",
        description: `Order #${orderId}`,
        order_id: rzpOrderId,
        prefill: {
          name: form.name,
          contact: form.phone,
          email: form.email || ''
        },
        theme: { color: '#c9748f' },
        handler: async (response) => {
          try {
            await paymentsApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId
            });
            cartDispatch({ type: 'CLEAR' });
            navigate(`/order-success/${orderId}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            toast('Payment cancelled', { icon: '⚠️' });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment initialization failed');
      setPlacing(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '', half = false) => (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">
        {label} {['name','phone','street','city','pincode'].includes(key) && <span className="text-blush-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => { setForm(f => ({...f, [key]: e.target.value})); setErrors(er => ({...er, [key]: ''})); }}
        placeholder={placeholder}
        className={`input ${errors[key] ? 'border-red-400 ring-1 ring-red-400' : ''}`}
      />
      {errors[key] && <p className="text-xs text-red-500 font-body mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="font-display text-2xl md:text-3xl text-gray-800 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Form ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Delivery Info */}
          <div className="card p-6">
            <h2 className="font-body font-semibold text-gray-700 mb-4">Delivery Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {field('name', 'Full Name', 'text', 'Your name')}
              {field('phone', 'Phone', 'tel', '10-digit mobile', true)}
              {field('email', 'Email (optional)', 'email', 'For order updates', true)}
              {field('street', 'Street Address', 'text', 'House no., Street, Area')}
              {field('city', 'City', 'text', 'City', true)}
              <div>
                <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">State <span className="text-blush-500">*</span></label>
                <select
                  value={form.state}
                  onChange={e => setForm(f => ({...f, state: e.target.value}))}
                  className="input"
                >
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {field('pincode', 'Pincode', 'text', '6-digit pincode')}
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6">
            <h2 className="font-body font-semibold text-gray-700 mb-4">Payment Method</h2>
            <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-blush-500 bg-blush-50">
              <div className="w-3 h-3 rounded-full bg-blush-500" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-body font-medium text-gray-700 text-sm">Online Payment</span>
                  <span className="badge bg-green-100 text-green-700">Secure</span>
                </div>
                <p className="text-xs text-gray-400 font-body">UPI, Card, Net Banking via Razorpay</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Order Summary ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 sticky top-24">
            <h2 className="font-body font-semibold text-gray-700 mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {cart.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <img src={getImageUrl(item.images?.[0]?.url) || PLACEHOLDER} alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0 bg-blush-50"
                    onError={e => { e.target.src = PLACEHOLDER; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-medium text-gray-700 line-clamp-2">{item.name}</p>
                    {item.size && <p className="text-xs text-gray-400 font-body">Size: {item.size}</p>}
                    {item.color && <p className="text-xs text-gray-400 font-body">Color: {item.color}</p>}
                    <p className="text-xs font-body text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-body font-semibold text-gray-700 flex-shrink-0">
                    ₹{((item.discountPrice || item.price) * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-blush-100 pt-4 mb-4">
              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-green-600" />
                    <span className="text-sm font-body font-medium text-green-700">{couponApplied.code}</span>
                    <span className="text-xs text-green-600 font-body">-₹{couponApplied.discount}</span>
                  </div>
                  <button onClick={() => { setCouponApplied(null); setCouponCode(''); }} className="text-gray-400 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="input text-sm py-2 flex-1"
                    onKeyDown={e => e.key === 'Enter' && handleCoupon()}
                  />
                  <button onClick={handleCoupon} disabled={couponLoading}
                    className="btn-outline text-sm py-2 px-4">
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-blush-100 pt-4">
              <div className="flex justify-between text-sm font-body text-gray-500">
                <span>Subtotal</span><span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm font-body text-green-600">
                  <span>Coupon Discount</span><span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-body">
                <span className={shipping === 0 ? 'text-green-600' : 'text-gray-500'}>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600' : 'text-gray-500'}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between font-body font-bold text-base border-t border-blush-100 pt-2 mt-2">
                <span>Total</span>
                <span className="text-blush-700">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handleRazorpay}
              disabled={placing}
              className="btn-primary w-full mt-5 py-4 flex items-center justify-center gap-2 text-base"
            >
              {placing ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing...</span>
              ) : (
                <>
                  <Lock size={16} />
                  Pay ₹{finalTotal.toLocaleString('en-IN')}
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 font-body mt-3 flex items-center justify-center gap-1">
              <Lock size={11} /> Secured by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
