import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Calendar, Users, X } from 'lucide-react';
import { couponsApi } from '../../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    expires_at: ''
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponsApi.getAll();
      setCoupons(res.data);
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setFormData({
      code: '', description: '', discount_type: 'percentage', discount_value: '',
      min_order_amount: '', max_discount_amount: '', usage_limit: '', expires_at: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await couponsApi.delete(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      payload.code = payload.code.toUpperCase();
      payload.discount_value = parseFloat(payload.discount_value);
      payload.min_order_amount = payload.min_order_amount ? parseFloat(payload.min_order_amount) : 0;
      payload.max_discount_amount = payload.max_discount_amount ? parseFloat(payload.max_discount_amount) : null;
      payload.usage_limit = payload.usage_limit ? parseInt(payload.usage_limit, 10) : null;
      payload.expires_at = payload.expires_at ? new Date(payload.expires_at).toISOString() : null;

      await couponsApi.create(payload);
      toast.success('Coupon created successfully');
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-gray-900">Coupons</h1>
          <p className="text-gray-500 text-sm mt-1">Manage discount codes and promotions</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary py-2 px-4 flex items-center gap-2">
          <Plus size={18} /> Add New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Spinner size="lg" /></div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
          <Tag size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">No active coupons</p>
          <button onClick={openCreateModal} className="text-blush-600 font-medium hover:underline">Create your first coupon</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-slide-up">
          {coupons.map(coupon => {
            const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
            const isExhausted = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;
            const isActive = coupon.is_active && !isExpired && !isExhausted;

            return (
              <div key={coupon.id} className={`bg-white rounded-2xl border shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md ${isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                
                {/* Active Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blush-50 text-blush-700 px-3 py-1 rounded-lg border border-blush-100 font-bold tracking-wider uppercase text-lg">
                    {coupon.code}
                  </div>
                  <button onClick={() => handleDelete(coupon.id)} className="text-gray-400 hover:text-red-500 p-1 bg-gray-50 rounded-full hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="font-display text-2xl text-gray-900 leading-none mb-1">
                    {coupon.discount_type === 'percentage' ? `${parseFloat(coupon.discount_value)}% OFF` : `₹${parseFloat(coupon.discount_value)} OFF`}
                  </h3>
                  <p className="text-sm text-gray-500">{coupon.description}</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  {parseFloat(coupon.min_order_amount) > 0 && (
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Min Order: ₹{parseFloat(coupon.min_order_amount)}
                    </p>
                  )}
                  {coupon.discount_type === 'percentage' && parseFloat(coupon.max_discount_amount) > 0 && (
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Max Discount: ₹{parseFloat(coupon.max_discount_amount)}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    {coupon.used_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : 'used'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('en-IN') : 'No expiry'}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl animate-slide-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display text-2xl text-gray-900">Create Coupon</h2>
              <button onClick={() => !saving && setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  className="input uppercase font-bold tracking-wider" 
                  placeholder="e.g. SUMMER20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="input" 
                  placeholder="e.g. 20% off on all summer dresses"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                  <select 
                    required 
                    value={formData.discount_type} 
                    onChange={e => setFormData({...formData, discount_type: e.target.value})} 
                    className="input bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    value={formData.discount_value} 
                    onChange={e => setFormData({...formData, discount_value: e.target.value})} 
                    className="input" 
                    placeholder={formData.discount_type === 'percentage' ? "e.g. 20" : "e.g. 500"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={formData.min_order_amount} 
                    onChange={e => setFormData({...formData, min_order_amount: e.target.value})} 
                    className="input" 
                    placeholder="e.g. 1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={formData.max_discount_amount} 
                    onChange={e => setFormData({...formData, max_discount_amount: e.target.value})} 
                    className="input" 
                    placeholder="e.g. 2000"
                    disabled={formData.discount_type === 'fixed'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={formData.usage_limit} 
                    onChange={e => setFormData({...formData, usage_limit: e.target.value})} 
                    className="input" 
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={formData.expires_at} 
                    onChange={e => setFormData({...formData, expires_at: e.target.value})} 
                    className="input" 
                  />
                </div>
              </div>

              {/* Submit fixed at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 px-6 flex justify-end gap-3 z-20">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline py-2 px-6 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary py-2 px-8 flex items-center gap-2 text-sm">
                  {saving ? <Spinner size="sm" /> : 'Create Coupon'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
