import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Download, TrendingUp, FileSpreadsheet, CheckCircle2, ShieldCheck,
  Zap, FileCheck2, PackageCheck, Loader2, AlertCircle, Info,
} from 'lucide-react';
import {
  getSupplierAnalytics, getRecipientAnalytics,
  getStoredUser, ApiUnavailableError,
} from '../api';
import type { SupplierMetrics, RecipientMetrics, CollectionRecord } from '../types/domain';

const PERIOD_TABS = [
  { label: 'Last 30 Days', key: '30d' },
  { label: 'Q3 2024',      key: 'q3'  },
  { label: 'Year-to-Date', key: 'ytd' },
  { label: 'Lifetime',     key: 'lifetime' },
];

function MetricCard({
  label, value, unit, badge, badgeColor, note, icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  badge?: string;
  badgeColor?: string;
  note?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E6E8F0] shadow-xs">
      <div className="flex items-center justify-between mb-3">
        {badge && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor || 'bg-[#DDF7EE] text-[#0E6B45]'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {badge}
          </span>
        )}
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[#DDF7EE] text-[#0E6B45] flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div className="text-[10px] uppercase font-bold tracking-wider text-[#5B6272] mb-1">
        {label}
      </div>
      <div className="text-3xl font-extrabold text-[#111827] tracking-tight">
        {value}
        {unit && <span className="text-lg font-bold ml-1 text-[#111827]">{unit}</span>}
      </div>
      {note && (
        <p className="text-xs text-[#5B6272] mt-2">{note}</p>
      )}
    </div>
  );
}

function EmptyState({ reason }: { reason: 'no-backend' | 'no-data' | 'error' | null }) {
  if (reason === 'no-backend') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 flex items-start gap-4 mt-4">
        <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800 mb-1">Analytics require a connected backend</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Configure{' '}
            <code className="font-mono bg-amber-100 px-1 rounded">VITE_API_BASE_URL</code>{' '}
            in your <code className="font-mono bg-amber-100 px-1 rounded">.env</code>{' '}
            to load real metrics. Analytics are calculated from verified pickup records in the backend — they cannot be estimated client-side.
          </p>
        </div>
      </div>
    );
  }

  if (reason === 'no-data') {
    return (
      <div className="bg-white border border-[#E6E8F0] rounded-2xl p-10 text-center mt-4">
        <FileCheck2 size={40} className="text-[#D1D5DB] mx-auto mb-4" />
        <p className="text-base font-bold text-[#111827] mb-2">No data for this period</p>
        <p className="text-sm text-[#5B6272]">
          Analytics will appear once pickups have been completed and verified.
        </p>
      </div>
    );
  }

  if (reason === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 mt-4">
        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-sm font-700 text-red-800">Failed to load analytics data. Please retry.</p>
      </div>
    );
  }

  return null;
}

/* ─── Supplier Analytics View ────────────────────────────────────────── */
function SupplierAnalyticsView({ metrics }: { metrics: SupplierMetrics }) {
  const hasEdible  = metrics.edibleRedistributedKg > 0;
  const hasOrganic = metrics.organicRecoveredKg > 0;

  // Build honest chart data from actual metric fields
  // Note: monthly breakdown requires a backend endpoint — the single-period
  // summary is shown here without fabricated monthly data.
  const summaryData = [
    { name: 'Edible Rescued',   kg: metrics.edibleRedistributedKg, fill: '#0E6B45' },
    { name: 'Organic Recovered', kg: metrics.organicRecoveredKg,   fill: '#B8650A' },
    { name: 'Expired Unclaimed', kg: metrics.unclaimedExpiredKg,   fill: '#D1D5DB' },
  ].filter((d) => d.kg > 0);

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Edible Food Redistributed"
          value={metrics.edibleRedistributedKg.toLocaleString('en-IN')}
          unit="kg"
          badge="Edible Flow"
          icon={<PackageCheck size={16} />}
          note={`${metrics.completedPickups} verified handover${metrics.completedPickups !== 1 ? 's' : ''}`}
        />
        <MetricCard
          label="Organic Waste Recovered"
          value={metrics.organicRecoveredKg.toLocaleString('en-IN')}
          unit="kg"
          badge="Bio-Conversion"
          badgeColor="bg-[#FBEBDD] text-[#B8650A]"
          note="To composting / biogas"
        />
        <MetricCard
          label="Active Listings"
          value={metrics.activeListings}
          badge="Live Now"
          note={`${metrics.totalListings} total created`}
          icon={<ShieldCheck size={16} />}
        />
        <MetricCard
          label="Expired / Unclaimed"
          value={metrics.unclaimedExpiredKg.toLocaleString('en-IN')}
          unit="kg"
          badge="Missed"
          badgeColor="bg-[#EEF0FA] text-[#5B6272]"
          note="Did not reach a recipient before deadline"
        />
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-[#F6F7FB] border border-[#E6E8F0] rounded-xl p-4">
        <Info size={16} className="text-[#5B6272] shrink-0 mt-0.5" />
        <p className="text-xs text-[#5B6272] leading-relaxed">
          All metrics are derived from verified handover records confirmed by both supplier and recipient.
          CO₂ equivalence estimates are not shown automatically — consult your ESG team for validated methodology.
        </p>
      </div>

      {/* Diversion chart */}
      {summaryData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs">
          <h3 className="text-base font-bold text-[#111827] mb-1">Outcome Breakdown</h3>
          <p className="text-xs text-[#5B6272] mb-6">
            Actual distribution of surplus weight across outcomes for this period.
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F3F9" />
                <XAxis
                  type="number"
                  tick={{ fill: '#5B6272', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v} kg`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#5B6272', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                  formatter={(v: any) => [`${Number(v ?? 0).toLocaleString('en-IN')} kg`, 'Weight']}
                />
                <Bar dataKey="kg" radius={[0, 6, 6, 0]}>
                  {summaryData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ESG summary card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileCheck2 size={18} className="text-[#0E6B45]" />
            <h3 className="text-base font-bold text-[#111827]">ESG Reporting Summary</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-xs font-bold">
            {metrics.completedPickups} verified events
          </span>
        </div>
        <p className="text-xs text-[#5B6272] mb-4 leading-relaxed">
          This summary is based on confirmed pickup records. For GHG Protocol Scope 3 reporting,
          coordinate with a certified ESG auditor to validate methodology and conversion factors.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-[#F6F7FB] border border-[#E6E8F0] rounded-xl">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">Total Completed</div>
            <div className="text-xl font-bold text-[#0E6B45] mt-1">{metrics.completedPickups}</div>
            <div className="text-[11px] text-[#5B6272] mt-0.5">Verified handovers</div>
          </div>
          <div className="p-3.5 bg-[#F6F7FB] border border-[#E6E8F0] rounded-xl">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">Unknown Outcome</div>
            <div className="text-xl font-bold text-[#B8650A] mt-1">{metrics.unknownOutcomeKg} kg</div>
            <div className="text-[11px] text-[#5B6272] mt-0.5">Expired without confirmed result</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Recipient Analytics View ───────────────────────────────────────── */
function RecipientAnalyticsView({ metrics }: { metrics: RecipientMetrics }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Completed Reservations"
          value={metrics.completedReservations}
          badge="Confirmed"
          icon={<CheckCircle2 size={16} />}
        />
        <MetricCard
          label="Edible Food Received"
          value={metrics.edibleFoodReceivedKg.toLocaleString('en-IN')}
          unit="kg"
          badge="Edible"
          note="Verified by handover OTP"
        />
        <MetricCard
          label="Organic Waste Recovered"
          value={metrics.organicWasteRecoveredKg.toLocaleString('en-IN')}
          unit="kg"
          badge="Organic"
          badgeColor="bg-[#FBEBDD] text-[#B8650A]"
          note="Sent to composting / biogas"
        />
      </div>

      {/* Collection history */}
      {metrics.collectionHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E6E8F0] shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E6E8F0]">
            <h3 className="text-base font-bold text-[#111827]">Collection History</h3>
          </div>
          <div className="divide-y divide-[#E6E8F0]">
            {metrics.collectionHistory.map((r, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#111827]">{r.listingTitle}</p>
                  <p className="text-xs text-[#5B6272] mt-0.5">{r.supplierName} · {new Date(r.date).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#0E6B45]">{r.weightKg} kg</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.type === 'edible' ? 'bg-[#DDF7EE] text-[#0E6B45]' : 'bg-[#FBEBDD] text-[#B8650A]'}`}>
                    {r.type === 'edible' ? 'Edible' : 'Organic'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {metrics.collectionHistory.length === 0 && (
        <div className="bg-white border border-[#E6E8F0] rounded-2xl p-8 text-center">
          <p className="text-sm text-[#5B6272]">No completed collections yet for this period.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Analytics Page ────────────────────────────────────────────── */
export function Analytics() {
  const user = getStoredUser();
  const isSupplier = user?.role === 'supplier';

  const [activePeriodKey, setActivePeriodKey] = useState('30d');
  const [supplierMetrics, setSupplierMetrics] = useState<SupplierMetrics | null>(null);
  const [recipientMetrics, setRecipientMetrics] = useState<RecipientMetrics | null>(null);
  const [loading, setLoading]   = useState(true);
  const [apiPending, setApiPending] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const loadData = useCallback(async (period: string) => {
    setLoading(true);
    setError(null);
    setApiPending(false);
    try {
      if (isSupplier) {
        const data = await getSupplierAnalytics(period);
        setSupplierMetrics(data);
      } else {
        const data = await getRecipientAnalytics(period);
        setRecipientMetrics(data);
      }
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        setApiPending(true);
      } else {
        setError('Failed to load analytics.');
      }
    } finally {
      setLoading(false);
    }
  }, [isSupplier]);

  useEffect(() => { loadData(activePeriodKey); }, [activePeriodKey, loadData]);

  const handleExport = () => {
    const data = isSupplier ? supplierMetrics : recipientMetrics;
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ReFood-Analytics-${activePeriodKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasData = isSupplier ? supplierMetrics !== null : recipientMetrics !== null;
  const emptyReason = apiPending ? 'no-backend' : error ? 'error' : (!hasData && !loading) ? 'no-data' : null;

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-16">

      {/* Top Header */}
      <div className="bg-white border-b border-[#E6E8F0]">
        <div className="max-w-[1240px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0E6B45] bg-[#DDF7EE] px-2.5 py-0.5 rounded-full border border-[#7EE8C8]/40">
                {isSupplier ? 'Supplier Impact' : 'Recipient Impact'}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
              {isSupplier ? 'Sustainability & Circular Impact' : 'Impact Analytics'}
            </h1>
            <p className="text-xs text-[#5B6272] mt-1">
              Verified metrics from completed and confirmed pickups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 bg-[#EEF0FA] rounded-xl border border-[#E6E8F0]">
              {PERIOD_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActivePeriodKey(tab.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activePeriodKey === tab.key
                      ? 'bg-white text-[#111827] shadow-xs'
                      : 'text-[#5B6272] hover:text-[#111827]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {hasData && !apiPending && (
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E6B45] hover:bg-[#0A5234] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                Export Data
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-6 pt-8">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-[#0E6B45]" />
          </div>
        )}

        {!loading && <EmptyState reason={emptyReason} />}

        {!loading && !apiPending && !error && isSupplier && supplierMetrics && (
          <SupplierAnalyticsView metrics={supplierMetrics} />
        )}

        {!loading && !apiPending && !error && !isSupplier && recipientMetrics && (
          <RecipientAnalyticsView metrics={recipientMetrics} />
        )}
      </div>
    </div>
  );
}
