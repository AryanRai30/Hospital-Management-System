import React from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Activity } from 'lucide-react';
import { APP_NAME } from '../config/constants';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 text-white mb-3 shadow-lg shadow-primary-900/50">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{APP_NAME}</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to your hospital portal account</p>
        </div>

        <Card className="bg-white p-6 shadow-2xl rounded-2xl border-0">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="doctor@hospital.com"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>

            <Button variant="primary" className="w-full py-2.5 mt-2">
              Sign In
            </Button>
          </form>

          <p className="text-xs text-center text-slate-500 mt-5">
            Note: Authentication module logic is setup for future implementation.
          </p>
        </Card>
      </div>
    </div>
  );
};
