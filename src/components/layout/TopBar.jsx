import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Menu, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button } from '../ui';

export function TopBar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Format today's date: e.g. "Monday, 28 Sep 2026"
  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date()); // eslint-disable-line react/purity -- display-only date label

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'Admin': return 'purple';
      case 'Doctor': return 'blue';
      case 'Patient': return 'green';
      case 'Receptionist':
      default: return 'teal';
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'CQ';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-soft-xs">
      {/* Left: Mobile hamburger & breadcrumb & TV link */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/60">
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          <span>Today: {todayFormatted}</span>
        </div>

        <a
          href="/display"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors shadow-soft-xs"
          title="Launch Full-Screen TV Waiting Room Display (No Sidebar)"
        >
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span>TV Display</span>
        </a>
      </div>

      {/* Right: Authenticated User Info & Logout Button (Replaced Role Switcher) */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user && (
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shadow-soft-xs ring-2 ring-brand-100">
              {initials}
            </div>

            {/* Name & Role Badge */}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                  {user.role} {user.doctorId ? `(${user.doctorId})` : ''}
                </Badge>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              onClick={handleLogout}
              className="text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 ml-1"
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopBar;
