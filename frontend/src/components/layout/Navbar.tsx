import React, { useState } from 'react';
import { Menu, Bell, Search, User as UserIcon, LogOut, Key, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/store';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { AuthService } from '../../services/auth.service';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/constants';
import { getUserFullName, getUserInitials } from '../../utils/user.helpers';

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const displayName = getUserFullName(user);
  const initials = getUserInitials(user);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch {
      // Ignored
    } finally {
      dispatch(logout());
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
            title="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative hidden md:block w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients, doctors, appointments..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          <div className="h-6 w-px bg-slate-200"></div>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-1 text-left focus:outline-none p-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {user?.avatarUrl || user?.avatar_url ? (
                <img
                  src={user.avatarUrl || user.avatar_url}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-primary-300 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-300 text-primary-700 flex items-center justify-center font-bold text-xs shadow-xs">
                  {initials}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {displayName}
                </p>
                <p className="text-[10px] font-medium text-slate-500 capitalize">
                  {user?.role ? user.role.toLowerCase() : 'Visitor'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setMenuOpen(false)}
              >
                <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-900">{displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || 'authenticated'}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 text-[9px] font-bold uppercase border border-primary-200">
                    Role: {user?.role || 'USER'}
                  </span>
                </div>

                <button
                  onClick={() => setPasswordModalOpen(true)}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors mt-1"
                >
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors border-t border-slate-100 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
};
