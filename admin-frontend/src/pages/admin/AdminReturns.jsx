import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { returnsApi } from '../../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const STATUS_COLORS = {
  requested: 'bg-yellow-100 text-yellow-700',
  'under-review': 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  'pickup-scheduled': 'bg-purple-100 text-purple-700',
  completed: 'bg-gray-100 text-gray-600',
};

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    returnsApi.getAll()
      .then(res => setReturns(res.data))
      .catch(() => toast.error('Failed to load returns'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    try {
      const res = await returnsApi.update(selected._id, { status: newStatus, adminNote });
      setReturns(r => r.map(x => x._id === selected._id ? res.data : x));
      toast.success('Return updated');
      setSelected(null);
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(false); }
  };

  return (
    <AdminSidebar>
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl text-gray-800 mb-6">Returns & Exchanges</h1>
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Return ID', 'Order', 'Customer', 'Type', 'Reason', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-body font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {returns.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-16 text-gray-400 font-body">No return requests</td></tr>
                  ) : returns.map(r => (
                    <tr key={r._id} className="hover:bg-blush-50/20">
                      <td className="px-4 py-3 text-sm font-body font-medium text-blush-700">#{r.returnId}</td>
                      <td className="px-4 py-3 text-sm font-body text-gray-600">#{r.orderId}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-body text-gray-700">{r.customer?.name}</p>
                        <p className="text-xs text-gray-400 font-body">{r.customer?.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge capitalize ${r.type === 'return' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{r.type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-body text-gray-600 capitalize">{r.reason?.replace('-', ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`badge capitalize ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-body text-gray-400 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelected(r); setNewStatus(r.status); setAdminNote(r.adminNote || ''); }}
                          className="text-xs text-blush-500 hover:text-blush-700 font-body underline">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="font-body font-semibold text-gray-800 mb-4">Manage Return #{selected.returnId}</h3>
              <div className="bg-blush-50 rounded-xl p-4 mb-4 text-sm font-body text-gray-600">
                <p><strong>Type:</strong> {selected.type} | <strong>Reason:</strong> {selected.reason?.replace('-', ' ')}</p>
                {selected.description && <p className="mt-1"><strong>Details:</strong> {selected.description}</p>}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input">
                    {['requested','under-review','approved','rejected','pickup-scheduled','completed'].map(s => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">Admin Note (shown to customer)</label>
                  <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3} className="input resize-none" placeholder="Explain your decision..." />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setSelected(null)} className="btn-outline flex-1 py-2.5">Cancel</button>
                <button onClick={handleUpdate} disabled={updating} className="btn-primary flex-1 py-2.5">
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}
