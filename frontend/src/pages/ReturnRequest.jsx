import React, { useState } from 'react';
import { RefreshCcw, Search, CheckCircle2 } from 'lucide-react';
import { ordersApi, returnsApi } from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

export default function ReturnRequest() {
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  
  const [returnForm, setReturnForm] = useState({
    type: 'return',
    reason: '',
    description: '',
    exchange_for: ''
  });
  const [submittedReturnId, setSubmittedReturnId] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!orderId || !phone) return;
    
    setLoading(true);
    try {
      const res = await ordersApi.track(orderId.trim(), phone.trim());
      if (res.data.status !== 'delivered') {
        toast.error('Returns are only available for delivered orders');
      } else {
        setOrderData(res.data);
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order not found or phone number mismatch');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!returnForm.reason) return toast.error('Please select a reason');
    
    setLoading(true);
    try {
      const payload = {
        order_id: orderData.id,
        type: returnForm.type,
        reason: returnForm.reason,
        description: returnForm.description
      };
      if (returnForm.type === 'exchange') {
        payload.exchange_for = returnForm.exchange_for;
      }
      
      const res = await returnsApi.submit(payload);
      setSubmittedReturnId(res.data.returnId);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 min-h-[70vh]">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-blush-50 text-blush-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCcw size={32} />
        </div>
        <h1 className="font-display text-4xl text-gray-900 mb-4">Returns & Exchanges</h1>
        <p className="text-gray-500">Easily return or exchange items within 7 days of delivery.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        
        {/* Step 1: Verify Order */}
        {step === 1 && (
          <form onSubmit={handleVerify} className="space-y-4 animate-fade-in">
            <div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Used in order) *</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number" 
                className="input"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-4 flex justify-center gap-2">
              {loading ? <Spinner size="sm" /> : <><Search size={20}/> Find Order</>}
            </button>
          </form>
        )}

        {/* Step 2: Request Form */}
        {step === 2 && orderData && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Order Found</p>
                <p className="font-medium text-gray-900">{orderData.id}</p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-sm text-blush-600 font-medium hover:underline">
                Change Order
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">What would you like to do?</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`border p-4 rounded-xl cursor-pointer text-center transition-colors ${returnForm.type === 'return' ? 'border-blush-600 bg-blush-50' : 'hover:border-blush-300'}`}>
                  <input type="radio" name="type" className="hidden" checked={returnForm.type === 'return'} onChange={() => setReturnForm({...returnForm, type: 'return'})} />
                  <span className={`font-medium ${returnForm.type === 'return' ? 'text-blush-800' : 'text-gray-600'}`}>Return for Refund</span>
                </label>
                <label className={`border p-4 rounded-xl cursor-pointer text-center transition-colors ${returnForm.type === 'exchange' ? 'border-blush-600 bg-blush-50' : 'hover:border-blush-300'}`}>
                  <input type="radio" name="type" className="hidden" checked={returnForm.type === 'exchange'} onChange={() => setReturnForm({...returnForm, type: 'exchange'})} />
                  <span className={`font-medium ${returnForm.type === 'exchange' ? 'text-blush-800' : 'text-gray-600'}`}>Exchange Item</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <select 
                required
                value={returnForm.reason}
                onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})}
                className="input bg-white"
              >
                <option value="">Select a reason</option>
                <option value="Damaged/Defective">Item arrived damaged/defective</option>
                <option value="Wrong Item">Received wrong item</option>
                <option value="Size Issue">Size doesn't fit</option>
                <option value="Quality Issue">Not satisfied with quality</option>
                <option value="Changed Mind">Changed my mind</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {returnForm.type === 'exchange' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Details *</label>
                <input 
                  type="text" 
                  required
                  value={returnForm.exchange_for}
                  onChange={(e) => setReturnForm({...returnForm, exchange_for: e.target.value})}
                  placeholder="e.g. Need Size M instead of L" 
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comments</label>
              <textarea 
                rows="3"
                value={returnForm.description}
                onChange={(e) => setReturnForm({...returnForm, description: e.target.value})}
                placeholder="Any specific details that would help us process this faster..." 
                className="input resize-none"
              ></textarea>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
              {loading ? <Spinner size="sm" /> : `Submit ${returnForm.type === 'return' ? 'Return' : 'Exchange'} Request`}
            </button>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center py-8 animate-fade-in">
            <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
            <h2 className="font-display text-2xl text-gray-900 mb-2">Request Submitted</h2>
            <p className="text-gray-600 mb-6 font-body">We've received your request and will review it shortly. An email confirmation has been sent.</p>
            <div className="bg-blush-50 text-blush-800 p-4 rounded-xl border border-blush-100 mb-8 inline-block">
              <span className="text-xs uppercase tracking-wide font-bold block mb-1">Reference ID</span>
              <span className="font-display text-xl font-bold">{submittedReturnId}</span>
            </div>
            <br/>
            <button onClick={() => window.location.reload()} className="btn-outline">
              Submit Another Request
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
