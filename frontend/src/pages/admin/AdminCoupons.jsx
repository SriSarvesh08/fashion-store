import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { couponsApi } from '../../utils/api';
import toast from 'react-hot-toast';

const EMPTY = { code: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', description: '', expiresAt: '' };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await couponsApi.getAll();
      setCoupons(res.data);
    } catch { toast.error('Failed to load coupons'); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    if (!form.code || !form.value) { toast.error('Code and value required'); return; }
    setSaving(true);
    try {
      await couponsApi.create({
        ...form,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        expiresAt: form.expiresAt || undefined
      });
      toast.success('Coupon created');
      setShowForm(false);
      setForm(EMPTY);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create coupon');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await couponsApi.delete(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <AdminSidebar>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-gray-800">Coupons</h1>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm py-2.5">
            <Plus size={16} /> Create Coupon
          </button>
        </div>

        {coupons.length === 0 ? (
          <div className="card p-12 text-center">
            <Tag size={32} className="text-blush-200 mx-auto mb-3" />
            <p className="text-gray-400 font-body">No coupons yet. Create your first discount code!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map(c => (
              <div key={c._id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-body font-bold text-blush-700 text-lg tracking-wider">{c.code}</span>
                    <p className="text-xs text-gray-400 font-body mt-0.5">{c.description || `${c.type === 'percentage' ? c.value + '%' : '₹' + c.value} off`}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => handleDelete(c._id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-body text-gray-500">
                  <div><span className="text-gray-400">Discount:</span> {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</div>
                  {c.minOrderAmount > 0 && <div><span className="text-gray-400">Min order:</span> ₹{c.minOrderAmount}</div>}
                  {c.maxDiscount && <div><span className="text-gray-400">Max off:</span> ₹{c.maxDiscount}</div>}
                  <div><span className="text-gray-400">Used:</span> {c.usedCount}/{c.usageLimit || '∞'}</div>
                  {c.expiresAt && <div><span className="text-gray-400">Expires:</span> {new Date(c.expiresAt).toLocaleDateString('en-IN')}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="font-body font-semibold text-gray-800 mb-5">Create New Coupon</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-1">Coupon Code *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="input uppercase" placeholder="e.g. WELCOME10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Value *</label>
                    <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                      className="input" placeholder={form.type === 'percentage' ? '10' : '50'} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Min Order (₹)</label>
                    <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} className="input" placeholder="0" />
                  </div>
                  {form.type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-body font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                      <input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} className="input" placeholder="200" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Usage Limit</label>
                    <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} className="input" placeholder="Unlimited" />
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Expires On</label>
                    <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="input" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-1">Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="e.g. Welcome discount for new customers" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-outline flex-1 py-2.5">Cancel</button>
                <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}
