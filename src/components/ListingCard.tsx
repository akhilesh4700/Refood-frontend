import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Thermometer, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ProgressBar } from './ui/ProgressBar';
import { cn } from './ui/utils';
import { timeLeft } from '../lib/formatters';
import type { Listing } from '../types/domain';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const isEdible = listing.type === 'edible';
  const deadlineStr = listing.safeUntil || listing.collectionDeadline;
  const deadline = deadlineStr ? new Date(deadlineStr) : new Date(Date.now() + 4 * 3600000);

  const [tl, setTl] = useState(() => timeLeft(deadline));

  useEffect(() => {
    const interval = setInterval(() => setTl(timeLeft(deadline)), 1000);
    return () => clearInterval(interval);
  }, [deadlineStr]);

  const storageLabel =
    listing.storageMethod === 'refrigerated'
      ? '2–4°C Chilled'
      : listing.storageMethod === 'frozen'
      ? '≤ -18°C Frozen'
      : 'Ambient';

  return (
    <div
      className={cn(
        'bg-white rounded-[16px] border border-[#E6E8F0] overflow-hidden card-hover flex flex-col',
        'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)]'
      )}
      style={{ borderTop: `4px solid ${isEdible ? '#0E6B45' : '#B8650A'}` }}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-slate-100 shrink-0">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 p-4 text-center">
            <Sparkles size={28} className="mb-1 text-slate-300" />
            <span className="text-xs font-medium">Batch photo verified</span>
          </div>
        )}

        {/* Overlay chips */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge variant={isEdible ? 'edible' : 'organic'} dot>
            {isEdible ? 'Edible Surplus' : 'Organic Biomass'}
          </Badge>
          <Badge variant="neutral" className="bg-black/60 text-white border-0 text-[10px]">
            <Thermometer size={10} className="inline mr-1" />
            {storageLabel}
          </Badge>
        </div>

        {/* Distance pill */}
        {listing.distanceKm != null && (
          <div className="absolute bottom-3 right-3">
            <span className="flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs font-semibold rounded-full">
              <MapPin size={10} />
              {listing.distanceKm} km away
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
        <div>
          {/* Supplier + time */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#5B6272] font-medium truncate max-w-[180px]">
              {listing.supplierName}
            </span>
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                tl.urgent ? 'bg-[#FDE7E7] text-[#C62828]' : 'bg-[#EEF0FA] text-[#5B6272]'
              )}
            >
              <Clock size={10} />
              {tl.label} left
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-[#111827] leading-snug line-clamp-2">
            {listing.title}
          </h3>

          {/* Progress bar */}
          <div className="mt-2.5">
            <ProgressBar
              value={tl.pct}
              label="Rescue Window"
              status={tl.pct > 75 ? 'Critical Dispatch' : tl.pct > 50 ? 'Expiring Soon' : 'Active'}
            />
          </div>

          {/* Fact box */}
          <div className="grid grid-cols-2 gap-2 bg-[#EEF0FA] rounded-[10px] p-2.5 mt-3 text-left">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#5B6272] font-semibold">Surplus Weight</p>
              <p className="text-sm font-bold text-[#111827]">
                {listing.weightKg} kg {listing.portions ? `(${listing.portions} portions)` : ''}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#5B6272] font-semibold">Category</p>
              <p className="text-sm font-bold text-[#111827] capitalize truncate">
                {listing.category || 'General'}
              </p>
            </div>
          </div>

          {/* Allergens warning */}
          {listing.allergens && listing.allergens.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/60">
              <ShieldAlert size={12} className="shrink-0" />
              <span className="truncate">Allergens: {listing.allergens.join(', ')}</span>
            </div>
          )}

          {/* Location */}
          <p className="text-xs text-[#5B6272] flex items-center gap-1 mt-2.5">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{listing.supplierLocation || listing.pickupAddress}</span>
          </p>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <Link to={`/recipient/listings/${listing.id}`} className="block w-full">
            <Button
              variant={isEdible ? 'primary' : 'amber'}
              className="w-full text-sm font-semibold py-2"
            >
              {isEdible ? 'Inspect & Reserve' : 'Claim for Bio-Conversion'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
