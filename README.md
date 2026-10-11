# ReFood — Circular Food Surplus & Recovery Network

A B2B enterprise climate-tech platform connecting food suppliers (hotels, bakeries, caterers, supermarkets) with verified recipients (NGOs, shelters, food banks) and bio-conversion processors (composters, biogas units).

Set in **Bengaluru, India** with INR (₹) figures, IST timestamps, local logistics hubs, and FSSAI Good Samaritan regulatory standards.

---

## 🚀 Quick Start

### 1. Frontend (React 19 + TypeScript + Vite + Tailwind CSS)

```bash
cd scratch/refood
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Backend (FastAPI + Pydantic + Uvicorn)

```bash
cd scratch/refood/backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Interactive API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 📱 Pages & Complete Routing Workflow

| Route | Page Name | Key Features |
|---|---|---|
| `/` | **Landing / Onboarding** | Split hero with "Zero Broker Markup Protocol", 3 trust ticks, instant access role cards (Supplier vs Recipient), 4s rotating live feed ticker, impact stats, modal login/signup. |
| `/dashboard` | **Supplier Dashboard** | Soft mint hero banner ("Hotel Grand Royale"), 4 StatCards with live counters, segmented active inventory filter (All / Human / Organic), today's scheduled pickups with driver contact & 4-digit release OTP, verified chain-of-custody timeline. |
| `/listings` | **Browse Marketplace** | Live telemetry banner, search + interactive radius slider (1–25 km), stream filter chips, 3 metric summary tiles, responsive listing grid, sticky spatial radius map with consolidated multi-stop route suggestions. |
| `/listings/new` | **Create Listing Form** | 6 numbered form sections with real-time validation (zod + react-hook-form), allergen toggle chips, storage tiles, drag-and-drop photo upload, sticky live preview card, instant CO2e & water savings calculator, toast notification on publish. |
| `/listings/:id` | **Listing Detail** | Live ticking countdown timer for perishable SLA, core temperature & tray count overlay chips, 3 quality checkpoints (HACCP compliant, tamper-sealed, traceability ID), itemized container manifest table, supplier profile with coordinator contact, sticky action card with 1-click batch reservation. |
| `/reservations/:id` | **Active Pickup Order** | 4-step interactive Stepper, live SVG QR code (`qrcode.react`) & authorization PIN, live coordination chat channel with auto-scroll and validation, mandatory 3-point handover checklist (temp, seals, weight) that unlocks pickup completion. |
| `/analytics` | **Sustainability & Impact** | Verifiable audit stream for GHG Scope 3, segmented range selector (30d / Q3 / YTD / Lifetime), 4 glowing KPI cards, ReFood AI Matcher recommendation banner, stacked monthly diversion bar chart (Recharts), top recipient leaderboard, 1-click ESG report JSON download. |
| `/notifications` | **Activity Feed** | Real-time activity notifications with stream color-coded icons, unread badges, timestamps, direct action links, and "Mark All as Read" control. |

---

## 🎨 Enterprise Climate-Tech Design Tokens

- **Edible Surplus (Human Food)**: `#0E6B45` (Primary Green) / `#DDF7EE` (Mint Soft)
- **Organic Biomass (Biogas / Compost)**: `#B8650A` (Amber) / `#FBEBDD` (Amber Soft)
- **Urgent / Expiring SLA**: `#C62828` (Crimson) / `#FDE7E7` (Danger Soft)
- **Page Background**: `#F6F7FB` (Cool lavender-grey)
- **Cards & Surfaces**: `#FFFFFF` with soft shadows
- **Typography**: Google Font *Plus Jakarta Sans*

---

## 🔌 Connecting Frontend to the FastAPI Backend

The frontend features a clean typed API abstraction layer at `src/api/index.ts`. By default, it runs with realistic simulated 300ms network latency.

To point the frontend to the live FastAPI backend, set the environment variable:

```bash
# In .env or .env.local
VITE_API_BASE_URL=http://localhost:8000
```
