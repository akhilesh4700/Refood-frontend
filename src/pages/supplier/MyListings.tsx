import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Package, Filter, Clock, MapPin, ChevronRight,
  Loader2, AlertCircle, CheckCircle2, XCircle, ArchiveX,
  Ban, RefreshCw,
} from 'lucide-react';
import { getMyListings, ApiUnavailableError } from '../../api';
import { Badge } from '../../components/ui/Badge';
import { formatKg } from '../../lib/formatters';
import type { Listing, ListingStatus, ListingType } from '../../types/domain';

type StatusFilter = 'all' | ListingStatus;
type TypeFilter   = 'all' | ListingType;

const STATUS_LABELS: Record<ListingStatus, string> = {
  draft:     'Draft',
  active:    'Active',
  claimed:   'Claimed',
  completed: 'Completed',
  expired:   'Expired',
  withdrawn: 'Withdrawn',
  converted: 'Converted',
};

const STATUS_COLORS: Record<ListingStatus, string> = {
  draft:     'bg-[#EEF0FA] text-[#5B6272]',
  active:    'bg-[#DDF7EE] text-[#0E6B45]',
  claimed:   'bg-[#FBEBDD] text-[#B8650A]',
  completed: 'bg-[#DDF7EE] text-[#0E6B45]',
  expired:   'bg-[#FDE7E7] text-[#C62828]',
  withdrawn: 'bg-[#F5F5FA] text-[#9CA3AF]',
  converted: 'bg-[#FBEBDD] text-[#B8650A]',
};

const STATUS_ICONS: Record<ListingStatus, React.ReactNode> = {
  draft:     <Package size={12} />,
  active:    <CheckCircle2 size={12} />,
  claimed:   <Clock size={12} />,
  completed: <CheckCircle2 size={12} />,
  expired:   <XCircle size={12} />,
  withdrawn: <Ban size={12} />,
  converted: <RefreshCw size={12} />,
};

export function MyListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [apiPending, setApiPending] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter]     = useState<TypeFilter>('all');
  const [search, setSearch]             = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMyListings();
      setListings(result.items);
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        setApiPending(true);
        setListings([]);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load listings.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (typeFilter !== 'all' && l.type !== typeFilter) return false;
      if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [listings, statusFilter, typeFilter, search]);

  const counts = useMemo(() => ({
    active:    listings.filter((l) => l.status === 'active').length,
    claimed:   listings.filter((l) => l.status === 'claimed').length,
    completed: listings.filter((l) => l.status === 'completed').length,
    expired:   listings.filter((l) => l.status === 'expired').length,
  }), [listings]);

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
            My Listings
          </h1>
          <p className="text-xs text-[#5B6272] mt-1">
            Manage your surplus inventory — create, edit, and track all your listings.
          </p>
        </div>
        <Link
          to="/supplier/listings/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-700
                     bg-[#0E6B45] text-white hover:bg-[#0A5234] transition-colors shadow-sm shrink-0"
        >
          <Plus size={16} />
          New Listing
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active', count: counts.active, color: '#0E6B45', bg: '#DDF7EE' },
          { label: 'Claimed / In-progress', count: counts.claimed, color: '#B8650A', bg: '#FBEBDD' },
          { label: 'Completed', count: counts.completed, color: '#0E6B45', bg: '#EEF0FA' },
          { label: 'Expired', count: counts.expired, color: '#C62828', bg: '#FDE7E7' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-[16px] border border-[#E6E8F0] p-4 shadow-xs">
            <p className="text-xs text-[#5B6272]">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E6E8F0] p-4 shadow-xs flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-40">
          <input
            type="search"
            placeholder="Search listings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-3 py-2 text-xs bg-[#EEF0FA] border border-[#E6E8F0] rounded-xl
                       text-[#111827] placeholder:text-[#5B6272]/60 focus:outline-none focus:border-[#0E6B45]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="px-3 py-2 text-xs bg-[#EEF0FA] border border-[#E6E8F0] rounded-xl text-[#111827]
                     focus:outline-none focus:border-[#0E6B45]"
        >
          <option value="all">All Types</option>
          <option value="edible">Edible Surplus</option>
          <option value="organic">Organic / Biomass</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 text-xs bg-[#EEF0FA] border border-[#E6E8F0] rounded-xl text-[#111827]
                     focus:outline-none focus:border-[#0E6B45]"
        >
          <option value="all">All Statuses</option>
          {(Object.keys(STATUS_LABELS) as ListingStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Content area */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-[#0E6B45]" />
        </div>
      )}

      {!loading && apiPending && (
        <div className="bg-white rounded-2xl border border-[#E6E8F0] p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-[#111827] mb-2">
            Listings will appear here once connected
          </h3>
          <p className="text-sm text-[#5B6272] max-w-md mx-auto leading-relaxed">
            Your inventory is managed through the ReFood backend. Configure{' '}
            <code className="font-mono bg-[#EEF0FA] px-1.5 py-0.5 rounded text-xs">VITE_API_BASE_URL</code>{' '}
            in your <code className="font-mono bg-[#EEF0FA] px-1.5 py-0.5 rounded text-xs">.env</code>{' '}
            file to connect to your backend.
          </p>
          <Link
            to="/supplier/listings/new"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-[12px] text-sm font-700
                       bg-[#0E6B45] text-white hover:bg-[#0A5234] transition-colors shadow-sm"
          >
            <Plus size={16} />
            Create First Listing
          </Link>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-700 text-red-800">Failed to load listings</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 text-xs font-700 text-red-700 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !apiPending && !error && listings.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E6E8F0] p-10 text-center shadow-xs">
          <ArchiveX size={40} className="text-[#D1D5DB] mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#111827] mb-2">No listings yet</h3>
          <p className="text-sm text-[#5B6272]">
            Create your first surplus listing to start connecting with recipients.
          </p>
          <Link
            to="/supplier/listings/new"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-[12px] text-sm font-700
                       bg-[#0E6B45] text-white hover:bg-[#0A5234] transition-colors shadow-sm"
          >
            <Plus size={16} />
            Create Listing
          </Link>
        </div>
      )}

      {!loading && !apiPending && !error && filtered.length === 0 && listings.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E6E8F0] p-8 text-center shadow-xs">
          <Filter size={28} className="text-[#D1D5DB] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#111827]">No listings match your filters</p>
          <button
            onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearch(''); }}
            className="mt-3 text-xs font-700 text-[#0E6B45] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {!loading && !apiPending && !error && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E6E8F0] shadow-xs overflow-hidden">
          <div className="divide-y divide-[#E6E8F0]">
            {filtered.map((l) => (
              <div
                key={l.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-[#FAFAFC] transition-colors"
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-xl bg-[#EEF0FA] shrink-0 overflow-hidden border border-[#E6E8F0]">
                  {l.imageUrl ? (
                    <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={20} className="text-[#9CA3AF]" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-700 ${STATUS_COLORS[l.status]}`}>
                      {STATUS_ICONS[l.status]}
                      {STATUS_LABELS[l.status]}
                    </span>
                    {/* Type badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-700 ${l.type === 'edible' ? 'bg-[#DDF7EE] text-[#0E6B45]' : 'bg-[#FBEBDD] text-[#B8650A]'}`}>
                      {l.type === 'edible' ? 'Edible' : 'Organic'}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] font-mono">#{l.id}</span>
                  </div>

                  <h3 className="font-bold text-sm text-[#111827] truncate">{l.title}</h3>
                  <p className="text-xs text-[#5B6272] mt-0.5 line-clamp-1">{l.category}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#5B6272]">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-[#0E6B45]" />
                      {l.supplierLocation}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-[#B8650A]" />
                      Deadline: {new Date(l.collectionDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Weight + CTA */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-lg font-bold text-[#0E6B45]">{formatKg(l.weightKg)}</p>
                  <Link
                    to={`/supplier/listings/${l.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold
                               bg-[#DDF7EE] text-[#0E6B45] hover:bg-[#7EE8C8]/40 transition-colors"
                  >
                    View Details
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
