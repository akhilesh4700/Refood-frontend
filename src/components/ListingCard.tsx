import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Thermometer } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ProgressBar } from './ui/ProgressBar';
import { cn } from './ui/utils';
import { timeLeft } from '../lib/formatters';
import type { Listing } from '../mocks/data';

interface ListingCardProps {
  listing: Listing;
}

const streamConfig = {
  edible: { badge: 'edible' as const, cta: 'Reserve Batch', ctaVariant: 'primary' as const, border: '#0E6B45', tag: 'Edible Surplus' },
  organic: { badge: 'organic' as const, cta: 'Claim for Bio-Conversion', ctaVariant: 'amber' as const, border: '#B8650A', tag: 'Organic Biomass' },
  urgent: { badge: 'urgent' as const, cta: 'Express Claim', ctaVariant: 'danger' as const, border: '#C62828', tag: 'Urgent Rescue' },
};

export function ListingCard({ listing }: ListingCardProps) {
  const cfg = streamConfig[listing.stream];
  const [tl, setTl] = useState(() => timeLeft(listing.expiresAt));

  useEffect(() => {
    const interval = setInterval(() => setTl(timeLeft(listing.expiresAt)), 1000);
    return () => clearInterval(interval);
  }, [listing.expiresAt]);

  return (
    <div
      className={cn(
        'bg-white rounded-[16px] border border-[#E6E8F0] overflow-hidden card-hover',
        'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)]'
      )}
      style={{ borderTop: `4px solid ${cfg.border}` }}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Overlay chips */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={cfg.badge} dot>{cfg.tag}</Badge>
          <Badge variant="neutral" className="bg-black/60 text-white border-0">
            <Thermometer size={10} className="inline mr-1" />{listing.temperature}
          </Badge>
        </div>
        {/* Distance pill */}
        <div className="absolute bottom-3 right-3">
          <span className="flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs font-600 rounded-full">
            <MapPin size={10} />{listing.distance} km away
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Supplier + time */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#5B6272] font-500">{listing.supplier}</span>
          <span className={cn(
            'flex items-center gap-1 text-xs font-600 px-2 py-0.5 rounded-full',
            tl.urgent ? 'bg-[#FDE7E7] text-[#C62828]' : 'bg-[#EEF0FA] text-[#5B6272]'
          )}>
            <Clock size={10} />{tl.label} left
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-600 text-[#111827] leading-snug line-clamp-2">{listing.title}</h3>

        {/* Progress bar */}
        <ProgressBar
          value={tl.pct}
          label="Rescue Window"
          status={tl.pct > 75 ? 'Critical Dispatch' : tl.pct > 50 ? 'Expiring Soon' : 'Active'}
        />

        {/* Fact box */}
        <div className="grid grid-cols-2 gap-2 bg-[#EEF0FA] rounded-[10px] p-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#5B6272] font-600">Surplus Weight</p>
            <p className="text-sm font-700 text-[#111827]">{listing.weightKg} kg ({listing.portions} portions)</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#5B6272] font-600">Pickup Slot</p>
            <p className="text-sm font-700 text-[#111827]">{listing.pickupSlot}</p>
          </div>
        </div>

        {/* Location */}
        <p className="text-xs text-[#5B6272] flex items-center gap-1">
          <MapPin size={11} />{listing.location}
        </p>

        {/* CTA */}
        <div className="flex gap-2">
          <Link to={`/listings/${listing.id}`} className="flex-1">
            <Button variant={cfg.ctaVariant} className="w-full text-sm">
              {cfg.cta}
            </Button>
          </Link>
          <button
            aria-label="Show on map"
            className="w-10 h-10 flex items-center justify-center rounded-[10px] border border-[#E6E8F0] hover:bg-[#EEF0FA] text-[#5B6272] transition-colors cursor-pointer"
          >
            <MapPin size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
