import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ROLE_BADGE = {
  ADMIN:       { label: 'Admin',     bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
  PHARMACIST:  { label: 'Dược sĩ',  bg: 'bg-teal-100',   text: 'text-teal-700',   ring: 'ring-teal-200' },
  BUYER:       { label: 'Người mua', bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-200' },
};

const ROLE_AVATAR_GRADIENT = {
  ADMIN:       'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  PHARMACIST:  'linear-gradient(135deg, #14b8a6, #0d9488)',
  BUYER:       'linear-gradient(135deg, #3b82f6, #2563eb)',
};

export function TopBar({ title }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const user = auth?.user;
  const displayName = user?.fullName || user?.username || `#${user?.userId}`;
  const primaryRole = user?.roles?.[0];
  const badge = ROLE_BADGE[primaryRole] || null;

  const initials = displayName
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div
      className="flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30"
      style={{ height: 'var(--topbar-height)' }}
    >
      {/* Left: page title */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">
          {title || 'Pharmacy SOA'}
        </h1>
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-2">
        {user && (
          <div className="flex items-center gap-3">
            {/* Role badge */}
            {badge && (
              <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${badge.bg} ${badge.text} ${badge.ring}`}>
                {badge.label}
              </span>
            )}

            {/* Avatar + name */}
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold shadow-sm"
                style={{ background: ROLE_AVATAR_GRADIENT[primaryRole] || ROLE_AVATAR_GRADIENT.BUYER }}
              >
                {initials}
              </div>
              <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[140px] truncate">
                {displayName}
              </span>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          aria-label="Đăng xuất"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
