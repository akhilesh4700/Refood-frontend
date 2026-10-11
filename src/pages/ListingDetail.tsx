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
  Download,
  MessageSquare,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { getListing, createReservation, getSupplier, subscribeToDataChanges } from '../api';
import { Listing, Supplier } from '../mocks/data';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatKg, formatCountdown } from '../lib/formatters';

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [countdown, setCountdown] = useState('03:20:00');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (id) {
        const found = await getListing(id);
        if (found) {
          setListing(found);
        } else {
          // fallback to first item
          const fallback = await getListing('RF-84920');
          setListing(fallback || null);
        }
      }
      const supp = await getSupplier();
      setSupplier(supp);
      setLoading(false);
    }
    loadData();
    const unsub = subscribeToDataChanges(() => {
      loadData();
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (listing?.expiresAt) {
        setCountdown(formatCountdown(new Date(listing.expiresAt)));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [listing]);

  const handleReserve = async () => {
    if (!listing) return;
    setReserving(true);
    try {
      const res = await createReservation(listing.id);
      navigate(`/reservations/${res.id}`);
    } catch {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-10 w-2/3 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
        <h2 className="text-xl font-bold text-[#111827]">Listing Not Found</h2>
        <p className="text-sm text-[#5B6272] mt-2">The surplus batch requested could not be located or has already expired.</p>
        <Link to="/listings" className="mt-4 inline-block text-sm font-semibold text-[#0E6B45]">
          ← Back to Marketplace
        </Link>
      </div>
    );
  }

  const isEdible = listing.stream === 'edible';

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-16">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-[#E6E8F0]">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/listings"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5B6272] hover:text-[#111827] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Browse Marketplace
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-[#5B6272] bg-[#EEF0FA] px-2.5 py-1 rounded-md">
              Batch #{listing.id}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#0E6B45] bg-[#DDF7EE] px-2.5 py-1 rounded-full border border-[#7EE8C8]/30">
              <ShieldCheck size={13} />
              Cold-Chain Logged
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-6">
        {/* Chips row & Title */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={isEdible ? 'edible' : 'organic'}>
              {isEdible ? 'Edible Human Surplus' : 'Organic Biomass / Compost'}
            </Badge>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#0E6B45] bg-[#EEF0FA] px-2.5 py-1 rounded-full border border-[#E6E8F0]">
              <ShieldCheck size={12} className="text-[#0E6B45]" />
              Cold Chain Verified (HACCP)
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#B8650A] bg-[#FBEBDD] px-2.5 py-1 rounded-full">
              <Award size={12} />
              Grade A Commercial Kitchen Certified
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
            {listing.title}
          </h1>
          <p className="text-sm text-[#5B6272] mt-1">
            Donated by {listing.supplier} · Stored at {listing.location} · Packed in food-grade GN insulated containers
          </p>
        </div>

        {/* Urgency Alert Banner */}
        <div className="bg-[#FBEBDD] border border-[#B8650A]/20 rounded-2xl p-4 lg:p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#B8650A]/30 flex items-center justify-center shrink-0 shadow-sm">
              <Clock size={22} className="text-[#B8650A]" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#B8650A]">
                Pickup Window Urgency · Standard 4-hr Perishable SLA
              </div>
              <div className="text-sm font-semibold text-[#111827] mt-0.5">
                Expiring in <span className="font-mono text-[#C62828] font-bold">{countdown}</span> · Ready for immediate dock dispatch
              </div>
            </div>
          </div>
          <div className="w-full md:w-64 shrink-0">
            <div className="flex justify-between text-xs text-[#5B6272] mb-1 font-medium">
              <span>Rescue Window</span>
              <span className="font-semibold text-[#B8650A]">78% Elapsed</span>
            </div>
            <div className="w-full h-2.5 bg-white/70 rounded-full overflow-hidden border border-[#B8650A]/20">
              <div className="h-full bg-gradient-to-r from-[#B8650A] to-[#C62828] rounded-full" style={{ width: '78%' }} />
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Left Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image Card */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] overflow-hidden shadow-sm">
              <div className="relative h-72 sm:h-96 w-full bg-gray-100 overflow-hidden">
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                
                {/* Floating Chips */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                    <Thermometer size={14} className="text-[#7EE8C8]" />
                    Core Temp: {listing.temperature || '3.2°C Chilled'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                    <Layers size={14} className="text-[#7EE8C8]" />
                    8 Standard Trays
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white text-xs font-medium flex justify-between items-center bg-black/50 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                  <span>Photo logged at preparation dock during morning batch audit</span>
                  <span className="font-mono text-white/80">Logged 09:15 IST</span>
                </div>
              </div>

              {/* 3 Quality Checkpoint Tiles */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-[#E6E8F0] bg-[#FAFAFC]">
                <div className="p-3.5 bg-white rounded-xl border border-[#E6E8F0]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0E6B45]">
                    <CheckCircle2 size={16} />
                    HACCP Compliant
                  </div>
                  <p className="text-xs text-[#5B6272] mt-1">Inspected by Senior Sous Chef at pack-down.</p>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-[#E6E8F0]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0E6B45]">
                    <CheckCircle2 size={16} />
                    Tamper-Sealed
                  </div>
                  <p className="text-xs text-[#5B6272] mt-1">Numbered security seals applied on container lids.</p>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-[#E6E8F0]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0E6B45]">
                    <CheckCircle2 size={16} />
                    Traceability ID
                  </div>
                  <p className="text-xs text-[#5B6272] mt-1">Full batch manifest linked to kitchen ERP log.</p>
                </div>
              </div>

              {/* Portion Breakdown & Composition */}
              <div className="p-6">
                <h3 className="text-base font-bold text-[#111827] mb-4">Portion Breakdown & Food Composition</h3>
                
                {/* 4 Metric Boxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 bg-[#EEF0FA] rounded-xl text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B6272]">Net Weight</div>
                    <div className="text-xl font-bold text-[#111827] mt-0.5">{formatKg(listing.weightKg)}</div>
                  </div>
                  <div className="p-3 bg-[#EEF0FA] rounded-xl text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B6272]">Meal Capacity</div>
                    <div className="text-xl font-bold text-[#0E6B45] mt-0.5">~{listing.portions} Meals</div>
                  </div>
                  <div className="p-3 bg-[#EEF0FA] rounded-xl text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B6272]">Storage Condition</div>
                    <div className="text-xl font-bold text-[#111827] mt-0.5">{listing.temperature}</div>
                  </div>
                  <div className="p-3 bg-[#EEF0FA] rounded-xl text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B6272]">Est. Value</div>
                    <div className="text-xl font-bold text-[#111827] mt-0.5">₹{(listing.weightKg * 220).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Allergen Information */}
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#5B6272] mb-2">
                    Allergen Declarations
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {listing.allergens && listing.allergens.length > 0 ? (
                      listing.allergens.map((alg) => (
                        <span key={alg} className="px-3 py-1 bg-white border border-[#E6E8F0] rounded-full text-xs font-medium text-[#111827] shadow-xs">
                          {alg}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#5B6272]">No common allergens flagged. Refer to pack label.</span>
                    )}
                  </div>
                </div>

                {/* Itemized Container Manifest Table */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#5B6272] mb-3">
                    Itemized Container Manifest
                  </div>
                  <div className="border border-[#E6E8F0] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#EEF0FA] border-b border-[#E6E8F0] text-[#5B6272] font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Container #</th>
                          <th className="py-2.5 px-4">Contents Description</th>
                          <th className="py-2.5 px-4">Container Type</th>
                          <th className="py-2.5 px-4 text-right">Net Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6E8F0] text-[#111827]">
                        <tr>
                          <td className="py-2.5 px-4 font-mono font-medium">GN-1/1-01</td>
                          <td className="py-2.5 px-4 font-medium">Fresh artisanal multigrain loaves & dinner rolls</td>
                          <td className="py-2.5 px-4 text-[#5B6272]">Insulated Gastronorm Bin</td>
                          <td className="py-2.5 px-4 text-right font-semibold">18.5 kg</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-mono font-medium">GN-1/1-02</td>
                          <td className="py-2.5 px-4 font-medium">Croissants, danish pastries & sweet rolls</td>
                          <td className="py-2.5 px-4 text-[#5B6272]">Ventilated Food Crate</td>
                          <td className="py-2.5 px-4 text-right font-semibold">12.0 kg</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-mono font-medium">GN-1/2-03</td>
                          <td className="py-2.5 px-4 font-medium">Assorted sliced sandwich loaves</td>
                          <td className="py-2.5 px-4 text-[#5B6272]">Sealed Bulk Liner</td>
                          <td className="py-2.5 px-4 text-right font-semibold">14.5 kg</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Profile Card */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E8F0]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#0E6B45] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {supplier?.logo || 'HG'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-base text-[#111827]">{supplier?.name || listing.supplier}</h4>
                      <CheckCircle2 size={16} className="text-[#0E6B45]" />
                    </div>
                    <p className="text-xs text-[#5B6272]">
                      Certified 5-Star Hospitality Partner · Member since {supplier?.partnerSince || '2023'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-[#DDF7EE] text-[#0E6B45] px-3 py-1 rounded-full font-semibold border border-[#7EE8C8]/30">
                    FSSAI Verified
                  </span>
                </div>
              </div>

              {/* 3 Stat Boxes */}
              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="p-3 bg-[#EEF0FA] rounded-xl text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">Dispatched Batches</div>
                  <div className="text-base font-bold text-[#111827] mt-0.5">{supplier?.totalTransfers || 148}</div>
                </div>
                <div className="p-3 bg-[#EEF0FA] rounded-xl text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">Total Food Saved</div>
                  <div className="text-base font-bold text-[#0E6B45] mt-0.5">{formatKg(supplier?.totalKgDonated || 3420)}</div>
                </div>
                <div className="p-3 bg-[#EEF0FA] rounded-xl text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">Safety Rating</div>
                  <div className="text-base font-bold text-[#111827] mt-0.5">{supplier?.rating || '4.95'} / 5.0</div>
                </div>
              </div>

              {/* Coordinator on Duty */}
              <div className="flex items-center justify-between p-3 bg-[#FAFAFC] rounded-xl border border-[#E6E8F0] text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0E6B45] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0E6B45]"></span>
                  </span>
                  <div>
                    <span className="font-semibold text-[#111827]">{supplier?.coordinator || 'Chef Anita Sharma'}</span>
                    <span className="text-[#5B6272] ml-1.5">({supplier?.coordinatorRole || 'Executive Sous Chef & Dispatch Lead'})</span>
                  </div>
                </div>
                <span className="text-[#0E6B45] font-semibold">{supplier?.coordinatorPhone || '+91 98450 12847'}</span>
              </div>
            </div>

            {/* Logistics Disclaimer Notice */}
            <div className="p-4 bg-[#EEF0FA] rounded-xl border border-[#E6E8F0] flex gap-3 text-xs text-[#5B6272]">
              <Info size={18} className="text-[#0E6B45] shrink-0 mt-0.5" />
              <p>
                <strong>Food Donor Liability Protection (FSSAI Guidelines & Good Samaritan Principles):</strong> This surplus allocation is provided in good faith by verified commercial culinary establishments under cold-chain compliance. Intended exclusively for certified NGO consumption or bio-conversion processing. Resale is strictly prohibited.
              </p>
            </div>
          </div>

          {/* Right Sticky Sidebar (1 col) */}
          <div className="space-y-6 lg:sticky lg:top-20">
            {/* Action Manifest Card */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-[#E6E8F0]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5B6272]">Allocation Status</span>
                <span className="px-2 py-0.5 bg-[#DDF7EE] text-[#0E6B45] rounded text-xs font-bold">
                  Open for NGO Claim
                </span>
              </div>

              <div className="py-4 space-y-3.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#5B6272]">Total Batch Weight</span>
                  <span className="font-bold text-[#111827]">{formatKg(listing.weightKg)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5B6272]">Recipient Meal Capacity</span>
                  <span className="font-bold text-[#0E6B45]">~{listing.portions} Servings</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5B6272]">Dispatch Window</span>
                  <span className="font-bold text-[#111827]">Today, 14:00 - 17:30 IST</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5B6272]">Platform Fee</span>
                  <span className="font-bold text-[#0E6B45]">₹0 (Free Recovery)</span>
                </div>
              </div>

              {/* Mini Map Placeholder with Address Overlay */}
              <div className="my-3 rounded-xl overflow-hidden border border-[#E6E8F0] relative h-36 bg-[#EEF0FA]">
                <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:12px_12px] opacity-70" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#0E6B45] text-white flex items-center justify-center shadow-lg animate-bounce">
                    <MapPin size={20} />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs p-2 rounded-lg text-xs font-medium text-[#111827] border border-[#E6E8F0] shadow-xs">
                  <p className="font-bold truncate">{listing.location}</p>
                  <p className="text-[11px] text-[#5B6272] truncate">Loading Dock Gate 3, Basavanagudi / Koramangala Link Rd</p>
                </div>
              </div>

              {/* Access Note Warning */}
              <div className="p-3 bg-[#FBEBDD] rounded-xl border border-[#B8650A]/20 text-xs text-[#B8650A] flex gap-2 mb-5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>Commercial loading dock clearance required. Vans or temp-controlled vehicles recommended.</span>
              </div>

              {/* Action Button */}
              <Button
                variant={isEdible ? 'primary' : 'amber'}
                className="w-full py-3 text-base font-semibold shadow-md flex items-center justify-center gap-2"
                onClick={handleReserve}
                disabled={reserving}
              >
                {reserving ? (
                  'Allocating Batch...'
                ) : (
                  <>
                    Reserve This Listing (Free for NGOs)
                    <ChevronRight size={18} />
                  </>
                )}
              </Button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => {
                    alert(`Contacting ${supplier?.coordinator || 'Chef'}: ${supplier?.coordinatorPhone || '+91 98450 12847'}`);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6272] hover:text-[#0E6B45] cursor-pointer"
                >
                  <MessageSquare size={13} />
                  Message Supplier Coordinator
                </button>
              </div>
            </div>

            {/* Audit Documentation Card */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6272]">
                Audit & Compliance Documents
              </h4>
              <div className="space-y-2">
                <div
                  className="p-3 rounded-xl bg-[#FAFAFC] border border-[#E6E8F0] flex items-center justify-between hover:bg-[#EEF0FA] transition-colors cursor-pointer"
                  onClick={() => alert('Downloading Food Safety Handover Certificate (PDF)...')}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-[#0E6B45]" />
                    <div>
                      <div className="text-xs font-bold text-[#111827]">HACCP Temp Log #HL-982</div>
                      <div className="text-[11px] text-[#5B6272]">PDF · 184 KB · Signed by FSSAI Auditor</div>
                    </div>
                  </div>
                  <Download size={14} className="text-[#5B6272]" />
                </div>
                <div
                  className="p-3 rounded-xl bg-[#FAFAFC] border border-[#E6E8F0] flex items-center justify-between hover:bg-[#EEF0FA] transition-colors cursor-pointer"
                  onClick={() => alert('Downloading Batch Manifest & Packaging Spec...')}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-[#0E6B45]" />
                    <div>
                      <div className="text-xs font-bold text-[#111827]">Batch Spec & Composition</div>
                      <div className="text-[11px] text-[#5B6272]">PDF · 96 KB · Allergen Checklist</div>
                    </div>
                  </div>
                  <Download size={14} className="text-[#5B6272]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
