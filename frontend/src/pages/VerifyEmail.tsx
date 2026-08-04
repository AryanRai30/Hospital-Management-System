import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Activity, MailCheck, AlertCircle, RefreshCw, CheckCircle2, PartyPopper } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { APP_NAME, ROUTES } from '../config/constants';
import { AuthService } from '../services/auth.service';
import { useAppDispatch, useAppSelector } from '../hooks/store';
import { updateUser } from '../store/slices/authSlice';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState<boolean>(Boolean(token));
  const [verified, setVerified] = useState<boolean>(false);
  const [verifiedMsg, setVerifiedMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string>(user?.email || '');
  const [resending, setResending] = useState<boolean>(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const runVerification = async () => {
      setVerifying(true);
      setError(null);
      try {
        const response = await AuthService.verifyEmail(token);
        if (response.success) {
          setVerified(true);
          setVerifiedMsg(response.message || 'Email verified successfully! Welcome email sent.');
          dispatch(updateUser({ isEmailVerified: true }));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Email verification failed');
      } finally {
        setVerifying(false);
      }
    };

    runVerification();
  }, [token, dispatch]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResending(true);
    setResendMsg(null);
    try {
      const response = await AuthService.resendVerification(resendEmail);
      setResendMsg(response.message || 'Verification email resent! Check your inbox.');
    } catch (err: any) {
      setResendMsg(err.response?.data?.message || err.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
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
          <p className="text-sm text-slate-400 mt-1">Email Verification Portal</p>
        </div>

        <Card className="bg-white p-6 shadow-2xl rounded-2xl border-0">
          {verifying ? (
            <div className="text-center py-8 space-y-4">
              <RefreshCw className="w-10 h-10 text-primary-600 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Verifying Your Email Address...</h3>
              <p className="text-xs text-slate-500">Please wait while we confirm your verification token.</p>
            </div>
          ) : verified ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Email Verified Successfully!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {verifiedMsg}
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-center gap-2">
                <PartyPopper className="w-4 h-4 text-emerald-600" />
                <span>A Welcome Email has been sent to your inbox!</span>
              </div>
              <div className="pt-2">
                <Button variant="primary" onClick={() => navigate(ROUTES.LOGIN)}>
                  Proceed to Login
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MailCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Verify Your Email Address</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  You must verify your email address before logging in to the portal. Please check your email inbox for the link.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {resendMsg && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs text-center font-medium">
                  {resendMsg}
                </div>
              )}

              <form onSubmit={handleResend} className="pt-2 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Resend Verification Email
                </label>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={resending}
                  className="w-full py-2 flex items-center justify-center gap-2 text-xs"
                >
                  {resending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{resending ? 'Sending Email...' : 'Resend Verification Link'}</span>
                </Button>
              </form>

              <div className="mt-4 text-center text-xs text-slate-600 border-t border-slate-100 pt-3">
                <Link to={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-semibold">
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
