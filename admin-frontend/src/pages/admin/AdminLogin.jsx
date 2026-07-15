import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield } from 'lucide-react';
import { adminApi } from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Submit credentials
  const handleCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminApi.login(form);
      localStorage.setItem('vnz_admin_token', res.data.token);
      toast.success('Login successful!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blush-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blush-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-white" />
          </div>
          <h1 className="font-display text-2xl text-gray-800">Admin Login</h1>
          <p className="text-sm text-gray-400 font-body mt-1">Vino'z Fashion Dashboard</p>
        </div>
        <form onSubmit={handleCredentials} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">Username</label>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="input"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Logging in...' : 'Sign In'}
          </button>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <Shield size={14} className="text-blush-400" />
            <span className="text-xs text-gray-400 font-body">Admin Area Secured</span>
          </div>
        </form>
      </div>
    </div>
  );
}
