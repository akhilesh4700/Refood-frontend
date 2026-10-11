// Persistent Storage & Mock Backend Service for ReFood Circular Network
// Supports two user access personas: Supplier ('Hotel Grand Royale') & Buyer ('Robin Hood Army')
// Persists listings, claims/reservations, pickups, and user role via localStorage & cookies.
// Emits real-time events to sync all open pages immediately.

import {
  mockListings,
  mockSupplier,
  mockPickups,
  mockReservation,
  mockRecipients,
  mockChatMessages,
  mockImpactMetrics,
  type Listing,
  type Supplier,
  type Pickup,
  type Reservation,
  type Recipient,
  type ChatMessage,
  type ImpactMetrics,
} from '../mocks/data';

export type UserRole = 'supplier' | 'buyer';

export interface ActiveUser {
  role: UserRole;
  id: string;
  name: string;
  subTitle: string;
  badge: string;
  avatar: string;
}

export const USERS: Record<UserRole, ActiveUser> = {
  supplier: {
    role: 'supplier',
    id: 'sup-grand-royale',
    name: 'Hotel Grand Royale',
    subTitle: 'Culinary & Banqueting Supplier',
    badge: 'Audited Food Supplier',
    avatar: 'HG',
  },
  buyer: {
    role: 'buyer',
    id: 'rec-robin-hood',
    name: 'Robin Hood Army',
    subTitle: 'Verified Recipient NGO',
    badge: 'Verified Buyer / NGO',
    avatar: 'RH',
  },
};

// Storage Keys
const STORAGE_KEY_LISTINGS = 'refood_listings_v2';
const STORAGE_KEY_PICKUPS = 'refood_pickups_v2';
const STORAGE_KEY_RESERVATIONS = 'refood_reservations_v2';
const STORAGE_KEY_ROLE = 'refood_user_role_v2';
const STORAGE_KEY_IMPACT = 'refood_impact_v2';
const STORAGE_KEY_SESSION = 'refood_session_v2';

// Cookie helpers
function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Broadcast event to notify all components in the current window
export function notifyDataChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('refood_data_updated'));
  }
}

// Subscribe helper for React components
export function subscribeToDataChanges(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('refood_data_updated', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('refood_data_updated', handler);
    window.removeEventListener('storage', handler);
  };
}

// --- User Access Management ---

export function getActiveUser(): ActiveUser {
  if (typeof window === 'undefined') return USERS.supplier;
  const savedRole = (getCookie('refood_role') || localStorage.getItem(STORAGE_KEY_ROLE)) as UserRole;
  if (savedRole && USERS[savedRole]) {
    return USERS[savedRole];
  }
  return USERS.supplier;
}

export function setActiveUserRole(role: UserRole): ActiveUser {
  setCookie('refood_role', role);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ROLE, role);
  }
  notifyDataChanged();
  return USERS[role];
}

// --- Session / Auth Management ---

/** Returns true if a session token exists (mock auth). */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(STORAGE_KEY_SESSION);
}

/** Mock sign-in: sets session + role, returns the user. */
export async function signIn(role: UserRole, _email: string, _password: string): Promise<ActiveUser> {
  await new Promise((r) => setTimeout(r, 800));
  const token = `mock_token_${role}_${Date.now()}`;
  localStorage.setItem(STORAGE_KEY_SESSION, token);
  return setActiveUserRole(role);
}

/** Clears session, role, and auth cookie. Emits data-changed so subscribers react. */
export function signOut(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_SESSION);
  localStorage.removeItem(STORAGE_KEY_ROLE);
  // Expire cookie
  document.cookie = 'refood_role=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  notifyDataChanged();
}

// --- Listings Management (Add / Buy / Claim) ---

function getStoredListings(): Listing[] {
  if (typeof window === 'undefined') return mockListings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LISTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // convert string dates back to Date objects
      return parsed.map((item: any) => ({
        ...item,
        expiresAt: new Date(item.expiresAt),
        createdAt: new Date(item.createdAt),
      }));
    }
  } catch (e) {
    console.error('Failed to parse stored listings:', e);
  }
  // Initialize storage with default mock listings
  localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(mockListings));
  return mockListings;
}

function saveStoredListings(listings: Listing[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(listings));
  notifyDataChanged();
}

// GET /listings
export async function getListings(): Promise<Listing[]> {
  await new Promise((r) => setTimeout(r, 80));
  return getStoredListings();
}

// GET /listings/:id
export async function getListing(id: string): Promise<Listing | undefined> {
  await new Promise((r) => setTimeout(r, 60));
  const listings = getStoredListings();
  return listings.find((l) => l.id === id);
}

// POST /listings (Supplier adds supplies)
export async function createListing(data: Partial<Listing>): Promise<Listing> {
  await new Promise((r) => setTimeout(r, 150));
  const listings = getStoredListings();
  const activeUser = getActiveUser();

  const newId = `RF-${Math.floor(10000 + Math.random() * 90000)}`;
  const weight = Number(data.weightKg) || 25;

  const newListing: Listing = {
    id: newId,
    title: data.title ?? 'New Surplus Food Batch',
    description: data.description ?? '',
    stream: data.stream ?? 'edible',
    weightKg: weight,
    portions: Math.round(weight * 2.5),
    imageUrl:
      data.imageUrl ??
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=400&fit=crop',
    temperature: data.temperature ?? 'Ambient 18°C',
    distance: 1.2,
    supplier: activeUser.role === 'supplier' ? activeUser.name : 'Hotel Grand Royale',
    location: data.location ?? 'Koramangala, Bengaluru',
    pickupSlot: 'Today 16:00 – 19:30',
    expiresAt: data.expiresAt ?? new Date(Date.now() + 4 * 3600_000),
    createdAt: new Date(),
    allergens: data.allergens ?? [],
    packagingNote: data.packagingNote ?? 'Packed in standard food crates',
    category: data.category ?? 'Bakery & Pastries',
    auditReady: true,
    coldChain: data.stream === 'edible',
  };

  const updated = [newListing, ...listings];
  saveStoredListings(updated);
  return newListing;
}

// POST /listings/:id/claim (Buyer / Recipient buys/reserves supplies)
export async function claimListing(
  listingId: string,
  buyerName?: string
): Promise<{ reservation: Reservation; listing: Listing }> {
  await new Promise((r) => setTimeout(r, 200));
  const listings = getStoredListings();
  const targetIndex = listings.findIndex((l) => l.id === listingId);

  const activeUser = getActiveUser();
  const recipientName = buyerName || activeUser.name || 'Robin Hood Army';

  let listing: Listing;
  if (targetIndex >= 0) {
    listing = listings[targetIndex];
    // update status or tag title/packagingNote
    listing = {
      ...listing,
      packagingNote: `[Reserved by ${recipientName}] ${listing.packagingNote}`,
    };
    listings[targetIndex] = listing;
    saveStoredListings(listings);
  } else {
    listing = mockListings[0];
  }

  // Create new active pickup & reservation
  const reservationId = listingId.startsWith('RF-') ? listingId : `RF-${listingId}`;
  const pin1 = Math.floor(100 + Math.random() * 900);
  const pin2 = Math.floor(100 + Math.random() * 900);
  const otpPin = `${pin1} – ${pin2}`;
  const otp = `${pin1}${pin2}`;

  const newReservation: Reservation = {
    id: reservationId,
    listingId: listing.id,
    status: 'ready',
    step: 2,
    otpPin: otpPin,
    otp: otp,
    targetHandover: '17:45 Local',
    pickupAddress: `${listing.supplier} Kitchen Dock 2, ${listing.location}`,
    driverName: 'Ramesh Kumar (Volunteer Dispatch)',
    driverVehicle: 'Electric Van (KA 01 EK 4920)',
    driverInitials: 'RK',
  };

  // Save reservation
  const storedReservations = getStoredReservations();
  saveStoredReservations({ ...storedReservations, [reservationId]: newReservation });

  // Add to today's pickups list
  const pickups = getStoredPickups();
  const newPickup: Pickup = {
    id: `PK-${Date.now().toString().slice(-4)}`,
    time: '17:45 IST',
    recipient: recipientName,
    allocationKg: listing.weightKg,
    driverName: 'Ramesh Kumar',
    driverInitials: 'RK',
    driverVehicle: 'Electric Van (KA 01 EK 4920)',
    driverPhone: '+91 98450 99281',
    otp: otp,
  };
  saveStoredPickups([newPickup, ...pickups.filter((p) => p.recipient !== recipientName)]);

  notifyDataChanged();
  return { reservation: newReservation, listing };
}

// --- Pickups & Reservations Management ---

function getStoredPickups(): Pickup[] {
  if (typeof window === 'undefined') return mockPickups;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PICKUPS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEY_PICKUPS, JSON.stringify(mockPickups));
  return mockPickups;
}

function saveStoredPickups(pickups: Pickup[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PICKUPS, JSON.stringify(pickups));
  notifyDataChanged();
}

export async function getTodayPickups(): Promise<Pickup[]> {
  await new Promise((r) => setTimeout(r, 60));
  return getStoredPickups();
}

function getStoredReservations(): Record<string, Reservation> {
  if (typeof window === 'undefined') return { [mockReservation.id]: mockReservation };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESERVATIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  const init = { [mockReservation.id]: mockReservation };
  localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(init));
  return init;
}

function saveStoredReservations(resMap: Record<string, Reservation>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(resMap));
  notifyDataChanged();
}

// GET /reservations/:id
export async function getReservation(id: string): Promise<Reservation | undefined> {
  await new Promise((r) => setTimeout(r, 60));
  const resMap = getStoredReservations();
  if (resMap[id]) return resMap[id];
  // Fallback reservation with matching id
  return {
    ...mockReservation,
    id,
    listingId: id,
  };
}

// POST /reservations
export async function createReservation(listingId: string): Promise<Reservation> {
  const result = await claimListing(listingId);
  return result.reservation;
}

// GET /supplier
export async function getSupplier(): Promise<Supplier> {
  await new Promise((r) => setTimeout(r, 50));
  return mockSupplier;
}

// GET /recipients
export async function getRecipients(): Promise<Recipient[]> {
  await new Promise((r) => setTimeout(r, 50));
  return mockRecipients;
}

// GET /chat/:reservationId
export async function getChatMessages(reservationId: string): Promise<ChatMessage[]> {
  await new Promise((r) => setTimeout(r, 50));
  return mockChatMessages;
}

// GET /analytics?period=30d|q3|ytd|lifetime
export async function getImpactMetrics(period: string): Promise<ImpactMetrics> {
  await new Promise((r) => setTimeout(r, 60));
  const base = mockImpactMetrics[period] ?? mockImpactMetrics['30d'];

  // Add dynamic weight from user-created listings & pickups
  const listings = getStoredListings();
  const extraWeight = listings
    .filter((l) => l.id.startsWith('RF-') && !mockListings.find((m) => m.id === l.id))
    .reduce((sum, item) => sum + (item.weightKg || 0), 0);

  return {
    ...base,
    totalRescuedKg: base.totalRescuedKg + extraWeight,
    co2PreventedT: Number((base.co2PreventedT + (extraWeight * 2.5) / 1000).toFixed(1)),
  };
}

// Reset store back to clean mock baseline
export function resetDatabase() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_LISTINGS);
  localStorage.removeItem(STORAGE_KEY_PICKUPS);
  localStorage.removeItem(STORAGE_KEY_RESERVATIONS);
  localStorage.removeItem(STORAGE_KEY_ROLE);
  localStorage.removeItem(STORAGE_KEY_IMPACT);
  setCookie('refood_role', 'supplier');
  notifyDataChanged();
}
