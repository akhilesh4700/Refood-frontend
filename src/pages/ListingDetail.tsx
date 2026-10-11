import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Award,
  Thermometer,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Phone,
  User,
  ShieldAlert,
  Loader2,
  Ban,
  PackageCheck,
} from 'lucide-react';
import { getListing, claimListing, withdrawListing, getStoredUser } from '../api';
import type { Listing } from '../types/domain';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatKg, formatCountdown, timeLeft } from '../lib/formatters';
import { useRolePaths } from '../lib/useRolePaths';

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const paths = useRolePaths();
  const storedUser = getStoredUser();
  const isSupplier = storedUser?.role === 'supplier';

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [countdown, setCountdown] = useState('00:00:00');

  useEffect(() => {
    async function loadData() {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const found = await getListing(id);
        setListing(found);
      } catch {
        setListing(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (listing) {
        const deadline = listing.safeUntil || listing.collectionDeadline;
        if (deadline) {
          setCountdown(formatCountdown(new Date(deadline)));
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [listing]);

  const handleClaim = async () => {
    if (!listing) return;
    setClaiming(true);
    setClaimError(null);
    try {
      await claimListing(listing.id);
      navigate('/recipient/reservations');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to claim listing. It may have been reserved by another party.';
      setClaimError(msg);
      // If backend not connected, still allow demonstration navigation
      if (!import.meta.env.VITE_API_BASE_URL) {
        setTimeout(() => navigate('/recipient/reservations'), 1200);
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleWithdraw = async () => {
    if (!listing || !confirm('Are you sure you want to withdraw this surplus listing?')) return;
    setWithdrawing(true);
    try {
      await withdrawListing(listing.id, 'Withdrawn by supplier');
      navigate('/supplier/listings');
    } catch {
      navigate('/supplier/listings');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-16 flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={32} className="animate-spin text-[#0E6B45] mb-3" />
        <p className="text-xs font-medium">Retrieving batch records & telemetry...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={26} />
        </div>
        <h2 className="text-xl font-bold text-[#111827]">Listing Not Found</h2>
        <p className="text-sm text-[#5B6272] mt-2 max-w-md mx-auto">
          The requested surplus batch could not be found. It may have already been collected, expired, or withdrawn by the supplier.
        </p>
        <Link
          to={isSupplier ? '/supplier/listings' : '/recipient/browse'}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Listings
        </Link>
      </div>
    );
  }

  const isEdible = listing.type === 'edible';
  const deadlineStr = listing.safeUntil || listing.collectionDeadline;
  const tl = deadlineStr ? timeLeft(new Date(deadlineStr)) : { label: 'Active', pct: 50, urgent: false };

  const storageMethodText =
    listing.storageMethod === 'refrigerated'
      ? 'Chilled (2–4°C)'
      : listing.storageMethod === 'frozen'
      ? 'Frozen (≤ -18°C)'
      : 'Ambient Storage';

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-16">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-[#E6E8F0]">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link
            to={isSupplier ? '/supplier/listings' : '/recipient/browse'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6272] hover:text-[#111827] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to {isSupplier ? 'My Listings' : 'Marketplace'}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-[#5B6272] bg-[#EEF0FA] px-2.5 py-1 rounded-md">
              Batch #{listing.id.slice(0, 8)}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#0E6B45] bg-[#DDF7EE] px-2.5 py-1 rounded-full border border-[#7EE8C8]/30">
              <ShieldCheck size={13} />
              Status: {listing.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-6">
        {/* Title & Metadata row */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={isEdible ? 'edible' : 'organic'}>
              {isEdible ? 'Edible Human Surplus' : 'Organic Biomass / Compost'}
            </Badge>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#0E6B45] bg-[#EEF0FA] px-2.5 py-1 rounded-full border border-[#E6E8F0]">
              <ShieldCheck size={12} className="text-[#0E6B45]" />
              Cold Chain Verified
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#B8650A] bg-[#FBEBDD] px-2.5 py-1 rounded-full">
              <Award size={12} />
              Category: {listing.category}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
            {listing.title}
          </h1>
          <p className="text-xs text-[#5B6272] mt-1">
            Supplier: <strong className="text-slate-800">{listing.supplierName}</strong> · Location: {listing.supplierLocation || listing.pickupAddress}
          </p>
        </div>

        {/* Urgency Alert Banner */}
        <div className="bg-[#FBEBDD] border border-[#B8650A]/20 rounded-2xl p-4 lg:p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#B8650A]/30 flex items-center justify-center shrink-0 shadow-xs">
              <Clock size={20} className="text-[#B8650A]" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#B8650A]">
                Dispatch Window · Perishable SLA
              </div>
              <div className="text-sm font-semibold text-[#111827] mt-0.5">
                Countdown: <span className="font-mono text-[#C62828] font-bold">{countdown}</span> left for collection
              </div>
            </div>
          </div>
          <div className="w-full md:w-64 shrink-0">
            <div className="flex justify-between text-xs text-[#5B6272] mb-1 font-medium">
              <span>Rescue Window</span>
              <span className="font-semibold text-[#B8650A]">{tl.label}</span>
            </div>
            <div className="w-full h-2.5 bg-white/70 rounded-full overflow-hidden border border-[#B8650A]/20">
              <div
                className="h-full bg-gradient-to-r from-[#B8650A] to-[#C62828] rounded-full transition-all"
                style={{ width: `${tl.pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Left Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image & Telemetry Card */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] overflow-hidden shadow-xs">
              <div className="relative h-64 sm:h-80 w-full bg-slate-100 overflow-hidden">
                {listing.imageUrl ? (
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Sparkles size={36} className="text-slate-300 mb-2" />
                    <span className="text-xs font-medium">Verified Batch Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Floating telemetry pills */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                    <Thermometer size={14} className="text-[#7EE8C8]" />
                    {storageMethodText}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                    <Layers size={14} className="text-[#7EE8C8]" />
                    Weight: {formatKg(listing.weightKg)}
                  </span>
                </div>
              </div>

              {/* Quality & Safety Checkpoints */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-[#E6E8F0] bg-[#FAFAFC]">
                <div className="p-3 bg-white rounded-xl border border-[#E6E8F0]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0E6B45]">
                    <CheckCircle2 size={15} />
                    FSSAI / Safety Audited
                  </div>
                  <p className="text-[11px] text-[#5B6272] mt-1">Logged under donor safety protocol.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E6E8F0]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0E6B45]">
                    <CheckCircle2 size={15} />
                    Storage Verified
                  </div>
                  <p className="text-[11px] text-[#5B6272] mt-1">{storageMethodText}.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E6E8F0]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0E6B45]">
                    <CheckCircle2 size={15} />
                    Traceability ID
                  </div>
                  <p className="text-[11px] text-[#5B6272] mt-1">Linked to batch #{listing.id.slice(0, 8)}.</p>
                </div>
              </div>

              {/* Description & Details */}
              <div className="p-6 space-y-4">
                <h3 className="text-base font-bold text-[#111827]">Batch Details & Description</h3>
                <p className="text-xs text-[#5B6272] leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>

                {listing.packagingNote && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <strong className="text-slate-900">Packaging note:</strong> {listing.packagingNote}
                  </div>
                )}

                {/* Allergens */}
                {listing.allergens && listing.allergens.length > 0 && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-1.5">
                      <ShieldAlert size={14} /> Allergen Declaration
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.allergens.map((alg) => (
                        <span
                          key={alg}
                          className="px-2 py-0.5 bg-white border border-amber-200 text-amber-800 rounded-md text-[11px] font-medium"
                        >
                          {alg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Logistics & Claim Action */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-xs space-y-5">
              <h3 className="text-base font-bold text-[#111827]">Logistics & Collection</h3>

              <div className="space-y-3 text-xs text-[#5B6272]">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-[#0E6B45] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827] block">Pickup Address</span>
                    <span>{listing.pickupAddress || 'Address available upon confirmation'}</span>
                  </div>
                </div>

                {listing.pickupInstructions && (
                  <div className="flex items-start gap-2.5">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#111827] block">Dock Instructions</span>
                      <span>{listing.pickupInstructions}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <User size={16} className="text-[#0E6B45] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827] block">On-Site Dispatch Contact</span>
                    <span>{listing.onSiteContact} {listing.onSitePhone ? `(${listing.onSitePhone})` : ''}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar size={16} className="text-[#B8650A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827] block">Earliest Pickup</span>
                    <span>
                      {listing.earliestPickup
                        ? new Date(listing.earliestPickup).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Immediate'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Claim Error if present */}
              {claimError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
                  {claimError}
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 border-t border-[#E6E8F0]">
                {!isSupplier ? (
                  listing.status === 'active' ? (
                    <Button
                      variant={isEdible ? 'primary' : 'amber'}
                      className="w-full text-xs font-bold py-3 flex items-center justify-center gap-2"
                      onClick={handleClaim}
                      disabled={claiming}
                    >
                      {claiming ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Reserving Batch...
                        </>
                      ) : (
                        <>
                          <PackageCheck size={16} /> Claim This Surplus Batch
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl text-center text-xs font-semibold">
                      This batch is {listing.status}
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200">
                      You are viewing your own listing as a supplier.
                    </div>
                    {listing.status === 'active' && (
                      <Button
                        variant="danger"
                        className="w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2"
                        onClick={handleWithdraw}
                        disabled={withdrawing}
                      >
                        <Ban size={14} /> Withdraw Listing
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
