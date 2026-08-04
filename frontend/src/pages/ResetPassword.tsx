import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Activity, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { APP_NAME, ROUTES } from '../config/constants';
import { AuthService } from '../services/auth.service';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasNumber && hasUppercase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!token) {
      setError('Password reset token is missing from URL.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters long and contain at least one number and one uppercase letter.');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.resetPassword({ token, newPassword });
      setSuccessMsg(response.message || 'Password reset successful! Confirmation email sent.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white mb-3 shadow-lg shadow-primary-900/50">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{APP_NAME}</h1>
          <p className="text-sm text-slate-400 mt-1">Set New Account Password</p>
        </div>

        <Card className="bg-white p-6 shadow-2xl rounded-2xl border-0">
          {!token ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Invalid Link</h3>
              <p className="text-xs text-slate-600">The password reset link is invalid or incomplete.</p>
              <Button variant="primary" onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}>
                Request New Link
              </Button>
            </div>
          ) : successMsg ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Password Reset Complete</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{successMsg}</p>
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>A Password Changed notification has been sent to your email.</span>
              </div>
              <div className="pt-2">
                <Button variant="primary" onClick={() => navigate(ROUTES.LOGIN)}>
                  Sign In With New Password
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength criteria checklist */}
              {newPassword.length > 0 && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
                  <p className="font-semibold text-slate-700">Password Requirements:</p>
                  <div className="grid grid-cols-1 gap-1">
                    <span className={hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                      {hasMinLength ? '✓' : '○'} At least 8 characters
                    </span>
                    <span className={hasUppercase ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                      {hasUppercase ? '✓' : '○'} At least 1 uppercase letter
                    </span>
                    <span className={hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                      {hasNumber ? '✓' : '○'} At least 1 number
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-2.5 mt-2"
              >
                {loading ? 'Resetting Password...' : 'Save New Password'}
              </Button>
            </form>
          )}

          <div className="mt-5 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
            <Link to={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-semibold">
              Return to Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
