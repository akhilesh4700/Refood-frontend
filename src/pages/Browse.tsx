import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Wifi,
  HeartHandshake,
  Loader2,
  AlertCircle,
  PackageX,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  MapPin,
} from 'lucide-react';
import { ListingCard } from '../components/ListingCard';
import { getListings, isApiConfigured } from '../api';
import type { Listing, ListingType } from '../types/domain';

type StreamFilter = 'all' | 'edible' | 'organic';

export function Browse() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [streamFilter, setStreamFilter] = useState<StreamFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam: ListingType | undefined =
        streamFilter === 'all' ? undefined : streamFilter;
      const res = await getListings({
        type: typeParam,
        search: search.trim() || undefined,
        status: 'active',
      });
      // Handle both PaginatedResponse and raw array defensively
      const items = Array.isArray(res) ? res : res?.items ?? [];
      setListings(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to marketplace service';
      setError(msg);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [streamFilter, search]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Extract unique categories from current items
  const categories = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set);
  }, [listings]);

  // Filter listings by selected category and search locally if items present
  const displayListings = useMemo(() => {
    return listings.filter((l) => {
      if (selectedCategory !== 'all' && l.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [listings, selectedCategory]);

  const edibleCount = listings.filter((l) => l.type === 'edible').length;
  const organicCount = listings.filter((l) => l.type === 'organic').length;

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#5B6272] font-semibold mb-1 flex items-center gap-2">
            <Wifi size={11} className="text-[#0E6B45]" />
            CIRCULARITY EXCHANGE · RECIPIENT RECOVERY MARKETPLACE
          </p>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
            Surplus & Biomass Marketplace
          </h1>
          <p className="text-xs text-[#5B6272] mt-1 max-w-2xl leading-relaxed">
            Direct recovery portal for verified NGOs, food rescue organizations, and licensed organic recyclers.
            All batches are temperature-logged and time-stamped by suppliers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FBEBDD] text-[#B8650A] border border-[#B8650A]/20">
            <HeartHandshake size={14} />
            Verified Recipient Portal
          </span>
          <button
            onClick={fetchListings}
            disabled={loading}
            className="p-2 rounded-xl border border-[#E6E8F0] hover:bg-slate-100 text-[#5B6272] transition-colors"
            title="Refresh marketplace"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Backend connection notice if not configured */}
      {!isApiConfigured() && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Platform Notice:</strong> Backend API is pending connection. Available listings will appear live once the central database is connected.
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
            VITE_API_BASE_URL
          </span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Stream Type Tabs */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl self-start">
            <button
              onClick={() => setStreamFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                streamFilter === 'all'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#5B6272] hover:text-[#111827]'
              }`}
            >
              All Batches ({listings.length})
            </button>
            <button
              onClick={() => setStreamFilter('edible')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                streamFilter === 'edible'
                  ? 'bg-white text-[#0E6B45] shadow-xs'
                  : 'text-[#5B6272] hover:text-[#0E6B45]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#0E6B45]" />
              Edible Food ({edibleCount})
            </button>
            <button
              onClick={() => setStreamFilter('organic')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                streamFilter === 'organic'
                  ? 'bg-white text-[#B8650A] shadow-xs'
                  : 'text-[#5B6272] hover:text-[#B8650A]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#B8650A]" />
              Organic Biomass ({organicCount})
            </button>
          </div>

          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, ingredient, category..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E6B45]/20 focus:border-[#0E6B45] transition-all"
            />
          </div>
        </div>

        {/* Category sub-filter chips */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs">
            <span className="text-[#5B6272] flex items-center gap-1 shrink-0 font-medium text-[11px]">
              <Filter size={12} /> Category:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 size={32} className="animate-spin text-[#0E6B45] mb-3" />
          <p className="text-xs font-medium">Scanning live surplus inventory...</p>
        </div>
      ) : displayListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        /* Honest empty state */
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <PackageX size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {error ? 'Marketplace Offline' : 'No Surplus Batches Available'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
            {error
              ? 'Unable to connect to the backend server. Configure VITE_API_BASE_URL to load real-time active listings.'
              : 'There are currently no active surplus listings matching your filters. New batches will appear here as suppliers publish them.'}
          </p>
          <button
            onClick={fetchListings}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw size={13} />
            Check Again
          </button>
        </div>
      )}
    </div>
  );
}
