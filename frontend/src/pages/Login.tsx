import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Activity, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldAlert, MailWarning } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { APP_NAME, ROUTES } from '../config/constants';
import { AuthService } from '../services/auth.service';
import { useAppDispatch } from '../hooks/store';
import { setCredentials } from '../store/slices/authSlice';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutMsg, setLockoutMsg] = useState<string | null>(null);
  const [unverifiedMsg, setUnverifiedMsg] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLockoutMsg(null);
    setUnverifiedMsg(null);

    if (!email || !password) {
      setError('Please enter both email address and password');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.login({ email, password });
      if (response.success && response.data) {
        dispatch(setCredentials({
          user: response.data.user,
          token: response.data.accessToken
        }));
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message || 'Authentication failed';
      if (err.response?.status === 403 && apiMsg.toLowerCase().includes('locked')) {
        setLockoutMsg(apiMsg);
      } else if (err.response?.status === 403 && apiMsg.toLowerCase().includes('verified')) {
        setUnverifiedMsg(apiMsg);
      } else {
        setError(apiMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (!email) return;
    setResendStatus('Sending verification email...');
    try {
      const resp = await AuthService.resendVerification(email);
      setResendStatus(resp.message || 'Verification email resent! Check your inbox.');
    } catch (err: any) {
      setResendStatus(err.response?.data?.message || 'Failed to resend verification link');
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
    setLockoutMsg(null);
    setUnverifiedMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white mb-3 shadow-lg shadow-primary-900/50">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{APP_NAME}</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise Hospital Portal Login</p>
        </div>

        <Card className="bg-white p-6 shadow-2xl rounded-2xl border-0">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {unverifiedMsg && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs space-y-2">
              <div className="flex items-start gap-2 text-blue-800">
                <MailWarning className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-bold">Email Verification Required</p>
                  <p className="text-blue-700 mt-0.5">{unverifiedMsg}</p>
                </div>
              </div>
              {resendStatus ? (
                <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                  {resendStatus}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendClick}
                  className="w-full text-center py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-[11px] transition-colors"
                >
                  Resend Verification Email
                </button>
              )}
            </div>
          )}

          {lockoutMsg && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-800 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">Security Notice</p>
                <p>{lockoutMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-2.5 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
            Don't have an account?{' '}
            <Link to={ROUTES.REGISTER} className="text-primary-600 hover:text-primary-700 font-semibold">
              Register Account
            </Link>
          </div>

          {/* Quick Demo Sign-In Options */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Role Test Fill
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@hospital.com')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('dr.watson@hospital.com')}
                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('john.doe@example.com')}
                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('receptionist@hospital.com')}
                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded transition-colors"
              >
                Receptionist
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('pharmacy@hospital.com')}
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded transition-colors"
              >
                Pharmacist
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('lab.tech@hospital.com')}
                className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded transition-colors"
              >
                Lab Tech
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
