import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Download,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  FileCheck2,
  Check,
  PackageCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';

// Monthly stacked data matching screenshot 7
const chartData = [
  { month: 'May', biogas: 1320, shelter: 2500, total: '3,820' },
  { month: 'Jun', biogas: 1450, shelter: 2700, total: '4,150' },
  { month: 'Jul', biogas: 1550, shelter: 3050, total: '4,600' },
  { month: 'Aug', biogas: 1610, shelter: 3300, total: '4,910' },
  { month: 'Sep', biogas: 1520, shelter: 2900, total: '4,420' },
  { month: 'Oct (Peak)', biogas: 1720, shelter: 4050, total: '5,770 kg' },
];

import { getImpactMetrics, subscribeToDataChanges } from '../api';
import type { ImpactMetrics } from '../mocks/data';

const periodTabs = ['Last 30 Days', 'Q3 2024', 'Year-to-Date', 'Lifetime'];

export function Analytics() {
  const [activePeriod, setActivePeriod] = useState('Last 30 Days');
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);

  const loadData = async (period: string) => {
    const pKey = period === 'Q3 2024' ? 'q3' : period === 'Year-to-Date' ? 'ytd' : period === 'Lifetime' ? 'lifetime' : '30d';
    const data = await getImpactMetrics(pKey);
    setMetrics(data);
  };

  useEffect(() => {
    loadData(activePeriod);
    const unsub = subscribeToDataChanges(() => {
      loadData(activePeriod);
    });
    return unsub;
  }, [activePeriod]);

  const handleExport = () => {
    const report = {
      reportingPeriod: activePeriod,
      supplier: 'Hotel Grand Royale',
      totalFoodRescuedKg: metrics?.totalRescuedKg || 4850,
      co2PreventedT: metrics?.co2PreventedT || 12.4,
      organicWasteProcessedKg: metrics?.organicProcessedKg || 1920,
      coordinationIndex: `${metrics?.coordinationIndex || 98.5}%`,
      diversionRatio: '87.4%',
      taxBenefitAccrual: 14820,
      monthlyData: chartData,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ReFood-ESG-Report-${activePeriod.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E6E8F0]">
        <div className="max-w-[1240px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0E6B45] bg-[#DDF7EE] px-2.5 py-0.5 rounded-full border border-[#7EE8C8]/40">
                VERIFIABLE AUDIT STREAM
              </span>
              <span className="text-[11px] text-[#5B6272]">
                GHG Protocol Scope 3 Category 5
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
              Sustainability & Circular Impact
            </h1>
            <p className="text-xs text-[#5B6272] mt-1">
              Real-time telemetry, landfill diversion metrics, and cold-chain compliance for Hotel Grand Royale.
            </p>
          </div>

          {/* Top Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 bg-[#EEF0FA] rounded-xl border border-[#E6E8F0]">
              {periodTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActivePeriod(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activePeriod === tab
                      ? 'bg-white text-[#111827] shadow-xs'
                      : 'text-[#5B6272] hover:text-[#111827]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E6B45] hover:bg-[#0A5234] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              Export ESG Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-6 pt-8 space-y-8">
        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E8F0] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0E6B45]" />
                Edible Flow
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#DDF7EE] text-[#0E6B45] flex items-center justify-center">
                <PackageCheck size={16} />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#5B6272]">
                TOTAL FOOD RESCUED
              </div>
              <div className="text-3xl font-extrabold text-[#111827] mt-1 tracking-tight">
                {metrics ? metrics.totalRescuedKg.toLocaleString('en-IN') : '4,850'} <span className="text-lg font-bold text-[#111827]">kg</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#E6E8F0] flex items-center justify-between text-xs">
              <span className="text-[#0E6B45] font-semibold flex items-center gap-1">
                <TrendingUp size={13} />
                +18% vs last month
              </span>
              <span className="text-[#5B6272]">~{metrics ? Math.round(metrics.totalRescuedKg * 2.3).toLocaleString('en-IN') : '11,200'} meals</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E8F0] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0E6B45]" />
                Methane Offset
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#DDF7EE] text-[#0E6B45] flex items-center justify-center font-bold text-xs">
                CO₂
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#5B6272]">
                CO₂ EQUIVALENT PREVENTED
              </div>
              <div className="text-3xl font-extrabold text-[#111827] mt-1 tracking-tight">
                {metrics ? metrics.co2PreventedT : '12.4'} <span className="text-lg font-bold text-[#111827]">t</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#E6E8F0] flex items-center justify-between text-xs text-[#5B6272]">
              <span>Avoided Landfill Methane</span>
              <span className="px-2 py-0.5 rounded bg-[#EEF0FA] text-[#0E6B45] font-semibold text-[10px]">
                Scope 3
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E8F0] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FBEBDD] text-[#B8650A] text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8650A]" />
                Bio-Conversion
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FBEBDD] text-[#B8650A] flex items-center justify-center">
                <span className="font-bold text-sm">♻</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#5B6272]">
                ORGANIC WASTE PROCESSED
              </div>
              <div className="text-3xl font-extrabold text-[#111827] mt-1 tracking-tight">
                {metrics ? metrics.organicProcessedKg.toLocaleString('en-IN') : '1,920'} <span className="text-lg font-bold text-[#111827]">kg</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#E6E8F0] flex items-center justify-between text-xs text-[#5B6272]">
              <span>640 kg rich compost</span>
              <span className="text-[#B8650A] font-semibold">310 kWh Biogas</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E8F0] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EEF0FA] text-[#0E6B45] text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0E6B45]" />
                Logistics SLA
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#DDF7EE] text-[#0E6B45] flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#5B6272]">
                COORDINATION INDEX
              </div>
              <div className="text-3xl font-extrabold text-[#111827] mt-1 tracking-tight">
                98.5%
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#E6E8F0] flex items-center justify-between text-xs text-[#5B6272]">
              <span>Pickup Reliability</span>
              <span className="font-semibold text-[#111827]">28m avg window</span>
            </div>
          </div>
        </div>

        {/* ReFood AI Matcher Banner */}
        <div className="bg-[#0A5234] rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <Zap size={20} className="text-[#7EE8C8]" />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[#7EE8C8] text-[10px] font-bold uppercase tracking-wider">
                    REFOOD AI MATCHER
                  </span>
                  <span className="text-[11px] text-gray-300">Updated 12 mins ago</span>
                </div>

                <h2 className="text-xl font-bold tracking-tight">
                  High-Confidence Dispatch Opportunity
                </h2>
                <p className="text-xs text-gray-200 mt-1 max-w-2xl leading-relaxed">
                  Your Tuesday evening buffet surplus has a{' '}
                  <span className="underline decoration-[#7EE8C8] decoration-2 underline-offset-4 font-bold text-white">
                    94% match probability
                  </span>{' '}
                  with <strong>Downtown Shelter (1.2 km away)</strong> based on their urgent dinner capacity requirement.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => alert('Reviewing match opportunity parameters...')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Review Details
              </button>
              <button
                type="button"
                onClick={() => alert('Auto-Notify enabled for Downtown Shelter!')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#7EE8C8] hover:bg-[#7EE8C8]/90 text-[#0A5234] transition-colors shadow-xs cursor-pointer"
              >
                <Zap size={14} />
                Enable Auto-Notify
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Middle Section: Monthly Breakdown & Top Recipient Partners */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Monthly Food Diversion Breakdown */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-[#111827]">Monthly Food Diversion Breakdown</h3>
                <p className="text-xs text-[#5B6272] mt-0.5">
                  Edible surplus distribution vs organic waste bioconversion
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0E6B45]" />
                  <span className="text-[#111827]">Shelter Surplus (kg)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B8650A]" />
                  <span className="text-[#111827]">Biogas / Compost (kg)</span>
                </div>
              </div>
            </div>

            {/* Stacked Bar Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 25, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#5B6272', fontSize: 11 }}
                    axisLine={{ stroke: '#E6E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#5B6272', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val / 1000}k kg`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  {/* Bottom stacked: Biogas / Compost (amber/brown) */}
                  <Bar dataKey="biogas" stackId="a" fill="#B8650A" radius={[0, 0, 0, 0]} />
                  {/* Top stacked: Shelter Surplus (dark green) */}
                  <Bar dataKey="shelter" stackId="a" fill="#0E6B45" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Bar Info */}
            <div className="mt-4 pt-4 border-t border-[#E6E8F0] flex flex-wrap items-center justify-between text-xs text-[#5B6272]">
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-[#0E6B45]" />
                <span>All collections verified via digital tare scale and thermal probe logs.</span>
              </div>
              <span className="font-semibold text-[#111827]">Target: 8,000 kg/mo by Q1 2025</span>
            </div>
          </div>

          {/* Right Column (4 cols): Top Recipient Partners */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#111827]">Top Recipient Partners</h3>
                <p className="text-xs text-[#5B6272]">Ranked by volume rescued</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#EEF0FA] text-[#5B6272] flex items-center justify-center">
                <SlidersHorizontal size={14} />
              </div>
            </div>

            <div className="space-y-4">
              {/* Partner 1 */}
              <div className="p-3.5 bg-white border border-[#E6E8F0] rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-[#111827]">Hope Community Foodbank</h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-[10px] font-bold">
                    Shelter
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5B6272] mb-2">
                  <span>2,430 kg delivered</span>
                  <span className="font-bold text-[#111827]">5,620 meals</span>
                </div>
                <div className="w-full h-1.5 bg-[#EEF0FA] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0E6B45] rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              {/* Partner 2 */}
              <div className="p-3.5 bg-white border border-[#E6E8F0] rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-[#111827]">St. Jude Youth Shelter</h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#EEF0FA] text-[#0E6B45] text-[10px] font-bold">
                    Youth Outreach
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5B6272] mb-2">
                  <span>1,510 kg delivered</span>
                  <span className="font-bold text-[#111827]">3,490 meals</span>
                </div>
                <div className="w-full h-1.5 bg-[#EEF0FA] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0E6B45] rounded-full" style={{ width: '55%' }} />
                </div>
              </div>

              {/* Partner 3 */}
              <div className="p-3.5 bg-white border border-[#E6E8F0] rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-[#111827]">GreenCycle Composting</h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#FBEBDD] text-[#B8650A] text-[10px] font-bold">
                    Soil / Bio
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5B6272] mb-2">
                  <span>1,920 kg processed</span>
                  <span className="font-bold text-[#B8650A]">640 kg humus</span>
                </div>
                <div className="w-full h-1.5 bg-[#EEF0FA] rounded-full overflow-hidden">
                  <div className="h-full bg-[#B8650A] rounded-full" style={{ width: '68%' }} />
                </div>
              </div>
            </div>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => alert('Viewing all 18 certified recipient partner profiles...')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0E6B45] hover:underline cursor-pointer"
              >
                View All 18 Certified Partners
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Bottom Section: ESG Summary & Active Dispatch Manifest */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): ESG & CSR Compliance Summary */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <FileCheck2 size={18} className="text-[#0E6B45]" />
                <h3 className="text-base font-bold text-[#111827]">ESG & CSR Compliance Summary</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-xs font-bold">
                Audit Ready - 2024
              </span>
            </div>
            <p className="text-xs text-[#5B6272] mb-5">
              Standardized for corporate non-financial disclosures (CSRD, SASB, and Global Reporting Initiative).
            </p>

            {/* 3 Metric Inset Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-3.5 bg-[#F6F7FB] border border-[#E6E8F0] rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">
                  GHG PROTOCOL
                </div>
                <div className="text-xl font-bold text-[#0E6B45] mt-1">Scope 3.5</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">Waste Generated in Operations</div>
              </div>

              <div className="p-3.5 bg-[#F6F7FB] border border-[#E6E8F0] rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">
                  DIVERSION RATIO
                </div>
                <div className="text-xl font-bold text-[#111827] mt-1">87.4%</div>
                <div className="text-[11px] text-[#0E6B45] font-semibold mt-0.5">+9.2% above baseline</div>
              </div>

              <div className="p-3.5 bg-[#F6F7FB] border border-[#E6E8F0] rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">
                  TAX BENEFIT ACCRUAL
                </div>
                <div className="text-xl font-bold text-[#B8650A] mt-1">$14,820</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">IRS Section 170(e)(3)</div>
              </div>
            </div>

            {/* Third-Party Verification Hash Row */}
            <div className="p-3.5 bg-[#F6F7FB] border border-[#E6E8F0] rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E6E8F0] flex items-center justify-center shrink-0 text-[#0E6B45]">
                <FileCheck2 size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#111827]">Third-Party Verification Hash Available</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">
                  All dispatch logs are sealed with cryptographically timestamped QR receipts signed by pickup coordinators.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Active Dispatch Manifest */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#111827]">Active Dispatch Manifest</h3>
                <span className="w-2 h-2 rounded-full bg-[#0E6B45]" />
              </div>
            </div>
            <p className="text-xs text-[#5B6272] mb-4">
              Current field pickups & temperature compliance
            </p>

            <div className="border border-[#E6E8F0] rounded-xl overflow-hidden shadow-xs">
              <div className="relative h-44 bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=350&fit=crop"
                  alt="Dispatch Kitchen Operation"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-[#0E6B45] text-white text-[10px] font-bold">
                    Pickup #RF-48902 - In Transit
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 text-white text-xs font-semibold">
                  Grand Royale Main Kitchen → Hope Community
                </div>

                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono">
                  3.4°C (Safe)
                </div>
              </div>

              <div className="p-3 bg-white flex items-center justify-between text-xs">
                <span className="text-[#5B6272]">Driver: Marcus V. (ReFood Verified)</span>
                <span className="font-bold text-[#0E6B45]">ETA: 14 mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
