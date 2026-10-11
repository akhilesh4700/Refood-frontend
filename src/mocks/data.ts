// Mock data types and data for ReFood platform
// Locale: Bengaluru, India (IST, INR, Indian addresses)

export type StreamType = 'edible' | 'organic' | 'urgent';

export interface Listing {
  id: string;
  title: string;
  description: string;
  stream: StreamType;
  weightKg: number;
  portions: number;
  imageUrl: string;
  temperature: string;
  distance: number; // km
  supplier: string;
  location: string;
  pickupSlot: string;
  expiresAt: Date;
  createdAt: Date;
  allergens: string[];
  packagingNote: string;
  category: string;
  auditReady: boolean;
  coldChain: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
  rating: number;
  totalTransfers: number;
  totalKgDonated: number;
  partnerSince: string;
  coordinator: string;
  coordinatorRole: string;
  coordinatorPhone: string;
  haccp: string;
}

export interface Recipient {
  id: string;
  name: string;
  type: string;
  kgDelivered: number;
  meals: number;
  progressPct: number;
}

export interface Reservation {
  id: string;
  listingId: string;
  status: 'reserved' | 'ready' | 'in-transit' | 'completed';
  step: number;
  otpPin: string;
  otp: string;
  targetHandover: string;
  pickupAddress: string;
  driverName: string;
  driverVehicle: string;
  driverInitials: string;
}

export interface Pickup {
  id: string;
  time: string;
  recipient: string;
  allocationKg: number;
  driverName: string;
  driverInitials: string;
  driverVehicle: string;
  driverPhone: string;
  otp: string;
}

export interface ImpactMetrics {
  period: string;
  totalRescuedKg: number;
  co2PreventedT: number;
  organicProcessedKg: number;
  coordinationIndex: number;
  monthlyData: MonthlyData[];
}

export interface MonthlyData {
  month: string;
  shelter: number;
  biogas: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isMine: boolean;
}

// ─── Mock Supplier ────────────────────────────────────────────────────────────
export const mockSupplier: Supplier = {
  id: 'sup-001',
  name: 'Hotel Grand Royale',
  logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=80&h=80&fit=crop',
  verified: true,
  rating: 4.9,
  totalTransfers: 148,
  totalKgDonated: 3420,
  partnerSince: '2022',
  coordinator: 'Chef Marco Paul',
  coordinatorRole: 'Head Steward',
  coordinatorPhone: '+91 99800 12041',
  haccp: 'FSSAI-KA-2022-048291',
};

// ─── Mock Listings ────────────────────────────────────────────────────────────
const now = new Date();
const inHours = (h: number) => new Date(now.getTime() + h * 3600_000);

export const mockListings: Listing[] = [
  {
    id: 'RF-49221',
    title: 'Assorted Gourmet Pastries & Buns',
    description: 'Fresh-baked artisan pastries from morning breakfast buffet. Mixed selection.',
    stream: 'edible',
    weightKg: 22,
    portions: 45,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=400&fit=crop',
    temperature: 'Safe Temp 18°C',
    distance: 1.4,
    supplier: 'Metropolitan Bakery & Café',
    location: 'Indiranagar, Bengaluru',
    pickupSlot: 'Today 17:00 – 19:00',
    expiresAt: inHours(2),
    createdAt: new Date(now.getTime() - 3600_000),
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    packagingNote: 'Boxed in food-grade trays',
    category: 'Bakery & Pastries',
    auditReady: true,
    coldChain: false,
  },
  {
    id: 'RF-49222',
    title: 'Chilled Catering Trays: Mediterranean Bowls',
    description: 'High-protein catering trays prepared for corporate lunch. Chilled at 3°C.',
    stream: 'edible',
    weightKg: 35,
    portions: 80,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
    temperature: 'Chilled 3°C',
    distance: 3.1,
    supplier: 'TechPark Cafeteria',
    location: 'Whitefield, Bengaluru',
    pickupSlot: 'Today 18:30 – 20:00',
    expiresAt: inHours(3.33),
    createdAt: new Date(now.getTime() - 1800_000),
    allergens: ['Gluten', 'Dairy (Yoghurt)'],
    packagingNote: 'Deep Gastronorm trays, sealed foil',
    category: 'Catering / Prepared Meals',
    auditReady: true,
    coldChain: true,
  },
  {
    id: 'RF-49223',
    title: 'Clean Vegetable Scraps & Coffee Chaff',
    description: 'Carbon-rich composting inputs. Ideal C:N ratio. No contamination.',
    stream: 'organic',
    weightKg: 85,
    portions: 0,
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop',
    temperature: 'Ambient',
    distance: 2.8,
    supplier: 'Roast & Root Organics',
    location: 'HSR Layout, Bengaluru',
    pickupSlot: 'Within 24h Window',
    expiresAt: inHours(24),
    createdAt: new Date(now.getTime() - 7200_000),
    allergens: [],
    packagingNote: 'Biodegradable bags',
    category: 'Compost / Horticulture',
    auditReady: true,
    coldChain: false,
  },
  {
    id: 'RF-49224',
    title: 'Surplus Fresh Dairy & Yogurt Pallet',
    description: 'Unbroken factory-sealed cold chain. Temperature logged continuously.',
    stream: 'edible',
    weightKg: 40,
    portions: 120,
    imageUrl: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=600&h=400&fit=crop',
    temperature: 'Unbroken Chain 1°C',
    distance: 4.2,
    supplier: 'GreenGrocer Supermarket',
    location: 'Koramangala, Bengaluru',
    pickupSlot: 'Tomorrow 12:00',
    expiresAt: inHours(18),
    createdAt: new Date(now.getTime() - 900_000),
    allergens: ['Dairy'],
    packagingNote: '40 Units / Crates, Factory Sealed',
    category: 'Dairy & Cold Foods',
    auditReady: true,
    coldChain: true,
  },
  {
    id: 'RF-49225',
    title: 'Brewery Spent Grains & Yeast Mash',
    description: 'High protein animal feed / biogas input. Nutritional density verified.',
    stream: 'organic',
    weightKg: 150,
    portions: 0,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    temperature: 'Ambient',
    distance: 5.6,
    supplier: 'Artisan Craft Brewery',
    location: 'Bannerghatta Road, Bengaluru',
    pickupSlot: 'Fresh Batch Today',
    expiresAt: inHours(48),
    createdAt: new Date(now.getTime() - 10800_000),
    allergens: ['Gluten'],
    packagingNote: 'Bulk Weight 150kg (Barrels). Forklift Access.',
    category: 'Biogas & Animal Feed',
    auditReady: false,
    coldChain: false,
  },
  {
    id: 'RF-49226',
    title: 'Fresh Seasonal Salad Boxes',
    description: 'Ready-to-eat salad boxes. Immediate pickup required.',
    stream: 'urgent',
    weightKg: 15,
    portions: 35,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
    temperature: 'Chilled 4°C',
    distance: 0.7,
    supplier: 'SaladWorks Express',
    location: 'MG Road, Bengaluru',
    pickupSlot: '1h 30m remaining!',
    expiresAt: inHours(1.5),
    createdAt: new Date(now.getTime() - 300_000),
    allergens: ['Nuts'],
    packagingNote: '15kg (35 packs)',
    category: 'Ready-to-Eat',
    auditReady: true,
    coldChain: true,
  },
];

// ─── Mock Pickups ─────────────────────────────────────────────────────────────
export const mockPickups: Pickup[] = [
  {
    id: 'PU-001',
    time: '14:30 IST',
    recipient: 'City Harvest NGO',
    allocationKg: 22,
    driverName: 'Ravi Kumar',
    driverInitials: 'RK',
    driverVehicle: 'Tata Ace · KA 09 MN 4421',
    driverPhone: '+91 98765 43210',
    otp: '7492',
  },
  {
    id: 'PU-002',
    time: '16:00 IST',
    recipient: 'Asha Foundation Shelter',
    allocationKg: 35,
    driverName: 'Priya Sharma',
    driverInitials: 'PS',
    driverVehicle: 'Mahindra Bolero · KA 05 PQ 7831',
    driverPhone: '+91 91234 56789',
    otp: '2183',
  },
];

// ─── Mock Reservation ─────────────────────────────────────────────────────────
export const mockReservation: Reservation = {
  id: 'RF-84920',
  listingId: 'RF-49222',
  status: 'ready',
  step: 2,
  otpPin: '749 – 218',
  otp: '749218',
  targetHandover: '17:45 IST',
  pickupAddress: 'Hotel Grand Royale, Loading Dock – Service Bay 4, 100 Orchid Bird Road, Koramangala, Bengaluru 560034',
  driverName: 'Ravi Kumar',
  driverVehicle: 'Tata Ace · KA 09 MN 4421',
  driverInitials: 'RK',
};

// ─── Mock Recipients ──────────────────────────────────────────────────────────
export const mockRecipients: Recipient[] = [
  {
    id: 'rec-001',
    name: 'Hope Community Foodbank',
    type: 'Shelter',
    kgDelivered: 2430,
    meals: 5620,
    progressPct: 84,
  },
  {
    id: 'rec-002',
    name: 'St. Jude Youth Shelter',
    type: 'Youth Outreach',
    kgDelivered: 1510,
    meals: 3490,
    progressPct: 62,
  },
  {
    id: 'rec-003',
    name: 'GreenCycle Composting',
    type: 'Soil / Bio',
    kgDelivered: 1920,
    meals: 0,
    progressPct: 45,
  },
];

// ─── Mock Chat Messages ───────────────────────────────────────────────────────
export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-001',
    sender: 'Chef Marco Paul',
    text: 'Hi! Pickup confirmed for 17:45. Please use Loading Dock Bay 4.',
    timestamp: '14:22 IST',
    isMine: true,
  },
  {
    id: 'msg-002',
    sender: 'Priya – City Harvest',
    text: 'Confirmed! Our driver Ravi will be there by 17:30. Do we need food-grade containers?',
    timestamp: '14:24 IST',
    isMine: false,
  },
  {
    id: 'msg-003',
    sender: 'Chef Marco Paul',
    text: 'Yes please bring GN trays or insulated boxes. We have 35kg of chilled catering trays ready.',
    timestamp: '14:26 IST',
    isMine: true,
  },
  {
    id: 'msg-004',
    sender: 'Priya – City Harvest',
    text: 'Perfect. Ravi has insulated containers in the vehicle. OTP code received ✓',
    timestamp: '14:28 IST',
    isMine: false,
  },
];

// ─── Mock Impact Metrics ──────────────────────────────────────────────────────
export const mockImpactMetrics: Record<string, ImpactMetrics> = {
  '30d': {
    period: 'Last 30 Days',
    totalRescuedKg: 4850,
    co2PreventedT: 12.4,
    organicProcessedKg: 1920,
    coordinationIndex: 98.5,
    monthlyData: [
      { month: 'May', shelter: 3820, biogas: 980 },
      { month: 'Jun', shelter: 4150, biogas: 1100 },
      { month: 'Jul', shelter: 4609, biogas: 1250 },
      { month: 'Aug', shelter: 4910, biogas: 1380 },
      { month: 'Sep', shelter: 4420, biogas: 1290 },
      { month: 'Oct', shelter: 5100, biogas: 1670 },
    ],
  },
  'q3': {
    period: 'Q3 2024',
    totalRescuedKg: 13200,
    co2PreventedT: 33.8,
    organicProcessedKg: 5400,
    coordinationIndex: 97.8,
    monthlyData: [
      { month: 'Jul', shelter: 4200, biogas: 1150 },
      { month: 'Aug', shelter: 4600, biogas: 1300 },
      { month: 'Sep', shelter: 4400, biogas: 1250 },
    ],
  },
  'ytd': {
    period: 'Year-to-Date',
    totalRescuedKg: 42500,
    co2PreventedT: 94.2,
    organicProcessedKg: 16800,
    coordinationIndex: 98.1,
    monthlyData: [
      { month: 'Jan', shelter: 3200, biogas: 800 },
      { month: 'Feb', shelter: 3400, biogas: 900 },
      { month: 'Mar', shelter: 3800, biogas: 1000 },
      { month: 'Apr', shelter: 4000, biogas: 1100 },
      { month: 'May', shelter: 3820, biogas: 980 },
      { month: 'Jun', shelter: 4150, biogas: 1100 },
      { month: 'Jul', shelter: 4609, biogas: 1250 },
      { month: 'Aug', shelter: 4910, biogas: 1380 },
      { month: 'Sep', shelter: 4420, biogas: 1290 },
      { month: 'Oct', shelter: 5100, biogas: 1670 },
    ],
  },
  'lifetime': {
    period: 'Lifetime',
    totalRescuedKg: 86400,
    co2PreventedT: 188.5,
    organicProcessedKg: 34200,
    coordinationIndex: 97.2,
    monthlyData: [
      { month: 'Q1 23', shelter: 8000, biogas: 2000 },
      { month: 'Q2 23', shelter: 9500, biogas: 2400 },
      { month: 'Q3 23', shelter: 10200, biogas: 2800 },
      { month: 'Q4 23', shelter: 11000, biogas: 3100 },
      { month: 'Q1 24', shelter: 11200, biogas: 3200 },
      { month: 'Q2 24', shelter: 12000, biogas: 3500 },
    ],
  },
};
