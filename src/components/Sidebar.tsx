import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Leaf, LayoutDashboard, ListPlus, ShoppingBag, Truck,
  BarChart3, Bell, LogOut, X, AlertTriangle,
  Package, Search,
} from 'lucide-react';
import { cn } from './ui/utils';
import { getStoredUser, signOut, isAuthenticated } from '../api';
import type { User } from '../types/domain';

/* ─── Nav link definitions per role ─────────────────────────────────── */
const SUPPLIER_NAV = [
  { to: '/supplier/dashboard',     label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/supplier/listings',      label: 'My Listings',        icon: Package         },
  { to: '/supplier/listings/new',  label: 'List Surplus Food',  icon: ListPlus        },
  { to: '/supplier/pickups',       label: 'Pickups & Handover', icon: Truck           },
  { to: '/supplier/analytics',     label: 'Analytics',          icon: BarChart3       },
  { to: '/supplier/notifications', label: 'Notifications',      icon: Bell            },
];

const RECIPIENT_NAV = [
  { to: '/recipient/dashboard',     label: 'Dashboard',           icon: LayoutDashboard },
  { to: '/recipient/browse',        label: 'Browse Surplus',      icon: ShoppingBag     },
  { to: '/recipient/reservations',  label: 'My Reservations',     icon: Truck           },
  { to: '/recipient/analytics',     label: 'Impact & Analytics',  icon: BarChart3       },
  { to: '/recipient/notifications', label: 'Notifications',       icon: Bell            },
];

/* ─── Sign-Out Popover ───────────────────────────────────────────────── */
function SignOutPopover({ onConfirm, onCancel }: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCancel]);

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-3 right-3 bg-white rounded-[14px] border border-[#E6E8F0]
                 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      <div className="flex items-start gap-2.5 mb-3.5">
        <AlertTriangle size={15} className="text-[#C62828] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-700 text-[#111827]">Sign out?</p>
          <p className="text-xs text-[#5B6272] mt-0.5">You'll be returned to the landing page.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-[10px] text-xs font-700 text-white bg-[#C62828] hover:bg-[#a81f1f] transition-colors"
        >
          Sign Out
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-[10px] text-xs font-700 text-[#5B6272] bg-[#F5F5FA] hover:bg-[#E6E8F0] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Sidebar Inner Content ──────────────────────────────────────────── */
function SidebarContent({
  user, nav, accent, accentLight, onClose, onSignOut,
}: {
  user: User | null;
  nav: typeof SUPPLIER_NAV;
  accent: string;
  accentLight: string;
  onClose?: () => void;
  onSignOut: () => void;
}) {
  const { pathname } = useLocation();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const isActive = (to: string) => {
    if (to.endsWith('/dashboard')) return pathname.endsWith('/dashboard');
    return pathname.startsWith(to);
  };

  const roleLabel = user?.role === 'supplier' ? '● Supplier Mode' : '● Recipient Mode';
  const displayAvatar = user?.avatar || (user?.name?.slice(0, 2).toUpperCase() ?? '??');

  return (
    <div className="flex flex-col h-full">
      {/* Logo row */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
        <Link
          to={nav[0].to}
          onClick={onClose}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shadow-sm"
               style={{ background: accent }}>
            <Leaf size={14} className="text-white" />
          </div>
          <span className="font-800 text-[#111827] text-lg tracking-tight">ReFood</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F0F1F7] text-[#5B6272]">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Role chip */}
      <div className="px-4 mb-3 shrink-0">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-800 uppercase tracking-widest"
          style={{ background: accentLight, color: accent }}
        >
          {roleLabel}
        </span>
      </div>

      {/* Search — visual only, routes to role-specific search */}
      <div className="px-4 mb-4 shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            placeholder="Search…"
            className="w-full pl-7 pr-3 py-2 text-xs bg-[#F5F5FA] border border-[#E6E8F0] rounded-[10px]
                       text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none transition-all"
            readOnly
            onClick={() => {
              // Navigate to the role-appropriate search/browse page
              const searchPath = user?.role === 'supplier'
                ? '/supplier/listings'
                : '/recipient/browse';
              // useNavigate is in scope via the parent, but we'll use a link pattern
              window.location.href = searchPath;
            }}
          />
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p className="px-2 mb-2 text-[9px] font-800 uppercase tracking-[0.14em] text-[#9CA3AF]">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-600 transition-all duration-150 relative group',
                    active
                      ? 'text-white shadow-sm'
                      : 'text-[#5B6272] hover:text-[#111827] hover:bg-[#F0F1F7]'
                  )}
                  style={active ? { background: accent } : {}}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                      style={{ background: 'rgba(255,255,255,0.5)' }}
                    />
                  )}
                  <Icon
                    size={16}
                    className={active ? 'text-white' : 'text-[#9CA3AF] group-hover:text-[#5B6272]'}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 shrink-0 mt-auto">
        <div className="border-t border-[#E6E8F0] pt-4 space-y-1">
          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-[12px] bg-[#F5F5FA] border border-[#E6E8F0]">
            <div
              className="w-9 h-9 rounded-full text-white text-xs font-800 flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: accent }}
            >
              {displayAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-700 text-[#111827] truncate">
                {user?.orgName || user?.name || 'Loading…'}
              </p>
              <p className="text-[10px] text-[#5B6272] truncate">
                {user?.badge || (user?.role === 'supplier' ? 'Supplier' : 'Recipient')}
              </p>
            </div>
          </div>

          {/* Sign out with popover */}
          <div className="relative">
            {showSignOutConfirm && (
              <SignOutPopover
                onConfirm={onSignOut}
                onCancel={() => setShowSignOutConfirm(false)}
              />
            )}
            <button
              type="button"
              onClick={() => setShowSignOutConfirm((v) => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-xs font-700
                         text-[#C62828] hover:bg-[#FFF1F1] transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Sidebar Export ────────────────────────────────────────────── */
export function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [mobileOpen, setMobileOpen] = useState(false);

  // Refresh user from storage on focus (handles tab-switch session changes)
  useEffect(() => {
    const refresh = () => setUser(getStoredUser());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const isSupplier   = user?.role === 'supplier';
  const nav          = isSupplier ? SUPPLIER_NAV : RECIPIENT_NAV;
  const accent       = isSupplier ? '#0E6B45' : '#B8650A';
  const accentLight  = isSupplier ? '#DDF7EE' : '#FBEBDD';

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate('/');
    }
  };

  const sharedProps = { user, nav, accent, accentLight, onSignOut: handleSignOut };

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[252px] min-h-screen bg-white border-r border-[#E6E8F0] shrink-0 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent {...sharedProps} />
      </aside>

      {/* ── Mobile slim top bar ──────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E6E8F0] sticky top-0 z-40">
        <Link to={nav[0].to} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[9px] flex items-center justify-center" style={{ background: accent }}>
            <Leaf size={13} className="text-white" />
          </div>
          <span className="font-800 text-[#111827] text-base tracking-tight">ReFood</span>
        </Link>

        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full text-white text-xs font-800 flex items-center justify-center"
            style={{ background: accent }}
          >
            {user?.avatar || '??'}
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-[10px] hover:bg-[#F0F1F7] text-[#5B6272]"
            aria-label="Open menu"
          >
            <svg width="18" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="0" y1="1" x2="18" y2="1" />
              <line x1="0" y1="7" x2="18" y2="7" />
              <line x1="0" y1="13" x2="18" y2="13" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile drawer overlay ────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[272px] bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200">
            <SidebarContent
              {...sharedProps}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
