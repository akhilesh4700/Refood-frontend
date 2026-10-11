import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Thermometer, FileCheck, Check, ArrowRight,
  UserPlus, Leaf, Users, Wind, Utensils, HandHeart,
  Truck, ChevronRight, Star, LogIn, ChevronDown
} from 'lucide-react';
import { LiveFeed } from '../components/LiveFeed';

/* ─── Animated counter hook ─────────────────────────────────────────── */
function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * ease));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

/* ─── Stat Card Component ─────────────────────────────────────────────── */
function StatCounter({ value, unit, label, sub, icon, iconBg }: {
  value: number; unit: string; label: string; sub: string;
  icon: React.ReactNode; iconBg: string;
}) {
  const { count, ref } = useCounter(value);
  return (
    <div
      ref={ref}
      className="bg-white rounded-[20px] border border-[#E6E8F0] p-6 flex items-center gap-5
                 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_4px_20px_rgba(16,24,40,0.05)]
                 hover:shadow-[0_4px_24px_rgba(14,107,69,0.12)] hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className={`w-14 h-14 rounded-[14px] flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-extrabold text-[#111827] leading-none tabular-nums">
          {count.toLocaleString('en-IN')}
          <span className="text-base text-[#5B6272] font-medium ml-1">{unit}</span>
        </p>
        <p className="text-sm font-bold text-[#111827] mt-1.5">{label}</p>
        <p className="text-xs text-[#5B6272] mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

/* ─── Role Card Component ─────────────────────────────────────────────── */
function RoleCard({
  role, icon, iconBg, badge, badgeBg, badgeText,
  title, desc, image, features, ctaLabel, ctaStyle, onSelect,
}: {
  role: 'supplier' | 'recipient';
  icon: React.ReactNode; iconBg: string;
  badge: string; badgeBg: string; badgeText: string;
  title: string; desc: string; image: string;
  features: string[];
  ctaLabel: string; ctaStyle: string;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const borderColor = role === 'supplier' ? '#0E6B45' : '#B8650A';
  const checkColor = role === 'supplier' ? 'text-[#0E6B45]' : 'text-[#B8650A]';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-white rounded-[20px] border-2 flex flex-col gap-0 overflow-hidden
                 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_4px_20px_rgba(16,24,40,0.05)]
                 transition-all duration-300 cursor-pointer group"
      style={{
        borderColor: hovered ? borderColor : `${borderColor}33`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 8px 32px ${borderColor}22, 0 2px 8px rgba(16,24,40,0.08)`
          : undefined,
      }}
      onClick={onSelect}
    >
      {/* Card header */}
      <div className="p-5 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className={`w-11 h-11 ${iconBg} rounded-[12px] flex items-center justify-center`}>
            {icon}
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeBg} ${badgeText}`}>
            {badge}
          </span>
        </div>
        <div>
          <p className="font-extrabold text-[#111827] text-base">{title}</p>
          <p className="text-xs text-[#5B6272] mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>

      {/* Photo */}
      <div className="mx-5 rounded-[12px] overflow-hidden h-[148px] relative shrink-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Features */}
      <ul className="px-5 pt-4 pb-3 flex flex-col gap-2.5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-xs text-[#374151]">
            <Check size={13} className={`${checkColor} mt-0.5 shrink-0`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          type="button"
          className={`w-full py-3 rounded-[12px] text-sm font-bold flex items-center justify-center gap-2
                     transition-all duration-200 active:scale-[0.98] ${ctaStyle}`}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Landing Page ───────────────────────────────────────────────── */
export function Landing() {
  const navigate = useNavigate();
  const [kitchenLoaded, setKitchenLoaded] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);

  const handleRoleSelect = (role: 'supplier' | 'recipient') => {
    // Navigate directly to role-specific login
    const path = role === 'supplier' ? '/supplier/login' : '/recipient/login';
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#F5F5FA] font-[Inter,system-ui,sans-serif]">

      {/* ── Top Nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#E6E8F0] bg-white/90 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0E6B45] rounded-[10px] flex items-center justify-center shadow-xs">
              <Leaf size={15} className="text-white" />
            </div>
            <span className="font-extrabold text-[#111827] text-lg tracking-tight">ReFood</span>
            <span className="hidden sm:inline ml-2 text-[10px] font-bold uppercase tracking-widest text-[#5B6272] bg-[#F5F5FA] px-2.5 py-1 rounded-full border border-[#E6E8F0]">
              Circular Network
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Role-specific login selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLoginMenu(!showLoginMenu)}
                className="px-3.5 py-2 text-xs font-semibold text-[#374151] hover:text-[#111827] border border-[#E6E8F0] rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <LogIn size={13} />
                <span>Log In</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {showLoginMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    to="/supplier/login"
                    onClick={() => setShowLoginMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#DDF7EE] hover:text-[#0E6B45] transition-colors"
                  >
                    <Utensils size={14} className="text-[#0E6B45]" />
                    <span>Food Supplier Login</span>
                  </Link>
                  <Link
                    to="/recipient/login"
                    onClick={() => setShowLoginMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#FBEBDD] hover:text-[#B8650A] transition-colors"
                  >
                    <HandHeart size={14} className="text-[#B8650A]" />
                    <span>Recipient / NGO Login</span>
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleRoleSelect('supplier')}
              className="px-4 py-2 bg-[#0E6B45] text-white text-xs font-bold rounded-xl
                         hover:bg-[#0a5234] transition-all duration-200 shadow-xs"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-5 py-10 lg:py-14">

        {/* ── Two-Column Hero ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-start">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-7">

            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#0E6B45]/25
                           bg-white text-xs font-bold text-[#0E6B45] w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0E6B45] animate-pulse" />
              Decentralized Surplus Redistribution Network
            </div>

            {/* Hero headline */}
            <div>
              <h1 className="text-[2.75rem] lg:text-[3.25rem] font-extrabold leading-[1.08] text-[#111827] tracking-tight">
                Connecting surplus<br />
                food to those who{' '}
                <em className="not-italic italic text-[#0E6B45]">need it most</em>
              </h1>
              <p className="mt-5 text-[15px] text-[#5B6272] leading-[1.75] max-w-[440px]">
                ReFood creates a real-time bridge between commercial kitchens, hotels, and
                supermarkets with verified local NGOs, shelters, and bio-conversion facilities.
                No landfill waste, zero broker markups.
              </p>
            </div>

            {/* Trust card */}
            <div className="bg-white rounded-[18px] border border-[#E6E8F0] p-5
                           shadow-[0_1px_3px_rgba(16,24,40,0.05),0_4px_16px_rgba(16,24,40,0.04)]">
              <div className="flex items-start gap-3.5 mb-3.5">
                <div className="w-10 h-10 bg-[#0E6B45] rounded-[12px] flex items-center justify-center shrink-0 shadow-xs">
                  <Shield size={16} className="text-[#7EE8C8]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827]">Zero Broker Markup Protocol</p>
                  <p className="text-[11px] text-[#5B6272] mt-0.5">Direct peer-to-peer manifest exchange</p>
                </div>
              </div>
              <p className="text-[12.5px] text-[#5B6272] leading-relaxed mb-4">
                Direct peer-to-peer coordination — zero delivery middleman fees, self-arranged
                cold-chain pickup, and verifiable automated handover receipts.
              </p>
              <div className="flex flex-wrap gap-4 pt-3.5 border-t border-[#F0F1F7]">
                {[
                  { icon: <Shield size={11} />, label: '100% Identity Vetted' },
                  { icon: <Thermometer size={11} />, label: 'Safe-Temp Logs' },
                  { icon: <FileCheck size={11} />, label: 'CSR Audit Ready' },
                ].map((t) => (
                  <span key={t.label} className="flex items-center gap-1.5 text-[11px] font-bold text-[#5B6272]">
                    <span className="text-[#0E6B45]">{t.icon}</span>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Kitchen photo card */}
            <div className="relative rounded-[18px] overflow-hidden h-[220px] shadow-sm group">
              <img
                src="/supplier_bakery.jpg"
                alt="Commercial kitchen — food surplus being packed"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onLoad={() => setKitchenLoaded(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#0E6B45] rounded-[8px] flex items-center justify-center shrink-0">
                  <Truck size={12} className="text-white" />
                </div>
                <p className="text-white text-[12px] font-semibold drop-shadow-xs">
                  Commercial Kitchen Logistics & Cold Chain Compliance
                </p>
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm
                             px-2.5 py-1 rounded-full text-[11px] font-bold text-[#111827] shadow-xs">
                <Star size={10} className="text-amber-500 fill-amber-500" />
                Verified Network
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#111827]">Select platform entry path</p>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#0E6B45]">
                ROLE-BASED ONBOARDING
              </p>
            </div>

            {/* Role cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RoleCard
                role="supplier"
                icon={<Utensils size={20} className="text-[#0E6B45]" />}
                iconBg="bg-[#DDF7EE]"
                badge="Donors & Supply"
                badgeBg="bg-[#DDF7EE]"
                badgeText="text-[#0E6B45]"
                title="I'm a Food Supplier"
                desc="Hotels, restaurants, bakeries, campus caterers, and supermarkets."
                image="/supplier_bakery.jpg"
                features={[
                  'Instant surplus clearance & dispatch window',
                  'Automated CSR impact & emissions logs',
                  'Direct vetted recipient coordination',
                ]}
                ctaLabel="Start Listing Surplus →"
                ctaStyle="bg-[#0E6B45] text-white hover:bg-[#0a5234] shadow-xs"
                onSelect={() => handleRoleSelect('supplier')}
              />
              <RoleCard
                role="recipient"
                icon={<HandHeart size={20} className="text-[#B8650A]" />}
                iconBg="bg-[#FBEBDD]"
                badge="Recipients & Processors"
                badgeBg="bg-[#FBEBDD]"
                badgeText="text-[#B8650A]"
                title="I'm a Recipient / Processor"
                desc="NGOs, soup kitchens, food banks, urban composters, and biogas units."
                image="/recipient_foodbank.jpg"
                features={[
                  'Real-time localized surplus push alerts',
                  'Smart filtering: Edible grade vs Compost stream',
                  'Self-arranged pickup lock & safe code dispatch',
                ]}
                ctaLabel="Browse as Recipient →"
                ctaStyle="bg-[#B8650A] text-white hover:bg-[#9a550a] shadow-xs"
                onSelect={() => handleRoleSelect('recipient')}
              />
            </div>

            {/* Live Feed bar */}
            <LiveFeed />

            {/* Trust badges row */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { icon: <Shield size={11} />, label: 'FSSAI Compliant' },
                { icon: <FileCheck size={11} />, label: 'Good Samaritan Act' },
                { icon: <ChevronRight size={11} />, label: 'Zero Brokerage' },
              ].map((b) => (
                <span
                  key={b.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E6E8F0]
                             text-[11px] font-semibold text-[#5B6272] shadow-2xs"
                >
                  <span className="text-[#0E6B45]">{b.icon}</span>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Impact Potential Section ───────────────────────────── */}
        <div className="mt-14 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#111827]">Platform Recovery Model</h3>
            <span className="text-[11px] text-[#5B6272]">
              Benchmark metric estimates based on regional pilot performance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCounter
              value={42500}
              unit="kg"
              label="Potential Food Rescued"
              sub="Capacity modelled for active clusters"
              icon={<Leaf size={24} className="text-[#0E6B45]" />}
              iconBg="bg-[#DDF7EE]"
            />
            <StatCounter
              value={180}
              unit="+"
              label="Onboarded NGOs & Shelters"
              sub="Verified community recovery partners"
              icon={<Users size={24} className="text-[#5B6272]" />}
              iconBg="bg-[#EEF0FA]"
            />
            <StatCounter
              value={94}
              unit="MT CO2e"
              label="Estimated GHG Abatement"
              sub="Based on EPA WARM diversion factors"
              icon={<Wind size={24} className="text-[#B8650A]" />}
              iconBg="bg-[#FBEBDD]"
            />
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="mt-14 pt-8 border-t border-[#E6E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#0E6B45] rounded-[8px] flex items-center justify-center">
              <Leaf size={12} className="text-white" />
            </div>
            <span className="font-bold text-[#111827] text-sm">ReFood</span>
            <span className="text-xs text-[#5B6272]">Circular Food Surplus Network · Bengaluru, India</span>
          </div>
          <p className="text-[11px] text-[#5B6272]">
            © 2026 ReFood · FSSAI Protocol · Good Samaritan Compliant · DARPAN Verified
          </p>
        </footer>
      </div>
    </div>
  );
}
