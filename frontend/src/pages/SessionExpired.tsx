import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ROUTES } from '../config/constants';
import { useAppDispatch } from '../hooks/store';
import { logout } from '../store/slices/authSlice';

export const SessionExpired: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(logout());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Card className="bg-white p-8 shadow-2xl rounded-2xl border-0 space-y-5">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-9 h-9" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Session Expired</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Your security session has expired or was invalidated. Please sign in again to continue accessing hospital services.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full py-2.5 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In Again
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
