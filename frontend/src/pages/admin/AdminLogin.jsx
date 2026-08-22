import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';
import { adminApi } from '../../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

export default function AdminLogin() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      return toast.error('Please enter both username and password');
    }

    setLoading(true);
    try {
      const res = await adminApi.login(formData);
      alert('API Success! Token: ' + (res.data.token ? 'exists' : 'missing'));
      localStorage.setItem('vnz_admin_token', res.data.token);
      toast.success('Logged in successfully');
      navigate('/admin');
    } catch (err) {
      alert('API Error: ' + (err.response?.data?.error || err.message));
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blush-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-blush-700 leading-none">
            Vino'z <span className="italic text-gray-800">Admin</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Authorized Access Only</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-blush-200/20 border border-blush-100">
          <div className="w-16 h-16 bg-blush-100 text-blush-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                type="text" 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blush-300 transition-colors"
                placeholder="Enter admin username"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blush-300 transition-colors"
                placeholder="Enter password"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blush-600 hover:bg-blush-700 text-white py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-md shadow-blush-200 mt-2"
            >
              {loading ? <Spinner size="sm" /> : <><LogIn size={20} /> Access Portal</>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          &copy; {new Date().getFullYear()} Vino'z Fashion. All rights reserved.
        </p>
      </div>
    </div>
  );
}
