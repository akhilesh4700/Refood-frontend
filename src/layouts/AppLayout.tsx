import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { isAuthenticated, getStoredUser } from '../api';

/**
 * Layout wrapper shared by both supplier and recipient authenticated pages.
 * Shows the sidebar + scrollable main content area.
 * Redirects to / if there is no stored session token.
 *
 * IMPORTANT: The presence of a session token does NOT constitute secure
 * authorization. The backend enforces access control on every API request.
 * These guards exist only to prevent accidental UI navigation.
 */
export function AuthLayout() {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5FA]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

/**
 * Supplier-only guard: if authenticated but wrong role, redirect to recipient
 * dashboard. Uses 'supplier' to match the domain type (not legacy 'buyer').
 */
export function SupplierGuard() {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  const user = getStoredUser();
  if (!user || user.role !== 'supplier') {
    return <Navigate to="/recipient/dashboard" replace />;
  }
  return <Outlet />;
}

/**
 * Recipient-only guard: if authenticated but wrong role, redirect to supplier
 * dashboard. Uses 'recipient' to match the domain type (not legacy 'buyer').
 */
export function RecipientGuard() {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  const user = getStoredUser();
  if (!user || user.role !== 'recipient') {
    return <Navigate to="/supplier/dashboard" replace />;
  }
  return <Outlet />;
}

/** Bare layout — no sidebar, no nav. Used for landing + login pages. */
export function BareLayout() {
  return (
    <div className="min-h-screen bg-[#F5F5FA]">
      <Outlet />
    </div>
  );
}
