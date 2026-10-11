import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Filter,
  Package,
  Truck,
  BarChart3,
  Award,
  Leaf,
  ChevronRight,
  MessageSquare,
  Zap,
  FileText,
  Eye,
  Clock,
  MapPin,
  Thermometer,
  Building2,
  HeartHandshake,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { cn } from '../components/ui/utils';
import {
  getListings,
  getTodayPickups,
  getActiveUser,
  subscribeToDataChanges,
  type ActiveUser
} from '../api';
import { timeLeft, formatKg } from '../lib/formatters';
import { useRolePaths } from '../lib/useRolePaths';
import type { Listing, Pickup } from '../mocks/data';

type FilterVal = 'all' | 'human' | 'organic';

export function Dashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [filter, setFilter] = useState<FilterVal>('all');
  const [loading, setLoading] = useState(true);
  const [otpTimer, setOtpTimer] = useState(6150);
  const [currentUser, setCurrentUser] = useState<ActiveUser>(getActiveUser());
  const [authorizedOtp, setAuthorizedOtp] = useState(false);

  const loadData = async () => {
    const [l, p] = await Promise.all([getListings(), getTodayPickups()]);
    setListings(l);
    setPickups(p);
    setCurrentUser(getActiveUser());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(() => {
      loadData();
    });
    return unsub;
  }, []);

  useEffect(() => {
    const t = setInterval(() => setOtpTimer((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = listings.filter((l) => {
    if (filter === 'human') return l.stream === 'edible' || l.stream === 'urgent';
    if (filter === 'organic') return l.stream === 'organic';
    return true;
  });

  const edibleCount = listings.filter((l) => l.stream === 'edible' || l.stream === 'urgent').length;
  const organicCount = listings.filter((l) => l.stream === 'organic').length;
  const totalWeight = listings.reduce((sum, l) => sum + (l.weightKg || 0), 0) + 3420;
  const totalGhg = ((totalWeight * 2.5) / 1000).toFixed(1);

  const isSupplier = currentUser.role === 'supplier';
  const nextPickup = pickups[0];
  const paths = useRolePaths();

  if (loading) return <Skeleton />;

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-8 space-y-8">
      {/* Hero banner */}
      <div
        className={cn(
          'relative rounded-[20px] overflow-hidden p-8 text-white transition-all shadow-md',
          isSupplier
            ? 'bg-gradient-to-r from-[#0E6B45] to-[#0A5234]'
            : 'bg-gradient-to-r from-[#0E4F6B] to-[#0A3352]'
        )}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #7EE8C8 0%, transparent 60%)' }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-[#7EE8C8]/20 text-[#7EE8C8] text-xs font-bold border border-[#7EE8C8]/30">
                {isSupplier ? 'Audited Food Safety Partner' : 'Certified Food Recovery NGO'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-medium">
                {isSupplier ? 'HACCP ID: FSSAI-KA-2022-048291' : 'DARPAN ID: KA/2021/02849'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-medium">
                DAILY LOG SYNC ACTIVE
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              {isSupplier ? 'Hotel Grand Royale · Culinary' : 'Robin Hood Army · Bengaluru Hub'}
            </h1>
            <p className="mt-1.5 text-xs text-white/80 max-w-xl">
              {isSupplier
                ? 'Central Kitchen & Banqueting Hub · Koramangala, Bengaluru · Good Samaritan & FSSAI Compliant'
                : 'Decentralized Night Shelter & Micro-Pantry Network · Operating 18 Cold-Chain Dispatch Points'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            {isSupplier ? (
              <>
                <Link to={paths.listingNew}>
                  <Button variant="secondary" className="gap-2 bg-[#7EE8C8] text-[#0A5234] hover:bg-[#5dd9b5] font-bold text-xs px-4 py-2.5">
                    <Plus size={16} /> List Surplus Food
                  </Button>
                </Link>
                <Link to={paths.listings}>
                  <Button variant="ghost" className="text-white border border-white/20 hover:bg-white/10 text-xs px-4 py-2.5">
                    Browse All Listings
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to={paths.listings}>
                  <Button variant="secondary" className="gap-2 bg-[#7EE8C8] text-[#0A3352] hover:bg-[#5dd9b5] font-bold text-xs px-4 py-2.5">
                    <HeartHandshake size={16} /> Browse & Claim Surplus
                  </Button>
                </Link>
                <Link to={paths.reservations}>
                  <Button variant="ghost" className="text-white border border-white/20 hover:bg-white/10 text-xs px-4 py-2.5">
                    View Active Order
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isSupplier ? 'Live Inventory' : 'Available in Sector'}
          value={listings.length}
          unit="Batches"
          sub="Updated in real time"
          chips={[
            { label: `${edibleCount} Edible Human`, variant: 'edible' },
            { label: `${organicCount} Bio-Conversion`, variant: 'organic' },
          ]}
          icon={<Package size={18} className="text-[#0E6B45]" />}
        />

        <StatCard
          label="Today's Pickups"
          value={pickups.length}
          unit="Scheduled"
          sub={nextPickup ? `Next: ${nextPickup.recipient.split(' ')[0]} (45m)` : 'All dispatches completed'}
          chips={[{ label: '1 In-Transit', variant: 'info' }]}
          icon={<Truck size={18} className="text-[#B8650A]" />}
        />

        <StatCard
          label="Diversion Impact"
          value={totalWeight.toLocaleString('en-IN')}
          unit="kg"
          sub="148 Total Transfers · +18% MoM"
          icon={<BarChart3 size={18} className="text-[#0E6B45]" />}
        />

        <StatCard
          label="Avoided GHG"
          value={totalGhg}
          unit="MT CO2e"
          sub="Gold Tier Steward · Score 98.4%"
          chips={[{ label: 'Gold Tier', variant: 'mint' }]}
          icon={<Award size={18} className="text-[#0E6B45]" />}
        />
      </div>

      {/* 2-Column Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Inventory panel */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E6E8F0] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#E6E8F0] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                {isSupplier ? 'Active Surplus Inventory' : 'Available Food Surplus Batches'}
              </h2>
              <p className="text-xs text-[#5B6272] mt-0.5">
                {isSupplier
                  ? 'Real-time telemetry and safe dispatch windows for your recorded batches'
                  : 'Live batches ready for immediate NGO collection and distribution'}
              </p>
            </div>
            <SegmentedControl
              options={[
                { value: 'all', label: `All (${listings.length})` },
                { value: 'human', label: `Human Only (${edibleCount})` },
                { value: 'organic', label: `Organic (${organicCount})` },
              ]}
              value={filter}
              onChange={(v) => setFilter(v as FilterVal)}
            />
          </div>

          <div className="divide-y divide-[#E6E8F0]">
            {filtered.map((l) => {
              const tl = timeLeft(l.expiresAt);
              return (
                <div key={l.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-[#FAFAFC] transition-colors">
                  <img
                    src={l.imageUrl}
                    alt={l.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#E6E8F0]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={l.stream === 'organic' ? 'organic' : 'edible'}>
                        {l.stream === 'organic' ? 'Organic Biomass' : 'Edible Surplus'}
                      </Badge>
                      <span className="text-[10px] font-semibold bg-[#EEF0FA] text-[#5B6272] px-2 py-0.5 rounded-md">
                        {l.temperature}
                      </span>
                      <span className="text-[10px] text-[#5B6272]">Batch #{l.id}</span>
                    </div>

                    <h3 className="font-bold text-sm text-[#111827] truncate">{l.title}</h3>
                    <p className="text-xs text-[#5B6272] mt-0.5 line-clamp-1">{l.description}</p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-[#5B6272]">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-[#0E6B45]" />
                        {l.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-[#B8650A]" />
                        Window: {tl.label}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-[#0E6B45]">{formatKg(l.weightKg)}</div>
                    <Link
                      to={paths.listingDetail(l.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#DDF7EE] text-[#0E6B45] hover:bg-[#7EE8C8]/40 transition-colors inline-flex items-center gap-1"
                    >
                      View Details
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-[#FAFAFC] border-t border-[#E6E8F0] flex flex-wrap items-center justify-between text-xs text-[#5B6272]">
            <span>All items logged under cold-chain thermal audit standards.</span>
            <button
              type="button"
              onClick={() => alert('Downloading Comprehensive FSSAI Audit Sheet (PDF)...')}
              className="font-bold text-[#0E6B45] hover:underline cursor-pointer"
            >
              Download Audit Sheet (PDF)
            </button>
          </div>
        </div>

        {/* Right Column (4 cols): Pickups & OTP release panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Pickups card */}
          <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111827]">Today's Scheduled Pickups</h3>
              <span className="text-xs font-bold text-[#0E6B45] bg-[#DDF7EE] px-2 py-0.5 rounded-full">
                {pickups.length} Active
              </span>
            </div>

            {nextPickup && (
              <div className="p-4 bg-[#F6F7FB] border border-[#E6E8F0] rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#B8650A]">{nextPickup.time}</span>
                  <span className="font-bold text-[#111827]">{formatKg(nextPickup.allocationKg)}</span>
                </div>

                <div className="font-bold text-xs text-[#111827]">{nextPickup.recipient}</div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E6E8F0] text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0E6B45] text-white flex items-center justify-center font-bold text-xs">
                      {nextPickup.driverInitials}
                    </div>
                    <div>
                      <div className="font-bold text-[#111827]">{nextPickup.driverName}</div>
                      <div className="text-[10px] text-[#5B6272]">{nextPickup.driverVehicle}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => alert(`Calling driver: ${nextPickup.driverPhone}`)}
                    className="p-1.5 rounded-lg bg-white border border-[#E6E8F0] text-[#0E6B45] hover:bg-[#EEF0FA]"
                    title="Call Driver"
                  >
                    <Clock size={14} />
                  </button>
                </div>

                {/* 4-Digit OTP Display */}
                <div className="pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272] mb-1.5">
                    Release Handover OTP
                  </div>
                  <div className="flex gap-2">
                    {nextPickup.otp.split('').map((digit, idx) => (
                      <div
                        key={idx}
                        className="flex-1 py-2 text-center font-mono font-extrabold text-base bg-white border border-[#E6E8F0] rounded-lg text-[#0E6B45] shadow-xs"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant={authorizedOtp ? 'secondary' : 'primary'}
                    className="w-full mt-2.5 text-xs font-bold py-2"
                    onClick={() => {
                      setAuthorizedOtp(true);
                      alert('Dock security notified: Cargo release authorized for Driver Ramesh Kumar.');
                    }}
                  >
                    {authorizedOtp ? '✓ Cargo Released' : 'Authorize Release'}
                  </Button>
                </div>
              </div>
            )}

            {/* Verified Chain of Custody Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6272]">
                Verified Chain-of-Custody
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#0E6B45] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-[#111827]">Batch Packed & Weighed</span>
                    <span className="text-[#5B6272] block text-[11px]">15:45 · Sous Chef Anita S.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#0E6B45] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-[#111827]">Core Temp 3.4°C Verified</span>
                    <span className="text-[#5B6272] block text-[11px]">16:10 · HACCP Sensor Log</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#B8650A] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-[#111827]">Driver En Route to Dock 2</span>
                    <span className="text-[#5B6272] block text-[11px]">ETA 17:35 · Robin Hood Army</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-[1240px] mx-auto px-6 py-8 space-y-8 animate-pulse">
      <div className="h-44 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded-2xl" />
    </div>
  );
}
