/**
 * ReFood — Centralized Domain Types
 *
 * These types model the frontend state and map to planned backend API shapes.
 * The backend is authoritative; these types define the integration contract.
 */

// ─── User & Auth ────────────────────────────────────────────────────────────

/** The two operational roles on the platform. */
export type UserRole = 'supplier' | 'recipient';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  orgName: string;
  orgType: string;
  /** Short display initials for avatar placeholder. */
  avatar: string;
  /** Human-readable badge shown in sidebar. */
  badge: string;
  subTitle: string;
  verified: boolean;
}

export interface AuthResult {
  user: User;
  /** Opaque token stored client-side; validated by backend on each request. */
  token: string;
}

// ─── Listing ─────────────────────────────────────────────────────────────────

export type ListingType = 'edible' | 'organic';

/**
 * Explicit listing lifecycle states.
 * Backend is authoritative on transitions; frontend uses these for display and
 * action eligibility only.
 */
export type ListingStatus =
  | 'draft'         // Not yet published
  | 'active'        // Available for claim
  | 'claimed'       // Fully claimed, awaiting pickup
  | 'completed'     // Handover verified
  | 'expired'       // Past deadline, unclaimed
  | 'withdrawn'     // Supplier cancelled
  | 'converted';    // Edible → organic conversion pending

export type StorageMethod = 'ambient' | 'refrigerated' | 'frozen';

export interface Listing {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierLocation: string;
  type: ListingType;
  status: ListingStatus;
  category: string;
  title: string;
  description: string;
  weightKg: number;
  portions?: number;
  storageMethod: StorageMethod;
  storageNote?: string;
  allergens: string[];
  packagingNote?: string;
  preparedAt?: string;       // ISO 8601
  safeUntil?: string;        // ISO 8601 — edible only
  earliestPickup: string;    // ISO 8601
  collectionDeadline: string; // ISO 8601
  pickupAddress: string;
  pickupInstructions?: string;
  onSiteContact: string;
  onSitePhone: string;
  imageUrl?: string;
  isFree: boolean;
  price?: number;
  currency?: string;
  createdAt: string;         // ISO 8601
  distanceKm?: number;       // Computed by backend from recipient's location
}

// ─── Reservation & Pickup ─────────────────────────────────────────────────────

/**
 * Explicit reservation lifecycle states.
 * Separate from listing and payment states.
 */
export type ReservationStatus =
  | 'pending'          // Claim submitted, backend processing
  | 'confirmed'        // Claim accepted by backend
  | 'preparing'        // Supplier packing/preparing
  | 'ready'            // Ready for pickup
  | 'in_transit'       // Recipient en route
  | 'arrived'          // Recipient at location
  | 'handover_pending' // OTP verification in progress
  | 'completed'        // Handover verified
  | 'cancelled'        // Cancelled by either party
  | 'conflict';        // Claim rejected due to race condition

/**
 * Payment state is tracked separately from reservation state.
 */
export type PaymentStatus =
  | 'not_applicable'  // Free listing
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface Reservation {
  id: string;
  listingId: string;
  listing: Pick<Listing, 'id' | 'title' | 'type' | 'weightKg' | 'supplierName' | 'supplierLocation' | 'imageUrl' | 'isFree' | 'price' | 'currency' | 'storageMethod' | 'allergens'>;
  recipientId: string;
  recipientName: string;
  reservationStatus: ReservationStatus;
  paymentStatus: PaymentStatus;
  pickupAddress: string;
  earliestPickup: string;
  collectionDeadline: string;
  onSiteContact?: string;
  onSitePhone?: string;
  /**
   * OTP is never generated or stored client-side.
   * Backend provides it after initiateHandoverOtp() is called.
   * Shown to the recipient only; validated server-side.
   */
  otpReady: boolean;
  handoverVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HandoverResult {
  success: boolean;
  reservationId: string;
  verifiedAt: string;
  finalWeightKg?: number;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationEventType =
  | 'reservation_new'
  | 'reservation_confirmed'
  | 'reservation_cancelled'
  | 'reservation_conflict'
  | 'pickup_deadline_approaching'
  | 'recipient_on_the_way'
  | 'recipient_arrived'
  | 'handover_completed'
  | 'payment_update'
  | 'chat_message'
  | 'listing_expired'
  | 'system';

export interface AppNotification {
  id: string;
  eventType: NotificationEventType;
  title: string;
  body: string;
  isRead: boolean;
  relatedId?: string;      // reservationId, listingId, etc.
  relatedPath?: string;    // Frontend route to navigate to on click
  createdAt: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  reservationId: string;
  senderRole: UserRole | 'system';
  senderName: string;
  text: string;
  sentAt: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

/**
 * All metric values come from confirmed backend records.
 * Unknown outcomes are tracked separately from confirmed outcomes.
 */
export interface SupplierMetrics {
  period: string;
  totalListings: number;
  activeListings: number;
  completedPickups: number;
  edibleRedistributedKg: number;       // Confirmed handovers, edible food
  organicRecoveredKg: number;          // Confirmed handovers, organic waste
  unclaimedExpiredKg: number;          // Not claimed before deadline
  confirmedDiscardedKg: number;        // Supplier confirmed discard
  unknownOutcomeKg: number;            // Expired, final outcome not confirmed
  paidTransactionTotal?: number;       // Only when payment records exist
  currency?: string;
}

export interface RecipientMetrics {
  period: string;
  completedReservations: number;
  edibleFoodReceivedKg: number;
  organicWasteRecoveredKg: number;
  collectionHistory: CollectionRecord[];
}

export interface CollectionRecord {
  date: string;
  listingTitle: string;
  supplierName: string;
  weightKg: number;
  type: ListingType;
}

// ─── API Shapes ───────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListingFilters {
  type?: ListingType;
  category?: string;
  search?: string;
  maxDistanceKm?: number;
  sortBy?: 'deadline' | 'created' | 'weight' | 'distance';
  sortDir?: 'asc' | 'desc';
  status?: ListingStatus;
}

export interface CreateListingInput {
  type: ListingType;
  category: string;
  title: string;
  description: string;
  weightKg: number;
  portions?: number;
  storageMethod: StorageMethod;
  storageNote?: string;
  allergens: string[];
  packagingNote?: string;
  preparedAt?: string;
  safeUntil?: string;
  earliestPickup: string;
  collectionDeadline: string;
  pickupAddress: string;
  pickupInstructions?: string;
  onSiteContact: string;
  onSitePhone: string;
  isFree: boolean;
  price?: number;
  currency?: string;
  imageFile?: File;  // Handled as multipart; backend returns imageUrl
}

export interface SignInInput {
  email: string;
  password: string;
  role: UserRole;
}

export interface SignUpInput {
  role: UserRole;
  orgName: string;
  orgType: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  password: string;
  acceptedTerms: boolean;
}
