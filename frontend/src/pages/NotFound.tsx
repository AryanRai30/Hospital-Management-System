import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ROUTES } from '../config/constants';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-7xl font-extrabold text-primary-600 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-800 mt-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2 mb-6">
          The page or module you are attempting to access does not exist or has been relocated.
        </p>
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};
