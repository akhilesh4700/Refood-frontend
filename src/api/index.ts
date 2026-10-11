/**
 * ReFood — API Service Layer
 *
 * This module provides the integration boundary between the frontend and the
 * planned backend API. All functions in this file represent real HTTP calls
 * that will be made once a backend exists.
 *
 * INTEGRATION STATUS: PENDING BACKEND
 * ─────────────────────────────────────────────────────────────────────────────
 * No backend is currently connected. Each function documents the intended
 * endpoint and returns an appropriate "not yet available" state.
 *
 * Frontend pages must handle the empty/unavailable states gracefully.
 * Do NOT import from ../mocks/data in the production application flow.
 * Mock data is isolated to src/mocks/data.ts for development reference only.
 */

import type {
  User,
  UserRole,
  AuthResult,
  Listing,
  ListingFilters,
  CreateListingInput,
  Reservation,
  ReservationStatus,
  HandoverResult,
  AppNotification,
  ChatMessage,
  SupplierMetrics,
  RecipientMetrics,
  SignInInput,
  SignUpInput,
  PaginatedResponse,
} from '../types/domain';

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Base URL for all API requests.
 * Set VITE_API_BASE_URL in .env to connect to a real backend.
 * Example: VITE_API_BASE_URL=http://localhost:8000/api
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// ─── Session Storage ──────────────────────────────────────────────────────────

const SESSION_TOKEN_KEY = 'refood_session_token';
const SESSION_USER_KEY  = 'refood_session_user';

export function getStoredToken(): string | null {
  return sessionStorage.getItem(SESSION_TOKEN_KEY) ?? localStorage.getItem(SESSION_TOKEN_KEY);
}

function storeSession(result: AuthResult): void {
  localStorage.setItem(SESSION_TOKEN_KEY, result.token);
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(result.user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
}

/** Returns true if a session token is present in storage. */
export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

/**
 * Returns the stored user from the last successful sign-in.
 * Returns null if no session exists or storage is corrupt.
 */
export function getStoredUser(): User | null {
  const raw = localStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

// ─── HTTP Client ──────────────────────────────────────────────────────────────

class ApiUnavailableError extends Error {
  constructor(endpoint: string) {
    super(`Backend not connected. Endpoint: ${endpoint}`);
    this.name = 'ApiUnavailableError';
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_BASE) {
    throw new ApiUnavailableError(path);
  }

  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Authenticate a user.
 * → POST /auth/login
 *
 * On success, stores the session token and user locally.
 * The backend must return a JWT and the authenticated user object.
 */
export async function signIn(input: SignInInput): Promise<AuthResult> {
  const result = await apiFetch<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  storeSession(result);
  return result;
}

/**
 * Register a new organisation.
 * → POST /auth/register
 *
 * The backend validates the organisation and may initiate a verification process.
 * The frontend must not claim that registration is complete or verified.
 */
export async function signUp(input: SignUpInput): Promise<AuthResult> {
  const result = await apiFetch<AuthResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  storeSession(result);
  return result;
}

/**
 * Sign out the current user.
 * → POST /auth/logout
 */
export async function signOut(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' });
  } finally {
    // Always clear local session regardless of backend response.
    clearSession();
  }
}

/**
 * Fetch the currently authenticated user's profile.
 * → GET /auth/me
 *
 * Used to validate/refresh the stored session on page load.
 */
export async function getCurrentUser(): Promise<User> {
  const user = await apiFetch<User>('/auth/me');
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  return user;
}

// ─── Listings ──────────────────────────────────────────────────────────────────

/**
 * Browse available listings (recipient marketplace).
 * → GET /listings
 *
 * The backend filters listings by recipient eligibility (role-based).
 * Edible food is shown to NGO/shelter recipients; organic waste to processors.
 */
export async function getListings(filters?: ListingFilters): Promise<PaginatedResponse<Listing>> {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.maxDistanceKm != null) params.set('maxDistanceKm', String(filters.maxDistanceKm));
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);
  if (filters?.sortDir) params.set('sortDir', filters.sortDir);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return apiFetch<PaginatedResponse<Listing>>(`/listings${qs ? `?${qs}` : ''}`);
}

/**
 * Fetch a single listing by ID.
 * → GET /listings/:id
 */
export async function getListing(id: string): Promise<Listing> {
  return apiFetch<Listing>(`/listings/${id}`);
}

/**
 * Fetch the supplier's own listings (inventory management).
 * → GET /supplier/listings
 *
 * This is distinct from getListings(). The supplier sees ALL their own
 * listings regardless of status; recipients see only 'active' listings.
 */
export async function getMyListings(filters?: ListingFilters): Promise<PaginatedResponse<Listing>> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  return apiFetch<PaginatedResponse<Listing>>(`/supplier/listings${qs ? `?${qs}` : ''}`);
}

/**
 * Create a new surplus listing.
 * → POST /listings
 *
 * If imageFile is present, use multipart/form-data.
 * The backend returns the created listing including the imageUrl.
 */
export async function createListing(input: CreateListingInput): Promise<Listing> {
  if (input.imageFile) {
    // Multipart upload — backend handles image storage
    if (!API_BASE) throw new ApiUnavailableError('POST /listings (multipart)');
    const formData = new FormData();
    formData.append('image', input.imageFile);
    const rest = { ...input };
    delete (rest as { imageFile?: File }).imageFile;
    formData.append('data', JSON.stringify(rest));
    const token = getStoredToken();
    const res = await fetch(`${API_BASE}/listings`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Listing>;
  }

  return apiFetch<Listing>('/listings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Update an eligible listing.
 * → PATCH /listings/:id
 *
 * Backend enforces which fields are editable based on listing status.
 */
export async function updateListing(
  id: string,
  updates: Partial<CreateListingInput>
): Promise<Listing> {
  return apiFetch<Listing>(`/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Withdraw (cancel) a listing.
 * → POST /listings/:id/withdraw
 *
 * Only permitted when the listing is in 'active' or 'draft' status.
 */
export async function withdrawListing(id: string, reason?: string): Promise<void> {
  return apiFetch<void>(`/listings/${id}/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ─── Reservations ─────────────────────────────────────────────────────────────

/**
 * Claim an available listing (recipient action).
 * → POST /listings/:id/claim
 *
 * The backend must handle this atomically to prevent two recipients from
 * claiming the same listing simultaneously. The frontend cannot guarantee
 * exclusive claim — the backend is authoritative.
 *
 * On conflict (another recipient claimed first), the backend returns a
 * 409 Conflict response. The frontend shows a conflict state.
 */
export async function claimListing(listingId: string): Promise<Reservation> {
  return apiFetch<Reservation>(`/listings/${listingId}/claim`, {
    method: 'POST',
  });
}

/**
 * Fetch the current user's reservations.
 * → GET /reservations (recipient)
 */
export async function getMyReservations(): Promise<Reservation[]> {
  return apiFetch<Reservation[]>('/reservations');
}

/**
 * Fetch a specific reservation.
 * → GET /reservations/:id
 */
export async function getReservation(id: string): Promise<Reservation> {
  return apiFetch<Reservation>(`/reservations/${id}`);
}

/**
 * Fetch the supplier's active pickup queue.
 * → GET /supplier/pickups
 */
export async function getSupplierPickups(): Promise<Reservation[]> {
  return apiFetch<Reservation[]>('/supplier/pickups');
}

/**
 * Update a reservation's status (e.g. recipient marks "on the way").
 * → PATCH /reservations/:id/status
 *
 * Backend validates the transition is permitted for the current state.
 */
export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<Reservation> {
  return apiFetch<Reservation>(`/reservations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Supplier initiates OTP generation for handover.
 * → POST /reservations/:id/otp/initiate
 *
 * The OTP is generated server-side and delivered to the recipient via the
 * platform. It is NEVER generated or stored in the frontend.
 * After this call, the reservation's otpReady field will be true.
 */
export async function initiateHandoverOtp(reservationId: string): Promise<void> {
  return apiFetch<void>(`/reservations/${reservationId}/otp/initiate`, {
    method: 'POST',
  });
}

/**
 * Recipient submits the OTP for handover verification.
 * → POST /reservations/:id/otp/verify
 *
 * The backend validates the OTP and finalizes the handover.
 * The frontend must not accept arbitrary OTP inputs as successful.
 */
export async function verifyHandoverOtp(
  reservationId: string,
  otp: string
): Promise<HandoverResult> {
  return apiFetch<HandoverResult>(`/reservations/${reservationId}/otp/verify`, {
    method: 'POST',
    body: JSON.stringify({ otp }),
  });
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

/**
 * Fetch chat messages for a reservation.
 * → GET /reservations/:id/chat
 *
 * Integration pending: real-time delivery via WebSocket or SSE will be
 * implemented when the backend chat infrastructure is ready.
 */
export async function getChatMessages(reservationId: string): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(`/reservations/${reservationId}/chat`);
}

/**
 * Send a chat message.
 * → POST /reservations/:id/chat
 */
export async function sendChatMessage(
  reservationId: string,
  text: string
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(`/reservations/${reservationId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * Fetch supplier impact analytics.
 * → GET /supplier/analytics?period=30d|q3|ytd|lifetime
 *
 * All metric values represent confirmed outcomes from real backend records.
 */
export async function getSupplierAnalytics(period: string): Promise<SupplierMetrics> {
  return apiFetch<SupplierMetrics>(`/supplier/analytics?period=${encodeURIComponent(period)}`);
}

/**
 * Fetch recipient impact analytics.
 * → GET /recipient/analytics?period=30d|ytd
 */
export async function getRecipientAnalytics(period: string): Promise<RecipientMetrics> {
  return apiFetch<RecipientMetrics>(`/recipient/analytics?period=${encodeURIComponent(period)}`);
}

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Fetch notifications for the current user.
 * → GET /notifications
 */
export async function getNotifications(): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>('/notifications');
}

/**
 * Mark a single notification as read.
 * → PATCH /notifications/:id/read
 */
export async function markNotificationRead(id: string): Promise<void> {
  return apiFetch<void>(`/notifications/${id}/read`, { method: 'PATCH' });
}

/**
 * Mark all notifications as read.
 * → POST /notifications/read-all
 */
export async function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>('/notifications/read-all', { method: 'POST' });
}

// ─── Helper: API availability check ──────────────────────────────────────────

/** Returns true if an API base URL is configured. */
export function isApiConfigured(): boolean {
  return !!API_BASE;
}

export { ApiUnavailableError };
export type { UserRole };
