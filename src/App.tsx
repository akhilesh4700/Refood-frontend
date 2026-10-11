import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BareLayout, AuthLayout, SupplierGuard, RecipientGuard } from './layouts/AppLayout';

// Public pages
import { Landing }     from './pages/Landing';
import { Login }       from './pages/Login';

// Shared pages used by both flows (role-aware at render time)
import { Dashboard }   from './pages/Dashboard';
import { Browse }      from './pages/Browse';
import { CreateListing } from './pages/CreateListing';
import { ListingDetail } from './pages/ListingDetail';
import { Reservation } from './pages/Reservation';
import { Analytics }   from './pages/Analytics';
import { Notifications } from './pages/Notifications';

export function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ══════════════════════════════════════════════════════
            PUBLIC — no sidebar, no auth required
        ══════════════════════════════════════════════════════ */}
        <Route element={<BareLayout />}>
          {/* Landing / role-selection entry page */}
          <Route index element={<Landing />} />
          <Route path="/"       element={<Landing />} />
          <Route path="/welcome" element={<Navigate to="/" replace />} />

          {/* Role-specific login pages — no shared form, no role selector */}
          <Route path="/supplier/login"  element={<Login role="supplier" />} />
          <Route path="/recipient/login" element={<Login role="buyer" />} />

          {/* Legacy /login?role= redirect (from old landing page links) */}
          <Route path="/login" element={<LoginRedirect />} />
        </Route>

        {/* ══════════════════════════════════════════════════════
            SUPPLIER FLOW  /supplier/*
            Auth guard + role guard → sidebar with green theme
        ══════════════════════════════════════════════════════ */}
        <Route element={<AuthLayout />}>
          <Route element={<SupplierGuard />}>
            <Route path="/supplier/dashboard"     element={<Dashboard />} />
            <Route path="/supplier/listings"      element={<Browse />} />
            <Route path="/supplier/listings/new"  element={<CreateListing />} />
            <Route path="/supplier/listings/:id"  element={<ListingDetail />} />
            <Route path="/supplier/pickups"       element={<Reservation />} />
            <Route path="/supplier/analytics"     element={<Analytics />} />
            <Route path="/supplier/notifications" element={<Notifications />} />
            {/* profile placeholder */}
            <Route path="/supplier/profile"       element={<Dashboard />} />
          </Route>

          {/* ══════════════════════════════════════════════════
              RECIPIENT FLOW  /recipient/*
              Auth guard + role guard → sidebar with amber theme
          ══════════════════════════════════════════════════ */}
          <Route element={<RecipientGuard />}>
            <Route path="/recipient/dashboard"      element={<Dashboard />} />
            <Route path="/recipient/browse"         element={<Browse />} />
            <Route path="/recipient/listings/:id"   element={<ListingDetail />} />
            <Route path="/recipient/reservations"   element={<Reservation />} />
            <Route path="/recipient/analytics"      element={<Analytics />} />
            <Route path="/recipient/notifications"  element={<Notifications />} />
            {/* profile placeholder */}
            <Route path="/recipient/profile"        element={<Dashboard />} />
          </Route>
        </Route>

        {/* ══════════════════════════════════════════════════════
            LEGACY ROUTES — redirect to new paths
        ══════════════════════════════════════════════════════ */}
        <Route path="/dashboard"          element={<Navigate to="/supplier/dashboard" replace />} />
        <Route path="/listings"           element={<Navigate to="/supplier/listings" replace />} />
        <Route path="/listings/new"       element={<Navigate to="/supplier/listings/new" replace />} />
        <Route path="/listings/:id"       element={<Navigate to="/supplier/listings/RF-84920" replace />} />
        <Route path="/reservations/:id"   element={<Navigate to="/supplier/pickups" replace />} />
        <Route path="/analytics"          element={<Navigate to="/supplier/analytics" replace />} />
        <Route path="/notifications"      element={<Navigate to="/supplier/notifications" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Reads ?role= query param (from old Landing page links) and redirects
 * to the proper role-specific login page.
 */
function LoginRedirect() {
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role');
  const target = role === 'buyer' ? '/recipient/login' : '/supplier/login';
  return <Navigate to={target} replace />;
}

export default App;
