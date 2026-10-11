# ReFood Backend Architecture & Implementation Status

## 1. Executive Summary

This milestone establishes the production-ready Node.js, Express, TypeScript, and Prisma ORM backend foundation for **ReFood** — the B2B food surplus recovery, redistribution, and organic waste recovery platform.

The implementation provides:
- Secure JWT-based authentication with Bcrypt password hashing.
- Role-based authorization (`SUPPLIER`, `RECIPIENT`, `PROCESSOR`, `ADMIN`).
- Normalized relational database schema in PostgreSQL via Prisma.
- Full CRUD & lifecycle management for surplus listings.
- Atomic, single-recipient claim operation with food-safety deadline enforcement and concurrency conflict protection.
- Centralized error handling and request validation using Zod.
- Dual endpoint mounting (`/api/*` and `/*`) providing 100% compatibility with the Vite React frontend.

---

## 2. Completed Milestones & Stages

| Stage | Status | Description |
|---|---|---|
| **Stage A: Inspection** | ✅ Complete | Inspected existing codebase; replaced mock FastAPI files with the modern TypeScript stack. |
| **Stage B: Server Foundation** | ✅ Complete | Server bootstrap (`server.ts`, `app.ts`), Zod environment validation (`env.ts`), health check, and centralized error handling. |
| **Stage C: Database & Auth** | ✅ Complete | Prisma schema with 4 core models, 5 enums, Bcrypt hashing, JWT issuance, `POST /auth/register`, `POST /auth/login`, `GET /auth/me`. |
| **Stage D: Listings & Claim** | ✅ Complete | Listings API (`/listings`, `/supplier/listings`), food safety rules, and atomic transactional claim with single-claim enforcement (`POST /listings/:id/claim`). |
| **Stage E: Verification & Tests** | ✅ Complete | Vitest test suite with 23 passed unit and integration tests covering security, validation, and concurrency. |

---

## 3. Technology Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express 4
- **Language**: TypeScript (ES2022 / CommonJS)
- **Database & ORM**: PostgreSQL via Prisma ORM 5.22
- **Validation**: Zod 3.23
- **Security & Auth**: Bcrypt.js, JsonWebToken, Helmet, CORS
- **Testing**: Vitest & Supertest

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
│   │   │   ├── listings.service.ts    # Listing management & atomic claim logic
│   │   │   ├── listings.controller.ts # Listing HTTP handlers
│   │   │   └── listings.routes.ts     # /listings routes
│   │   ├── reservations/
│   │   │   ├── reservations.service.ts
│   │   │   ├── reservations.controller.ts
│   │   │   └── reservations.routes.ts # /reservations routes
│   │   ├── supplier/
│   │   │   └── supplier.routes.ts     # /supplier routes (/listings, /pickups)
│   │   └── health/
│   │       └── health.routes.ts       # Health check with DB probe
│   └── utils/
│       ├── apiResponse.ts             # Standardized JSON response formatters
│       └── asyncHandler.ts            # Async controller wrapper
└── tests/
    ├── health.test.ts                 # Health endpoint tests
    ├── validation.test.ts             # Input & food safety validation tests
    ├── auth-middleware.test.ts        # Unauthorized & forbidden role tests
    └── claim-lifecycle.test.ts        # Atomic claim, concurrency & ownership tests
```

---

## 5. Database Models (`prisma/schema.prisma`)

### `Organization`
Represents verified business entities (suppliers, NGOs, bio-processors).
- `id` (UUID, PK)
- `name`, `type`, `address`, `city`, `state`, `postalCode`, `phone`
- `verificationStatus` (`PENDING`, `VERIFIED`, `REJECTED`)
- Relations: `users`, `listings`, `reservations`

### `User`
User credentials associated with an organization.
- `id` (UUID, PK)
- `email` (Unique, lowercase normalized)
- `passwordHash` (Bcrypt)
- `name`
- `role` (`SUPPLIER`, `RECIPIENT`, `PROCESSOR`, `ADMIN`)
- `status` (`ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`)
- `organizationId` (FK -> `Organization.id`)

### `Listing`
Surplus food and organic waste batches.
- `id` (UUID, PK)
- `supplierOrgId` (FK -> `Organization.id`)
- `title`, `description`
- `type` (`EDIBLE`, `ORGANIC`)
- `status` (`DRAFT`, `ACTIVE`, `CLAIMED`, `COMPLETED`, `EXPIRED`, `WITHDRAWN`, `CONVERTED`)
- `category`, `subcategory`
- `weightKg` (`Decimal(10, 2)`)
- `portions` (`Int?`)
- `storageMethod` (`AMBIENT`, `REFRIGERATED`, `FROZEN`)
- `allergens` (`String[]`)
- `safeUntil` (`DateTime?`, required for `EDIBLE`)
- `earliestPickup`, `collectionDeadline` (`DateTime`)
- `pickupAddress`, `pickupInstructions`, `onSiteContact`, `onSitePhone`
- `isFree` (`Boolean`), `price` (`Decimal?`), `currency` (`String?`)

### `Reservation`
Single-recipient claim contracts.
- `id` (UUID, PK)
- `listingId` (FK -> `Listing.id`)
- `recipientOrgId` (FK -> `Organization.id`)
- `claimedById` (FK -> `User.id`)
- `status` (`PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `IN_TRANSIT`, `ARRIVED`, `HANDOVER_PENDING`, `COMPLETED`, `CANCELLED`, `CONFLICT`)
- `paymentStatus` (`NOT_REQUIRED`, `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`)
- `quantityClaimedKg`, `priceAgreed`
- `pickupAddress`, `earliestPickup`, `collectionDeadline`
- `otpHash`, `otpExpiresAt`, `otpAttempts`, `handoverVerifiedAt`

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
| `POST` | `/api/listings/:id/claim` | Bearer Token | `RECIPIENT`, `PROCESSOR` | Atomically claims a listing and creates reservation (single-claim protected). |

### Supplier Portal (`/api/supplier`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/supplier/listings` | Bearer Token | `SUPPLIER` | Alias matching frontend `getMyListings()`. |
| `GET` | `/api/supplier/pickups` | Bearer Token | `SUPPLIER` | Returns all reservations and pickups for the supplier. |

### Reservations (`/api/reservations`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/reservations` | Bearer Token | `RECIPIENT` | Returns recipient organization's active claims. |
| `GET` | `/api/reservations/:id` | Bearer Token | Party only | Returns reservation detail (supplier or recipient only). |
| `PATCH` | `/api/reservations/:id/status` | Bearer Token | Party only | Updates pickup/dispatch status (e.g., `IN_TRANSIT`, `ARRIVED`). |

---

## 7. Business & Security Rules Enforced

1. **Food-Safety SLA**:
   - Edible food requires a declared `safeUntil` timestamp.
   - `collectionDeadline` cannot be scheduled beyond the `safeUntil` deadline.
   - An expired listing cannot be newly claimed (returns `410 LISTING_EXPIRED`).
2. **Single-Recipient Claim Protection**:
   - `claimListing` executes inside a Prisma database transaction.
   - When a claim is accepted, the listing status updates atomically to `CLAIMED`.
   - Concurrent or repeat claim attempts return `409 ALREADY_CLAIMED`.
3. **No Self-Dealing**:
   - Supplier organizations cannot claim their own surplus listings (returns `400 SELF_CLAIM_NOT_ALLOWED`).
4. **Ownership Verification**:
   - Updates and withdrawals verify `listing.supplierOrgId === req.user.organizationId` (returns `403 FORBIDDEN`).
5. **No Password Leaks**:
   - Safe user formatters strip password hashes and internal security metadata.
6. **No Fake Transactions**:
   - Free listings have `paymentStatus: 'NOT_REQUIRED'`; paid listings initialize with `PENDING` awaiting provider integration.

---

## 8. Verification & Test Results

The test suite executed with Vitest:

```text
 ✓ tests/validation.test.ts (8 tests)
 ✓ tests/claim-lifecycle.test.ts (7 tests)
 ✓ tests/health.test.ts (3 tests)
 ✓ tests/auth-middleware.test.ts (5 tests)

Test Files  4 passed (4)
Tests       23 passed (23)
Duration    2.14s
```

All 23 tests passed:
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

---

## 9. Setup & Running Instructions

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Set your PostgreSQL connection string:
```ini
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/refood_db?schema=public"
JWT_SECRET="your_secure_random_key_at_least_32_characters_long"
FRONTEND_ORIGIN="http://localhost:5173"
```

### 3. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Run Test Suite
```bash
npm test
```

### 6. Connect Frontend to Backend
In root `.env` or `vite.config.ts`, configure:
```ini
VITE_API_BASE_URL="http://localhost:5000/api"
```

---

## 10. Next Milestone Tasks (Prepared Integration Points)

1. **OTP Handover Verification**:
   - `initiateHandoverOtp`: Generate 6-digit numeric token server-side, store Bcrypt hash with 15-minute expiration in `Reservation.otpHash`.
   - `verifyHandoverOtp`: Validate token, verify within 3 maximum attempts, record `handoverVerifiedAt`, and transition status to `COMPLETED`.
2. **Real-time Coordination Chat**:
   - WebSocket / Server-Sent Events gateway for driver-to-dock messaging.
3. **Multi-part Image Upload**:
   - S3 / Cloudflare R2 presigned URL generation for verified kitchen tray photos.
4. **Analytics Aggregator**:
   - PostgreSQL query aggregator for `SupplierMetrics` (confirmed diverted kg, ESG CO2e abatements) and `RecipientMetrics`.
