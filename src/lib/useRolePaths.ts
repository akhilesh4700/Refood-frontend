/**
 * Role-aware path resolver hook.
 * Returns absolute paths for the current user's role tree so that
 * internal navigation links always point to the right route.
 */
import { useMemo } from 'react';
import { getActiveUser } from '../api';

export interface RolePaths {
  dashboard: string;
  listings: string;
  listingNew: string;
  listingDetail: (id: string) => string;
  pickups: string;
  reservations: string;
  analytics: string;
  notifications: string;
  profile: string;
}

export function useRolePaths(): RolePaths {
  const role = getActiveUser().role;

  return useMemo<RolePaths>(() => {
    if (role === 'supplier') {
      return {
        dashboard:     '/supplier/dashboard',
        listings:      '/supplier/listings',
        listingNew:    '/supplier/listings/new',
        listingDetail: (id) => `/supplier/listings/${id}`,
        pickups:       '/supplier/pickups',
        reservations:  '/supplier/pickups',
        analytics:     '/supplier/analytics',
        notifications: '/supplier/notifications',
        profile:       '/supplier/profile',
      };
    }
    return {
      dashboard:     '/recipient/dashboard',
      listings:      '/recipient/browse',
      listingNew:    '/recipient/browse',   // recipients can't create
      listingDetail: (id) => `/recipient/listings/${id}`,
      pickups:       '/recipient/reservations',
      reservations:  '/recipient/reservations',
      analytics:     '/recipient/analytics',
      notifications: '/recipient/notifications',
      profile:       '/recipient/profile',
    };
  }, [role]);
}
