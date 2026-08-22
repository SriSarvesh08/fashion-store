import React, { useState, useEffect } from 'react';
import { RefreshCcw, Edit2, X } from 'lucide-react';
import { returnsApi } from '../../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  const [updateForm, setUpdateForm] = useState({
    status: '',
    admin_note: ''
  });

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await returnsApi.getAll();
      setReturns(res.data);
    } catch (err) {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const openUpdateModal = (ret) => {
    setSelectedReturn(ret);
    setUpdateForm({
      status: ret.status,
      admin_note: ret.admin_note || ''
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await returnsApi.update(selectedReturn.id, updateForm);
      toast.success('Return request updated');
      setIsModalOpen(false);
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update return request');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-gray-900">Returns & Exchanges</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer return requests</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-6 py-4">Return ID</th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 whitespace-nowrap">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center"><Spinner size="md" /></td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">No return requests found.</td>
                </tr>
              ) : (
                returns.map(ret => (
                  <tr key={ret.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{ret.id}</td>
                    <td className="px-6 py-4 text-gray-600">{ret.order_id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        ret.type === 'exchange' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {ret.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium">{ret.reason}</p>
                      {ret.type === 'exchange' && <p className="text-xs text-purple-600 mt-1">For: {ret.exchange_for}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                        ret.status === 'approved' || ret.status === 'completed' ? 'bg-green-100 text-green-700' :
                        ret.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {ret.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(ret.created_at).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openUpdateModal(ret)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 ml-auto">
                        <Edit2 size={12} /> Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Modal */}
      {isModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !updating && setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl text-gray-900">Manage Request</h2>
              <button onClick={() => !updating && setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-bold uppercase">Return ID</span>
                <span className="font-medium text-gray-900">{selectedReturn.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-bold uppercase">Order ID</span>
                <span className="font-medium text-gray-900">{selectedReturn.order_id}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Customer Description</span>
                <p className="text-sm text-gray-700 italic">"{selectedReturn.description || 'No additional comments provided'}"</p>
              </div>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status *</label>
                <select 
                  required
                  value={updateForm.status} 
                  onChange={e => setUpdateForm({...updateForm, status: e.target.value})} 
                  className="input bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (Internal)</label>
                <textarea 
                  rows="3"
                  value={updateForm.admin_note} 
                  onChange={e => setUpdateForm({...updateForm, admin_note: e.target.value})} 
                  className="input resize-none"
                  placeholder="Notes for the team..."
                ></textarea>
              </div>

              <button type="submit" disabled={updating} className="btn-primary w-full py-3 flex justify-center items-center gap-2">
                {updating ? <Spinner size="sm" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
