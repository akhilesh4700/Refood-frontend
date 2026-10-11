import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { isAuthenticated, getActiveUser } from '../api';

/**
 * Layout wrapper shared by both supplier and recipient authenticated pages.
 * Shows the sidebar + scrollable main content area.
 * Redirects to / if there is no active session.
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
 * Supplier-only guard: if authenticated but wrong role, redirect to recipient root.
 */
export function SupplierGuard() {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  const user = getActiveUser();
  if (user.role !== 'supplier') return <Navigate to="/recipient/dashboard" replace />;
  return <Outlet />;
}

/**
 * Recipient-only guard: if authenticated but wrong role, redirect to supplier root.
 */
export function RecipientGuard() {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  const user = getActiveUser();
  if (user.role !== 'buyer') return <Navigate to="/supplier/dashboard" replace />;
  return <Outlet />;
}

/** Bare layout — no sidebar, no nav. Used for landing + login. */
export function BareLayout() {
  return (
    <div className="min-h-screen bg-[#F5F5FA]">
      <Outlet />
    </div>
  );
}
