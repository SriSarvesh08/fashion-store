import React, { useState } from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';
import { returnsApi, ordersApi } from '../utils/api';
import toast from 'react-hot-toast';

const REASONS = [
  { value: 'defective', label: 'Defective / Damaged' },
  { value: 'wrong-item', label: 'Wrong Item Received' },
  { value: 'not-as-described', label: 'Not as Described' },
  { value: 'size-issue', label: 'Size Issue' },
  { value: 'changed-mind', label: 'Changed My Mind' },
  { value: 'other', label: 'Other' },
];

export default function ReturnRequest() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    orderId: '', phone: '', type: 'return', reason: '',
    description: '', exchangeFor: ''
  });
  const [order, setOrder] = useState(null);

  const verifyOrder = async () => {
    if (!form.orderId.trim() || !form.phone.trim()) {
      toast.error('Enter order ID and phone'); return;
    }
    setLoading(true);
    try {
      const res = await ordersApi.track(form.orderId.trim().toUpperCase(), form.phone.trim());
      if (res.data.status !== 'delivered') {
        toast.error('Returns only accepted for delivered orders'); return;
      }
      setOrder(res.data);
      setStep(2);
    } catch {
      toast.error('Order not found or phone mismatch');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.reason) { toast.error('Please select a reason'); return; }
    setLoading(true);
    try {
      const res = await returnsApi.submit({
        orderId: form.orderId.toUpperCase(),
        phone: form.phone,
        type: form.type,
        reason: form.reason,
        description: form.description,
        exchangeFor: form.exchangeFor
      });
      setSubmitted(res.data.returnId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={36} className="text-green-500" />
        </div>
        <h2 className="font-display text-2xl text-gray-800 mb-2">Request Submitted!</h2>
        <p className="text-gray-500 font-body mb-4">Your {form.type} request has been received.</p>
        <div className="card p-5 inline-block">
          <p className="text-sm text-gray-400 font-body">Return ID</p>
          <p className="font-body font-bold text-blush-700 text-lg">#{submitted}</p>
          <p className="text-xs text-gray-400 font-body mt-2">We'll review and respond within 24-48 hours</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <RotateCcw size={22} className="text-blush-500" />
        <h1 className="font-display text-2xl text-gray-800">Return / Exchange</h1>
      </div>

      <div className="card p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-body font-semibold text-gray-700">Verify Your Order</h2>
            <div>
              <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">Order ID *</label>
              <input
                value={form.orderId}
                onChange={e => setForm(f => ({ ...f, orderId: e.target.value.toUpperCase() }))}
                placeholder="e.g. VNZ-12345678"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">Registered Phone *</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit phone number"
                className="input"
                type="tel"
              />
            </div>
            <button onClick={verifyOrder} disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Verify Order'}
            </button>
          </div>
        )}

        {step === 2 && order && (
          <div className="space-y-5 animate-slide-up">
            <div className="bg-blush-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-body">Order #{order.orderId}</p>
              <p className="text-sm font-body font-medium text-gray-700">{order.customer?.name}</p>
              <p className="text-xs text-gray-500 font-body">{order.items?.length} item(s) · ₹{order.pricing?.total?.toLocaleString('en-IN')}</p>
            </div>

            <div>
              <p className="text-sm font-body font-semibold text-gray-700 mb-2">Request Type *</p>
              <div className="grid grid-cols-2 gap-3">
                {['return', 'exchange'].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`p-3 rounded-xl border-2 text-sm font-body capitalize transition-colors
                      ${form.type === t ? 'border-blush-500 bg-blush-50 text-blush-700' : 'border-gray-200 text-gray-600 hover:border-blush-200'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-body font-semibold text-gray-700 mb-2">Reason *</p>
              <select
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="input"
              >
                <option value="">Select a reason</option>
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {form.type === 'exchange' && (
              <div>
                <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">Exchange For</label>
                <input
                  value={form.exchangeFor}
                  onChange={e => setForm(f => ({ ...f, exchangeFor: e.target.value }))}
                  placeholder="Describe what you'd like instead"
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">Additional Details</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the issue..."
                rows={3}
                className="input resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
