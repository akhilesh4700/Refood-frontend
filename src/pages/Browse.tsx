import React, { useEffect, useState, useMemo } from 'react';
import { LayoutGrid, Map, Wifi, HeartHandshake, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ListingCard } from '../components/ListingCard';
import { FilterChip } from '../components/ui/SegmentedControl';
import { Badge } from '../components/ui/Badge';
import { cn } from '../components/ui/utils';
import { getListings, getActiveUser, subscribeToDataChanges } from '../api';
import type { Listing } from '../mocks/data';

type Stream = 'all' | 'edible' | 'organic' | 'urgent' | 'near';

export function Browse() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [stream, setStream] = useState<Stream>('all');
  const [search, setSearch] = useState('');
  const [maxDist, setMaxDist] = useState(25);
  const [activeUser, setActiveUser] = useState(getActiveUser());

  const loadData = async () => {
    const l = await getListings();
    setListings(l);
    setActiveUser(getActiveUser());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (stream === 'edible' && l.stream !== 'edible') return false;
      if (stream === 'organic' && l.stream !== 'organic') return false;
      if (stream === 'urgent' && l.stream !== 'urgent') return false;
      if (stream === 'near' && l.distance > 5) return false;
      if (l.distance > maxDist) return false;
      if (
        search &&
        !l.title.toLowerCase().includes(search.toLowerCase()) &&
        !l.supplier.toLowerCase().includes(search.toLowerCase()) &&
        !l.category.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [listings, stream, search, maxDist]);

  const counts = {
    all: listings.length,
    edible: listings.filter((l) => l.stream === 'edible').length,
    organic: listings.filter((l) => l.stream === 'organic').length,
    urgent: listings.filter((l) => l.stream === 'urgent').length,
    near: listings.filter((l) => l.distance <= 5).length,
  };

  const totalEdibleKg = listings
    .filter((l) => l.stream === 'edible' || l.stream === 'urgent')
    .reduce((s, l) => s + (l.weightKg || 0), 0);

  const totalOrganicKg = listings
    .filter((l) => l.stream === 'organic')
    .reduce((s, l) => s + (l.weightKg || 0), 0);

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#5B6272] font-semibold mb-1 flex items-center gap-2">
            <Wifi size={11} className="text-[#0E6B45]" />
            CIRCULARITY EXCHANGE · LIVE TELEMETRY · {listings.length} Active Batches in Range
          </p>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
            Recovery & Surplus Marketplace
          </h1>
          <p className="text-xs text-[#5B6272] mt-1 max-w-2xl">
            Real-time cold-chain certified edible surplus and clean organic streams mapped for verified NGOs, micro-pantries, and bio-conversion partners.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeUser.role === 'supplier' ? (
            <Link
              to="/listings/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0E6B45] hover:bg-[#0A5234] text-white shadow-xs transition-colors"
            >
              <Plus size={14} />
              + Add New Surplus
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FBEBDD] text-[#B8650A] border border-[#B8650A]/20">
              <HeartHandshake size={14} />
              Buyer Mode Active: 1-Click NGO Claim
            </span>
          )}

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E6E8F0]">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                view === 'grid'
                  ? 'bg-[#EEF0FA] text-[#0E6B45]'
                  : 'text-[#5B6272] hover:text-[#111827]'
              )}
            >
              <LayoutGrid size={13} />
              Grid View
            </button>
            <button
              onClick={() => setView('map')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                view === 'map'
                  ? 'bg-[#EEF0FA] text-[#0E6B45]'
                  : 'text-[#5B6272] hover:text-[#111827]'
              )}
            >
              <Map size={13} />
              Map View
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-[#E6E8F0] p-4 shadow-xs">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-48">
            <input
              type="search"
              placeholder="Search bakery, cooked meals, produce, compost, spent grains…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-3 py-2 text-xs bg-[#EEF0FA] border border-[#E6E8F0] rounded-xl text-[#111827] placeholder:text-[#5B6272]/60 focus:outline-none focus:border-[#0E6B45]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[#5B6272] font-semibold">
              MAX DISTANCE
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={25}
                value={maxDist}
                onChange={(e) => setMaxDist(Number(e.target.value))}
                className="w-32 accent-[#0E6B45]"
                aria-label="Max distance slider"
              />
              <span className="text-xs font-semibold text-[#111827] whitespace-nowrap">
                Within {maxDist} km
              </span>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#0E6B45] rounded cursor-pointer" />
            <span className="text-xs font-semibold text-[#5B6272]">Audit Ready Log</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#E6E8F0]">
          <FilterChip
            label="All Listings"
            count={counts.all}
            active={stream === 'all'}
            onClick={() => setStream('all')}
          />
          <FilterChip
            label="Edible Surplus"
            count={counts.edible}
            active={stream === 'edible'}
            onClick={() => setStream('edible')}
          />
          <FilterChip
            label="Organic Waste"
            count={counts.organic}
            active={stream === 'organic'}
            onClick={() => setStream('organic')}
          />
          <FilterChip
            label="Expiring Soon (<3h)"
            count={counts.urgent}
            active={stream === 'urgent'}
            variant="danger"
            onClick={() => setStream('urgent')}
          />
          <FilterChip
            label="Under 5 km"
            count={counts.near}
            active={stream === 'near'}
            onClick={() => setStream('near')}
          />
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: `${totalEdibleKg} kg Rescuable Today`,
            icon: '♻',
            bg: 'bg-[#EEF0FA]',
            text: 'text-[#111827]',
          },
          {
            label: '100% Cold-Chain Logged',
            icon: '❄',
            bg: 'bg-[#DDF7EE]',
            text: 'text-[#0E6B45]',
          },
          {
            label: `${totalOrganicKg} kg Soil / Feed Biomass`,
            icon: '🌱',
            bg: 'bg-[#FBEBDD]',
            text: 'text-[#B8650A]',
          },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl p-4 flex items-center gap-3 border border-[#E6E8F0]/60', s.bg)}>
            <span className="text-xl">{s.icon}</span>
            <p className={cn('text-xs font-bold', s.text)}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Grid */}
        <div className="flex-1 min-w-0 w-full">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-[#E6E8F0] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filtered.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-[#E6E8F0] p-6">
                  <p className="text-sm font-bold text-[#111827]">No listings match your filters</p>
                  <p className="text-xs text-[#5B6272] mt-1">Try widening the distance slider or clearing the search query.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          {/* Map card */}
          <div className="bg-white rounded-2xl border border-[#E6E8F0] overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-[#E6E8F0] flex items-center justify-between">
              <p className="text-xs font-bold text-[#111827]">Spatial Radius Telemetry</p>
              <span className="text-[10px] text-[#0E6B45] font-semibold bg-[#DDF7EE] px-2 py-0.5 rounded-full">
                Live OpenStreetMap
              </span>
            </div>
            <div className="p-4 bg-[#F6F7FB] relative h-48 flex items-center justify-center">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#CBD5E1_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
              <div className="relative z-10 text-center">
                <div className="w-12 h-12 rounded-full bg-[#0E6B45] text-white flex items-center justify-center mx-auto shadow-md font-bold text-xs animate-pulse">
                  {filtered.length} Hubs
                </div>
                <p className="text-xs font-bold text-[#111827] mt-2">Koramangala · Indiranagar Corridor</p>
                <p className="text-[10px] text-[#5B6272]">Concentric rings: 1km, 3km, 5km radius</p>
              </div>
            </div>
            <div className="p-3 border-t border-[#E6E8F0] text-[11px] text-[#5B6272] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0E6B45]" /> Edible
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#B8650A]" /> Biomass
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C62828]" /> &lt;2h Alert
              </span>
            </div>
          </div>

          {/* Consolidated Pickup Route Suggestion */}
          <div className="bg-white rounded-2xl border border-[#E6E8F0] p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-[10px] font-bold">
                Smart Dispatch
              </span>
            </div>
            <h4 className="text-xs font-bold text-[#111827]">Consolidated Pickup Suggestion</h4>
            <p className="text-xs text-[#5B6272] mt-1 leading-relaxed">
              Combine 2 nearby bakery & meal lots along Outer Ring Rd to reduce transit footprint by 4.2 kg CO2e.
            </p>
            <button
              type="button"
              onClick={() => alert('Generated Multi-Stop Route for Driver: Route shared via SMS.')}
              className="mt-3 w-full py-2 bg-[#EEF0FA] hover:bg-[#E6E8F0] text-[#0E6B45] text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Generate Multi-Stop Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
