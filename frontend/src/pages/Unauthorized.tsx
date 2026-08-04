import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ROUTES } from '../config/constants';
import { useAppSelector } from '../hooks/store';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Card className="bg-white p-8 shadow-2xl rounded-2xl border-0 space-y-5">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldX className="w-9 h-9" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">403 - Access Denied</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              You do not have the required role permissions to view or perform operations on this module.
            </p>
          </div>

          {user && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Your Current Role:</span>{' '}
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 font-bold rounded uppercase">
                {user.role}
              </span>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs py-2.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>

            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="flex items-center gap-1.5 text-xs py-2.5"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
