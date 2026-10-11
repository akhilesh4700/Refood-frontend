import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Search,
  Menu,
  X,
  Leaf,
  RefreshCw,
  UserCheck,
  Building2,
  HeartHandshake,
  Check
} from 'lucide-react';
import { cn } from './ui/utils';
import {
  getActiveUser,
  setActiveUserRole,
  resetDatabase,
  subscribeToDataChanges,
  type ActiveUser,
  type UserRole
} from '../api';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/listings', label: 'Browse Listings' },
  { to: '/listings/new', label: 'Create Listing', supplierOnly: true },
  { to: '/reservations/RF-84920', label: 'Reservations & Pickups' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/notifications', label: 'Notifications' },
];

export function TopNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ActiveUser>(getActiveUser());

  useEffect(() => {
    const unsub = subscribeToDataChanges(() => {
      setCurrentUser(getActiveUser());
    });
    return unsub;
  }, []);

  const handleRoleSwitch = (newRole: UserRole) => {
    const updated = setActiveUserRole(newRole);
    setCurrentUser(updated);
    setUserDropdownOpen(false);
    if (newRole === 'supplier' && pathname === '/reservations/RF-84920') {
      navigate('/dashboard');
    } else if (newRole === 'buyer' && pathname === '/listings/new') {
      navigate('/listings');
    }
  };

  const handleReset = () => {
    if (confirm('Reset demo data back to clean default baseline?')) {
      resetDatabase();
      setUserDropdownOpen(false);
      window.location.reload();
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-[#E6E8F0] shadow-xs">
      <div className="max-w-[1240px] mx-auto px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-[#0E6B45] rounded-lg flex items-center justify-center shadow-xs">
            <Leaf size={14} className="text-white" />
          </div>
          <span className="font-bold text-[#111827] text-lg tracking-tight">ReFood</span>
        </Link>

        {/* Dual Role Switcher Pill */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#EEF0FA] border border-[#E6E8F0] text-xs shrink-0">
          <button
            type="button"
            onClick={() => handleRoleSwitch('supplier')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all cursor-pointer',
              currentUser.role === 'supplier'
                ? 'bg-[#0E6B45] text-white shadow-xs'
                : 'text-[#5B6272] hover:text-[#111827]'
            )}
            title="Switch to Supplier Mode (Hotel Grand Royale)"
          >
            <Building2 size={13} />
            <span>Supplier Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch('buyer')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all cursor-pointer',
              currentUser.role === 'buyer'
                ? 'bg-[#B8650A] text-white shadow-xs'
                : 'text-[#5B6272] hover:text-[#111827]'
            )}
            title="Switch to Buyer Mode (Robin Hood Army NGO)"
          >
            <HeartHandshake size={13} />
            <span>Buyer / NGO Mode</span>
          </button>
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-1 flex-1 overflow-x-auto ml-2">
          {navLinks.map((link) => {
            const exactActive = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all duration-150',
                  exactActive
                    ? 'bg-[#0E6B45] text-white'
                    : 'text-[#5B6272] hover:text-[#111827] hover:bg-[#EEF0FA]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6272]" />
            <input
              type="search"
              placeholder="Search surplus, batches…"
              className="pl-8 pr-3 py-1.5 text-xs bg-[#EEF0FA] rounded-[10px] border border-[#E6E8F0] text-[#111827] placeholder:text-[#5B6272]/60 focus:outline-none focus:border-[#0E6B45] w-40 transition-all focus:w-52"
            />
          </div>

          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative w-8 h-8 flex items-center justify-center rounded-[10px] hover:bg-[#EEF0FA] cursor-pointer"
          >
            <Bell size={16} className="text-[#5B6272]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#B8650A] rounded-full" />
          </Link>

          {/* User profile with dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-[#EEF0FA] transition-colors cursor-pointer border border-[#E6E8F0]"
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-xs',
                  currentUser.role === 'supplier' ? 'bg-[#0E6B45]' : 'bg-[#B8650A]'
                )}
              >
                {currentUser.avatar}
              </div>
              <div className="text-left hidden xl:block">
                <div className="text-xs font-bold text-[#111827] leading-none">{currentUser.name}</div>
                <div className="text-[10px] text-[#5B6272] leading-tight mt-0.5">{currentUser.badge}</div>
              </div>
              <ChevronDown size={13} className="text-[#5B6272]" />
            </button>

            {/* User Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-[#E6E8F0] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-[#E6E8F0] mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">
                    Current Access Persona
                  </span>
                  <div className="font-bold text-sm text-[#111827] mt-0.5">{currentUser.name}</div>
                  <div className="text-xs text-[#5B6272]">{currentUser.subTitle}</div>
                </div>

                <div className="space-y-1 mb-2">
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('supplier')}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors text-left',
                      currentUser.role === 'supplier'
                        ? 'bg-[#DDF7EE] text-[#0E6B45]'
                        : 'hover:bg-[#EEF0FA] text-[#111827]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={15} />
                      <div>
                        <div>Hotel Grand Royale</div>
                        <div className="text-[10px] text-[#5B6272]">Supplier (Can list food)</div>
                      </div>
                    </div>
                    {currentUser.role === 'supplier' && <Check size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('buyer')}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors text-left',
                      currentUser.role === 'buyer'
                        ? 'bg-[#FBEBDD] text-[#B8650A]'
                        : 'hover:bg-[#EEF0FA] text-[#111827]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <HeartHandshake size={15} />
                      <div>
                        <div>Robin Hood Army</div>
                        <div className="text-[10px] text-[#5B6272]">Buyer / NGO (Can buy/claim)</div>
                      </div>
                    </div>
                    {currentUser.role === 'buyer' && <Check size={14} />}
                  </button>
                </div>

                <div className="pt-2 border-t border-[#E6E8F0]">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-[#5B6272] hover:bg-[#EEF0FA] hover:text-[#C62828] transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    Reset Demo State & Baseline Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu trigger */}
        <button
          aria-label="Toggle menu"
          className="lg:hidden ml-auto cursor-pointer p-1"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[#E6E8F0] bg-white px-6 py-4 flex flex-col gap-3">
          {/* Mobile Role Switcher */}
          <div className="flex gap-2 p-1 bg-[#EEF0FA] rounded-xl">
            <button
              type="button"
              onClick={() => handleRoleSwitch('supplier')}
              className={cn(
                'flex-1 py-1.5 text-xs font-bold rounded-lg text-center',
                currentUser.role === 'supplier' ? 'bg-[#0E6B45] text-white' : 'text-[#5B6272]'
              )}
            >
              Supplier Mode
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('buyer')}
              className={cn(
                'flex-1 py-1.5 text-xs font-bold rounded-lg text-center',
                currentUser.role === 'buyer' ? 'bg-[#B8650A] text-white' : 'text-[#5B6272]'
              )}
            >
              Buyer Mode
            </button>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'px-3 py-2 rounded-[8px] text-xs font-semibold',
                pathname === link.to ? 'bg-[#0E6B45] text-white' : 'text-[#5B6272]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
