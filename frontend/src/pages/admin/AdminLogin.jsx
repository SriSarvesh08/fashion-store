import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { adminApi } from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [adminId, setAdminId] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  // Countdown timer for resend
  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(t => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Auto-focus first OTP box when step changes
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0].focus(), 100);
    }
  }, [step]);

  // Handle Step 1: Submit credentials
  const handleCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminApi.login(form);
      if (res.data.requiresOtp) {
        setAdminId(res.data.adminId);
        setMaskedEmail(res.data.maskedEmail);
        setStep('otp');
        setResendTimer(30);
        toast.success('OTP sent to your email!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerifyOtp(fullOtp);
      }
    }
  };

  // Handle OTP keydown (backspace navigation)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpRefs.current[5]?.focus();
      handleVerifyOtp(pastedData);
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (otpCode) => {
    setLoading(true);
    try {
      const res = await adminApi.verifyOtp({ adminId, otp: otpCode });
      localStorage.setItem('vnz_admin_token', res.data.token);
      toast.success('Login successful!');
      navigate('/admin');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid OTP';
      toast.error(errorMsg);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();

      // If OTP expired or too many attempts, go back to credentials
      if (err.response?.status === 429 || errorMsg.includes('expired') || errorMsg.includes('login again')) {
        setTimeout(() => {
          setStep('credentials');
          setAdminId(null);
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP form submit
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }
    handleVerifyOtp(fullOtp);
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    try {
      await adminApi.resendOtp({ adminId });
      toast.success('New OTP sent!');
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  // Go back to credentials step
  const handleBack = () => {
    setStep('credentials');
    setAdminId(null);
    setOtp(['', '', '', '', '', '']);
  };

  return (
    <div className="min-h-screen bg-blush-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* ─── Step 1: Credentials ──────────────────────────────── */}
        {step === 'credentials' && (
          <>
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
                {loading ? 'Verifying...' : 'Continue'}
              </button>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-1.5 pt-2">
                <Shield size={14} className="text-blush-400" />
                <span className="text-xs text-gray-400 font-body">Protected with 2-Step Verification</span>
              </div>
            </form>
          </>
        )}

        {/* ─── Step 2: OTP Verification ──────────────────────────── */}
        {step === 'otp' && (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blush-500 to-blush-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield size={24} className="text-white" />
              </div>
              <h1 className="font-display text-2xl text-gray-800">Verify OTP</h1>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Mail size={14} className="text-blush-500" />
                <p className="text-sm text-gray-400 font-body">Code sent to <span className="text-blush-600 font-medium">{maskedEmail}</span></p>
              </div>
            </div>

            <form onSubmit={handleOtpSubmit} className="card p-6 space-y-5">
              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => otpRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-blush-300 focus:border-blush-400
                               transition-all duration-200 bg-white text-gray-800"
                    style={{ caretColor: '#c9748f' }}
                    required
                  />
                ))}
              </div>

              {/* Timer & Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-400 font-body">
                    Resend OTP in <span className="text-blush-600 font-semibold">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-sm text-blush-600 hover:text-blush-700 
                               font-body font-medium transition-colors"
                  >
                    <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <button type="submit" disabled={loading || otp.join('').length !== 6} className="btn-primary w-full py-3">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              {/* Back button */}
              <button
                type="button"
                onClick={handleBack}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 
                           hover:text-gray-600 font-body transition-colors pt-1"
              >
                <ArrowLeft size={14} />
                Back to login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
