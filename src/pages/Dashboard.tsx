import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Package,
  Truck,
  BarChart3,
  Award,
  ChevronRight,
  Clock,
  MapPin,
  Building2,
  HeartHandshake,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Loader2,
  Inbox,
  Calendar,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { cn } from '../components/ui/utils';
import {
  getStoredUser,
  getMyListings,
  getListings,
  getSupplierPickups,
  getMyReservations,
  isApiConfigured,
} from '../api';
import { timeLeft, formatKg } from '../lib/formatters';
import { useRolePaths } from '../lib/useRolePaths';
import type { Listing, Reservation, User } from '../types/domain';

type FilterVal = 'all' | 'edible' | 'organic';

export function Dashboard() {
  const paths = useRolePaths();
  const currentUser: User | null = getStoredUser();
  const isSupplier = currentUser?.role !== 'recipient';

  const [listings, setListings] = useState<Listing[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<FilterVal>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSupplier) {
        const [lRes, pRes] = await Promise.allSettled([
          getMyListings(),
          getSupplierPickups(),
        ]);
        if (lRes.status === 'fulfilled') {
          const items = Array.isArray(lRes.value) ? lRes.value : lRes.value?.items ?? [];
          setListings(items);
        } else {
          setListings([]);
        }
        if (pRes.status === 'fulfilled') {
          setReservations(pRes.value || []);
        } else {
          setReservations([]);
        }
      } else {
        const [lRes, rRes] = await Promise.allSettled([
          getListings({ status: 'active' }),
          getMyReservations(),
        ]);
        if (lRes.status === 'fulfilled') {
          const items = Array.isArray(lRes.value) ? lRes.value : lRes.value?.items ?? [];
          setListings(items);
        } else {
          setListings([]);
        }
        if (rRes.status === 'fulfilled') {
          setReservations(rRes.value || []);
        } else {
          setReservations([]);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to synchronize dashboard data');
    } finally {
      setLoading(false);
    }
  }, [isSupplier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (filter === 'edible') return l.type === 'edible';
      if (filter === 'organic') return l.type === 'organic';
      return true;
    });
  }, [listings, filter]);

  const edibleCount = listings.filter((l) => l.type === 'edible').length;
  const organicCount = listings.filter((l) => l.type === 'organic').length;

  // Real aggregate weight from actual items loaded
  const confirmedWeight = listings.reduce((sum, l) => sum + (l.weightKg || 0), 0);
  const estimatedCo2Avoided = ((confirmedWeight * 2.5) / 1000).toFixed(2);

  const pendingClaims = useMemo(
    () => reservations.filter((r) => r.reservationStatus === 'pending'),
    [reservations]
  );
  const confirmedPickups = useMemo(
    () => reservations.filter((r) => r.reservationStatus !== 'pending' && r.reservationStatus !== 'cancelled'),
    [reservations]
  );

  const nextPickup = isSupplier ? confirmedPickups[0] : reservations[0];

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-8 space-y-8">
      {/* Hero banner with actual user identity */}
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
              <span className="px-2.5 py-0.5 rounded-full bg-[#7EE8C8]/20 text-[#7EE8C8] text-xs font-bold border border-[#7EE8C8]/30 flex items-center gap-1.5">
                <ShieldCheck size={13} />
                {isSupplier ? 'Audited Food Donor' : 'Registered Recovery Recipient'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-medium">
                {currentUser?.orgType || (isSupplier ? 'Commercial Kitchen / Catering' : 'NGO / Shelter')}
              </span>
              {currentUser?.verified && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> Verified Member
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              {currentUser?.orgName || (isSupplier ? 'Supplier Operations Portal' : 'Recipient Logistics Hub')}
            </h1>
            <p className="mt-1.5 text-xs text-white/80 max-w-xl">
              {isSupplier
                ? 'Manage active surplus food streams, track cold-chain compliance, and coordinate verified handovers.'
                : 'Browse available food donations, reserve batches for community distribution, and verify pickups.'}
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
                    View My Inventory
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
                    My Reservations
                  </Button>
                </Link>
              </>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Backend connection banner if not set */}
      {!isApiConfigured() && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Backend Integration Notice:</strong> Live data will sync automatically once <code>VITE_API_BASE_URL</code> is connected.
            </span>
          </div>
          <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-mono">
            API PENDING
          </span>
        </div>
      )}

      {/* 4 StatCards with authentic metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isSupplier ? 'Active Inventory' : 'Available in Sector'}
          value={listings.length}
          unit="Batches"
          sub="Live registered batches"
          chips={[
            { label: `${edibleCount} Edible`, variant: 'edible' },
            { label: `${organicCount} Biomass`, variant: 'organic' },
          ]}
          icon={<Package size={18} className="text-[#0E6B45]" />}
        />

        <StatCard
          label={isSupplier ? (pendingClaims.length > 0 ? 'Pickups & Pending Claims' : "Today's Pickups") : 'Active Claims'}
          value={reservations.length}
          unit="Handovers"
          sub={
            isSupplier && pendingClaims.length > 0
              ? `${pendingClaims.length} awaiting approval`
              : nextPickup
              ? `Next: #${nextPickup.id.slice(0, 8)}`
              : 'No pending pickups'
          }
          chips={
            isSupplier && pendingClaims.length > 0
              ? [
                  { label: `${pendingClaims.length} Pending`, variant: 'amber' },
                  { label: `${confirmedPickups.length} Confirmed`, variant: 'info' },
                ]
              : [{ label: `${reservations.length} Scheduled`, variant: 'info' }]
          }
          icon={<Truck size={18} className="text-[#B8650A]" />}
        />

        <StatCard
          label="Tracked Weight"
          value={confirmedWeight.toLocaleString('en-IN')}
          unit="kg"
          sub={confirmedWeight > 0 ? 'From active inventory' : 'No recorded weight yet'}
          icon={<BarChart3 size={18} className="text-[#0E6B45]" />}
        />

        <StatCard
          label="Est. GHG Reduction"
          value={estimatedCo2Avoided}
          unit="MT CO2e"
          sub="Calculated at 2.5 kg CO2e/kg"
          chips={[{ label: 'Scope 3', variant: 'mint' }]}
          icon={<Award size={18} className="text-[#0E6B45]" />}
        />
      </div>

      {/* 2-Column Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Inventory / Surplus list */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E6E8F0] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#E6E8F0] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                {isSupplier ? 'Your Listed Surplus Batches' : 'Available Food Surplus Batches'}
              </h2>
              <p className="text-xs text-[#5B6272] mt-0.5">
                {isSupplier
                  ? 'Real-time telemetry and safe dispatch windows for your recorded batches'
                  : 'Live batches ready for immediate collection and redistribution'}
              </p>
            </div>
            <SegmentedControl
              options={[
                { value: 'all', label: `All (${listings.length})` },
                { value: 'edible', label: `Edible (${edibleCount})` },
                { value: 'organic', label: `Biomass (${organicCount})` },
              ]}
              value={filter}
              onChange={(v) => setFilter(v as FilterVal)}
            />
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={24} className="animate-spin text-[#0E6B45] mb-2" />
              <p className="text-xs">Loading surplus inventory...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-[#E6E8F0]">
              {filtered.map((l) => {
                const deadlineStr = l.safeUntil || l.collectionDeadline;
                const tl = deadlineStr ? timeLeft(new Date(deadlineStr)) : { label: 'Active', urgent: false };
                return (
                  <div key={l.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-[#FAFAFC] transition-colors">
                    {l.imageUrl ? (
                      <img
                        src={l.imageUrl}
                        alt={l.title}
                        className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#E6E8F0]"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-[#E6E8F0] text-slate-400">
                        <Package size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant={l.type === 'organic' ? 'organic' : 'edible'}>
                          {l.type === 'organic' ? 'Organic Biomass' : 'Edible Surplus'}
                        </Badge>
                        <span className="text-[10px] font-semibold bg-[#EEF0FA] text-[#5B6272] px-2 py-0.5 rounded-md capitalize">
                          {l.storageMethod}
                        </span>
                        <span className="text-[10px] text-[#5B6272]">Batch #{l.id.slice(0, 8)}</span>
                      </div>

                      <h3 className="font-bold text-sm text-[#111827] truncate">{l.title}</h3>
                      <p className="text-xs text-[#5B6272] mt-0.5 line-clamp-1">{l.description}</p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-[#5B6272]">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-[#0E6B45]" />
                          {l.supplierLocation || l.pickupAddress || 'Address on file'}
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
          ) : (
            /* Honest empty state */
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <Inbox size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">No Active Listings Recorded</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {isSupplier
                  ? 'You have not registered any active surplus batches. Add a new listing to start the recovery workflow.'
                  : 'There are currently no surplus batches available in your sector. Check back soon or adjust filters.'}
              </p>
              {isSupplier && (
                <Link to={paths.listingNew}>
                  <Button variant="primary" className="text-xs font-bold py-2 px-4 gap-1.5">
                    <Plus size={14} /> Add First Surplus Listing
                  </Button>
                </Link>
              )}
            </div>
          )}

          <div className="p-4 bg-[#FAFAFC] border-t border-[#E6E8F0] flex flex-wrap items-center justify-between text-xs text-[#5B6272]">
            <span>All inventory records adhere to cold-chain thermal audit standards.</span>
            <Link to={paths.analytics} className="font-bold text-[#0E6B45] hover:underline">
              View Analytics & Reporting →
            </Link>
          </div>
        </div>

        {/* Right Column (4 cols): Scheduled Pickups & Queue */}
        <div className="lg:col-span-4 space-y-6">
          {/* Supplier Pending Claims Notice */}
          {isSupplier && pendingClaims.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-600" />
                  Claim Requests ({pendingClaims.length})
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 rounded-full">
                  ACTION NEEDED
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                You have {pendingClaims.length} incoming claim request{pendingClaims.length > 1 ? 's' : ''} awaiting approval.
              </p>
              <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 text-xs">
                <p className="font-bold text-slate-900 truncate">
                  {pendingClaims[0].listing?.title || 'Surplus Batch'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Recipient: <strong>{pendingClaims[0].recipientName}</strong>
                </p>
              </div>
              <Link to="/supplier/pickups" className="block pt-1">
                <Button variant="secondary" className="w-full text-xs font-bold py-2 bg-amber-600 text-white hover:bg-amber-700">
                  Review & Respond to Claims →
                </Button>
              </Link>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111827]">
                {isSupplier ? 'Confirmed Pickups' : 'My Active Claims'}
              </h3>
              <span className="text-xs font-bold text-[#0E6B45] bg-[#DDF7EE] px-2 py-0.5 rounded-full">
                {isSupplier ? confirmedPickups.length : reservations.length} Active
              </span>
            </div>

            {nextPickup ? (
              <div className="p-4 bg-[#F6F7FB] border border-[#E6E8F0] rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0E6B45] uppercase tracking-wide">
                    Status: {nextPickup.reservationStatus.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-[#111827]">
                    {nextPickup.listing?.weightKg ? formatKg(nextPickup.listing.weightKg) : 'Scheduled'}
                  </span>
                </div>

                <div className="font-bold text-xs text-[#111827]">
                  {nextPickup.listing?.title || `Reservation #${nextPickup.id.slice(0, 8)}`}
                </div>

                <div className="pt-2 border-t border-[#E6E8F0] text-xs text-[#5B6272]">
                  <p className="flex items-center gap-1">
                    <MapPin size={11} className="text-[#0E6B45]" />
                    {nextPickup.pickupAddress || 'Pickup address on file'}
                  </p>
                </div>

                <Link
                  to={isSupplier ? '/supplier/pickups' : '/recipient/reservations'}
                  className="block w-full pt-2"
                >
                  <Button variant="outline" className="w-full text-xs font-bold py-2">
                    Open Handover Details →
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Calendar size={20} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  {isSupplier ? 'No confirmed handovers' : 'No active reservations'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isSupplier
                    ? 'When a recipient claim is confirmed, pickup coordination will appear here.'
                    : 'Claim an active surplus listing to schedule a collection.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
