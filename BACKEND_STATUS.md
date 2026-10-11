# ReFood Backend Architecture & Implementation Status

## 1. Executive Summary

This document reports the production-ready Node.js, Express, TypeScript, and Prisma ORM backend foundation for **ReFood** — the B2B food surplus recovery, redistribution, and organic waste recovery platform.

The implementation provides:
- Secure JWT-based authentication with Bcrypt password hashing.
- Role-based authorization (`SUPPLIER`, `RECIPIENT`, `PROCESSOR`, `ADMIN`).
- Normalized relational database schema in PostgreSQL via Prisma with 4 models and 5 enums.
- Full CRUD & lifecycle management for surplus listings.
- Atomic, single-recipient claim operation with food-safety deadline enforcement and concurrency conflict protection.
- Complete, secure **Single-Use OTP Handover Verification** workflow (`initiateHandoverOtp`, `getReservationOtp`, `verifyHandoverOtp`) with Bcrypt hashing, 15-minute expiration, and 3-attempt brute-force protection.
- Aggregated real-time analytics for suppliers and recipients (`/api/supplier/analytics`, `/api/recipient/analytics`).
- Centralized error handling and request validation using Zod.
- Dual endpoint mounting (`/api/*` and `/*`) providing 100% compatibility with the Vite React frontend.
- 29 passing automated tests in Vitest with 100% pass rate.

---

## 2. Completed Milestones & Status

| Stage | Status | Description |
|---|---|---|
| **Stage 1: Verification** | ✅ Complete | Inspected codebase; validated dependencies; verified Prisma schema and TypeScript compilation; identified degraded DB mode when Postgres is offline. |
| **Stage 2: Foundation & Auth** | ✅ Complete | Server bootstrap (`server.ts`, `app.ts`), Zod environment validation (`env.ts`), health check, error handling, Bcrypt hashing, JWT issuance, `POST /auth/register`, `POST /auth/login`, `GET /auth/me`. |
| **Stage 3: Listings & Single Claim** | ✅ Complete | Listings API (`/listings`, `/supplier/listings`), food safety rules, role restriction on `PROCESSOR` claiming `EDIBLE` surplus, atomic single-claim with concurrency protection (`POST /listings/:id/claim`). |
| **Stage 4: OTP Handover & Completion** | ✅ Complete | Single-use expiring 6-digit OTP initiated by supplier, retrieved by authorized recipient, verified with brute-force protection, atomically completing reservation and listing with `handoverVerifiedAt` timestamp. |
| **Stage 5: Analytics & Metrics** | ✅ Complete | Database aggregations for supplier metrics (diverted kg, meals recovered, CO2e abatement) and recipient metrics (`/supplier/analytics`, `/recipient/analytics`). |
| **Stage 6: Test Suite & Build** | ✅ Complete | 29 Vitest automated unit/integration tests passing. Backend and frontend clean builds with zero TypeScript compiler errors. |

---

## 3. Technology Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express 4
- **Language**: TypeScript (ES2022 / CommonJS)
- **Database & ORM**: PostgreSQL via Prisma ORM 5.22
- **Validation**: Zod 3.23
- **Security & Auth**: Bcrypt.js, JsonWebToken, Helmet, CORS
- **Testing**: Vitest & Supertest
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Lucide-react

---

## 4. Repository Structure

```text
backend/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.ts                         # Express application setup & middleware
│   ├── server.ts                      # Server entry point & graceful shutdown
│   ├── config/
│   │   └── env.ts                     # Zod environment variable parsing
│   ├── lib/
│   │   └── prisma.ts                  # Prisma Client singleton & connection check
│   ├── middleware/
│   │   ├── authenticate.ts            # Bearer JWT verification & req.user injection
│   │   ├── authorizeRole.ts           # Role-based access control guard
│   │   ├── errorHandler.ts            # Centralized error handler & AppError
│   │   └── validateRequest.ts         # Zod request validation (body/query/params)
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.schemas.ts        # Register & Login input schemas
│   │   │   ├── auth.service.ts        # User registration, password verification, JWT
│   │   │   ├── auth.controller.ts     # HTTP request handlers
│   │   │   └── auth.routes.ts         # /auth routes
│   │   ├── listings/
│   │   │   ├── listings.schemas.ts    # Listing creation, update, query schemas
│   │   │   ├── listings.service.ts    # Listing management, role enforcement & claim logic
│   │   │   ├── listings.controller.ts # Listing HTTP handlers
│   │   │   └── listings.routes.ts     # /listings routes
│   │   ├── reservations/
│   │   │   ├── reservations.service.ts    # Claim management & OTP handover verification
│   │   │   ├── reservations.controller.ts # Reservation HTTP handlers
│   │   │   └── reservations.routes.ts     # /reservations routes
│   │   ├── supplier/
│   │   │   └── supplier.routes.ts     # /supplier routes (/listings, /pickups, /analytics)
│   │   ├── recipient/
│   │   │   └── recipient.routes.ts    # /recipient routes (/analytics)
│   │   ├── analytics/
│   │   │   ├── analytics.service.ts   # Database aggregation for metrics & KPIs
│   │   │   └── analytics.controller.ts# Analytics HTTP handlers
│   │   └── health/
│   │       └── health.routes.ts       # Health check with DB probe
│   └── utils/
│       ├── apiResponse.ts             # Standardized JSON response formatters
│       └── asyncHandler.ts            # Async controller wrapper
└── tests/
    ├── health.test.ts                 # Health endpoint tests
    ├── validation.test.ts             # Input & food safety validation tests
    ├── auth-middleware.test.ts        # Unauthorized & forbidden role tests
    └── claim-lifecycle.test.ts        # Atomic claim, concurrency, role & OTP tests
```

---

## 5. Database Schema (`prisma/schema.prisma`)

### Models
1. **`Organization`**: Verified business entity (`SUPPLIER`, `RECIPIENT`, `PROCESSOR`).
2. **`User`**: Credentials and profile associated with an organization.
3. **`Listing`**: Surplus food and organic waste batches (`EDIBLE`, `ORGANIC`).
4. **`Reservation`**: Single-recipient claim contracts, tracking pickup statuses and OTP handover data.

### Enums
- `UserRole`: `SUPPLIER`, `RECIPIENT`, `PROCESSOR`, `ADMIN`
- `UserStatus`: `ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`
- `VerificationStatus`: `PENDING`, `VERIFIED`, `REJECTED`
- `ListingType`: `EDIBLE`, `ORGANIC`
- `ListingStatus`: `DRAFT`, `ACTIVE`, `CLAIMED`, `COMPLETED`, `EXPIRED`, `WITHDRAWN`, `CONVERTED`
- `StorageMethod`: `AMBIENT`, `REFRIGERATED`, `FROZEN`
- `ReservationStatus`: `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `IN_TRANSIT`, `ARRIVED`, `HANDOVER_PENDING`, `COMPLETED`, `CANCELLED`, `CONFLICT`
- `PaymentStatus`: `NOT_REQUIRED`, `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`

---

## 6. Implemented API Endpoints

### Health & Telemetry
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/health` / `/api/health` | Public | Any | Reports server status, uptime, and database connection. |

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Any | Registers organization and user; returns JWT & user profile. |
| `POST` | `/api/auth/login` | Public | Any | Verifies email & password; returns JWT & user profile. |
| `GET` | `/api/auth/me` | Bearer Token | Any | Returns authenticated profile and organization details. |
| `POST` | `/api/auth/logout` | Public | Any | Confirms session termination. |

### Listings (`/api/listings`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/listings` | Public | Any | Browse active, unexpired marketplace listings (pagination & filters). |
| `GET` | `/api/listings/:id` | Public | Any | Retrieves listing detail by ID. |
| `GET` | `/api/listings/mine` | Bearer Token | `SUPPLIER` | Returns authenticated supplier organization's listings. |
| `POST` | `/api/listings` | Bearer Token | `SUPPLIER` | Creates a new surplus batch with food safety verification. |
| `PATCH` | `/api/listings/:id` | Bearer Token | `SUPPLIER` | Updates a listing (validates organization ownership). |
| `POST` | `/api/listings/:id/withdraw` | Bearer Token | `SUPPLIER` | Withdraws an active or draft listing. |
| `POST` | `/api/listings/:id/claim` | Bearer Token | `RECIPIENT`, `PROCESSOR` | Atomically claims a listing and creates reservation (enforces role rules and concurrency locks). |

### Reservations & Handover OTP (`/api/reservations`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/reservations` | Bearer Token | `RECIPIENT` | Returns recipient organization's active claims. |
| `GET` | `/api/reservations/:id` | Bearer Token | Party only | Returns reservation detail (supplier or recipient only). |
| `PATCH` | `/api/reservations/:id/status` | Bearer Token | Party only | Updates pickup/dispatch status (`IN_TRANSIT`, `ARRIVED`, etc.). |
| `POST` | `/api/reservations/:id/otp/initiate` | Bearer Token | `SUPPLIER` | Generates 6-digit expiring OTP, hashes with Bcrypt, updates status to `HANDOVER_PENDING`. |
| `GET` | `/api/reservations/:id/otp` | Bearer Token | `RECIPIENT` | Returns active 6-digit OTP for loading gate verification. |
| `POST` | `/api/reservations/:id/otp/verify` | Bearer Token | Party only | Verifies OTP against Bcrypt hash; locks after 3 attempts; transitions reservation & listing to `COMPLETED` with timestamp. |

### Supplier Portal (`/api/supplier`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/supplier/listings` | Bearer Token | `SUPPLIER` | Alias matching frontend `getMyListings()`. |
| `GET` | `/api/supplier/pickups` | Bearer Token | `SUPPLIER` | Returns all reservations and pickups for the supplier. |
| `GET` | `/api/supplier/analytics` | Bearer Token | `SUPPLIER` | Aggregated metrics (total diverted kg, CO2e abatement, active listings, recovery rate). |

### Recipient Portal (`/api/recipient`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/recipient/analytics` | Bearer Token | `RECIPIENT`, `PROCESSOR` | Aggregated metrics (total claimed kg, meals served, active pickups). |

---

## 7. Business & Security Rules Enforced

1. **Food-Safety SLA**:
   - Edible food requires a declared `safeUntil` timestamp.
   - `collectionDeadline` cannot exceed the `safeUntil` deadline.
   - Expired listings cannot be newly claimed (`410 LISTING_EXPIRED`).
2. **Role Restrictions**:
   - `PROCESSOR` role cannot claim `EDIBLE` surplus batches meant for human consumption (`403 ROLE_RESTRICTION`).
   - `RECIPIENT` and `PROCESSOR` can claim `ORGANIC` biomass batches.
3. **Single-Recipient Concurrency Protection**:
   - Claims execute inside an atomic Prisma database transaction.
   - Listing status transitions to `CLAIMED` immediately upon claim.
   - Subsequent or concurrent claims return `409 ALREADY_CLAIMED`.
4. **No Self-Dealing**:
   - Suppliers cannot claim their own surplus listings (`400 SELF_CLAIM_NOT_ALLOWED`).
5. **Role & Ownership Authorization**:
   - Updates, withdrawals, and pickup reviews verify organization identity (`403 FORBIDDEN`).
   - Client-supplied IDs cannot override the authenticated JWT identity (`req.user`).
6. **Handover OTP Security**:
   - 6-digit numeric token generated server-side with 15-minute expiration.
   - Stored as a Bcrypt hash in the database.
   - Strict brute-force limit: max 3 attempts before locking (`429 OTP_LOCKED`).
   - Atomically records `handoverVerifiedAt` and clears single-use OTP hash upon completion.

---

## 8. Automated Test Results

The test suite executed with Vitest:

```text
 ✓ tests/validation.test.ts (8 tests)
 ✓ tests/auth-middleware.test.ts (5 tests)
 ✓ tests/claim-lifecycle.test.ts (13 tests)
 ✓ tests/health.test.ts (3 tests)

Test Files  4 passed (4)
Tests       29 passed (29)
Duration    9.09s
```

All 29 tests pass with 100% success rate:
- Health check payload formatting & 404 route handling.
- Registration schema validation and email normalization.
- Rejection of invalid emails and short passwords.
- Edible listing `safeUntil` mandatory requirement.
- Rejection of negative weights.
- Bearer token authentication checks (missing & corrupted token rejection).
- Role restriction checks (`RECIPIENT` cannot create listings; `SUPPLIER` cannot claim).
- Duplicate email rejection (`409 EMAIL_EXISTS`).
- Wrong password rejection (`401 INVALID_CREDENTIALS`).
- Listing cross-organization modification rejection (`403 FORBIDDEN`).
- Rejection of updates on withdrawn/claimed listings (`400 INVALID_STATUS`).
- Single-claim collision prevention (`409 ALREADY_CLAIMED`).
- Supplier self-claim rejection (`400 SELF_CLAIM_NOT_ALLOWED`).
- Expired edible surplus rejection (`410 LISTING_EXPIRED`).
- **Role restriction on PROCESSOR claiming edible food (`403 ROLE_RESTRICTION`)**.
- **Handover OTP initiation rejection for unauthorized organizations (`403 FORBIDDEN`)**.
- **Handover OTP generation by supplier with `HANDOVER_PENDING` transition**.
- **Handover OTP retrieval by assigned recipient and rejection for outsiders (`403 FORBIDDEN`)**.
- **Handover OTP invalid code rejection and attempt counter increment (`400 INVALID_OTP`)**.
- **Handover OTP atomic verification and completion (`COMPLETED` status and timestamp)**.

---

## 9. Setup & Running Instructions

### 1. Database Setup
Ensure PostgreSQL is accessible. You can use a local PostgreSQL instance or a free cloud provider like [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).

In `backend/.env`:
```ini
DATABASE_URL="postgresql://username:password@localhost:5432/refood_db?schema=public"
JWT_SECRET="your_secure_random_key_at_least_32_characters_long"
PORT=5000
FRONTEND_ORIGIN="http://localhost:5173,http://localhost:5174"
```

Run database migrations:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 2. Run the Backend Server
```bash
cd backend
npm run dev
# Server listens on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 3. Run Backend Test Suite
```bash
cd backend
npm test
```

### 4. Run the Frontend Client
In the project root directory:
```bash
# Verify root .env contains:
# VITE_API_BASE_URL=http://localhost:5000/api

npm run dev
# Frontend runs on http://localhost:5173 or http://localhost:5174
```

---

## 10. Completed Core Demonstration Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Supplier as Supplier (Hotel/Restaurant)
    actor Recipient as Recipient (NGO / Food Bank)
    participant Backend as Express + Prisma API
    participant DB as PostgreSQL Database

    Note over Supplier,DB: Step A: Registration & Login
    Supplier->>Backend: POST /api/auth/register (Role: SUPPLIER)
    Backend->>DB: Create Organization & User
    Backend-->>Supplier: JWT Token + Profile

    Recipient->>Backend: POST /api/auth/register (Role: RECIPIENT)
    Backend->>DB: Create Organization & User
    Backend-->>Recipient: JWT Token + Profile

    Note over Supplier,DB: Step B: Listing Creation
    Supplier->>Backend: POST /api/listings (Edible batch, safeUntil)
    Backend->>DB: Save Listing (status: ACTIVE)
    Backend-->>Supplier: Formatted Listing

    Note over Recipient,DB: Step C: Marketplace Browsing
    Recipient->>Backend: GET /api/listings (unexpired, status: ACTIVE)
    Backend->>DB: Query listings
    Backend-->>Recipient: Available listings

    Note over Recipient,DB: Step D: Atomic Claim
    Recipient->>Backend: POST /api/listings/:id/claim
    Backend->>DB: Transaction: listing.status = CLAIMED, create Reservation
    Backend-->>Recipient: Confirmed Reservation

    Note over Supplier,DB: Step E & F: Status Progression
    Supplier->>Backend: PATCH /api/reservations/:id/status (ARRIVED)
    Backend->>DB: Update reservation status
    Backend-->>Supplier: Status updated

    Note over Supplier,DB: Step G: OTP Handover Initiation
    Supplier->>Backend: POST /api/reservations/:id/otp/initiate
    Backend->>DB: Generate 6-digit OTP, store Bcrypt hash, status = HANDOVER_PENDING
    Backend-->>Supplier: otpReady: true, expiresIn: 900s

    Recipient->>Backend: GET /api/reservations/:id/otp
    Backend-->>Recipient: 6-digit OTP code

    Note over Supplier,DB: Step H: Handover Verification & Completion
    Supplier->>Backend: POST /api/reservations/:id/otp/verify (inputOtp)
    Backend->>DB: Transaction: verify Bcrypt hash, clear OTP, reservation.status = COMPLETED, listing.status = COMPLETED, timestamp recorded
    Backend-->>Supplier: success: true, verifiedAt, finalWeightKg

    Note over Supplier,DB: Step I: Real-time Analytics
    Supplier->>Backend: GET /api/supplier/analytics
    Backend->>DB: Aggregate completed kilograms & CO2e avoided
    Backend-->>Supplier: Dashboard KPIs
```

---

## 11. Known Limitations & Scope Control

1. **Payment Gateway**: Paid listings initialize with `paymentStatus: 'PENDING'`. No fake payment simulation is fabricated. Payments are marked explicitly pending until real Razorpay/Stripe webhooks are configured.
2. **Chat & Push Notifications**: WebSocket real-time messaging is stubbed cleanly; operational messaging is conveyed via persisted reservation status and OTP handovers.
3. **Database Connectivity Requirement**: The backend server is designed to boot gracefully even if PostgreSQL is offline (reporting `connected: false` in degraded status). For full live data persistence, provide a valid connection string to PostgreSQL in `backend/.env` and execute `npx prisma migrate dev`.
