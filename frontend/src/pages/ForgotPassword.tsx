import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { APP_NAME, ROUTES } from '../config/constants';
import { AuthService } from '../services/auth.service';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.forgotPassword({ email });
      setSuccessMsg(response.message || 'Reset link sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to send reset link');
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
          <p className="text-sm text-slate-400 mt-1">Reset Account Password</p>
        </div>

        <Card className="bg-white p-6 shadow-2xl rounded-2xl border-0">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Check Your Inbox</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{successMsg}</p>
              <div className="pt-2">
                <Link
                  to={ROUTES.LOGIN}
                  className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered email address below and we'll send you a link to reset your password.
              </p>

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
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-2.5 mt-2"
              >
                {loading ? 'Sending Instructions...' : 'Send Password Reset Link'}
              </Button>
            </form>
          )}

          {!successMsg && (
            <div className="mt-5 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
