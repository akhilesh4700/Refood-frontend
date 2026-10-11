// Utility formatters — Bengaluru locale
export function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg} kg`;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function timeLeft(target: Date): { label: string; pct: number; urgent: boolean } {
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return { label: 'Expired', pct: 100, urgent: true };
  const totalHours = 4; // SLA window
  const elapsedMs = totalHours * 3600_000 - diffMs;
  const pct = Math.min(100, Math.round((elapsedMs / (totalHours * 3600_000)) * 100));
  const urgent = diffMs < 2 * 3600_000;
  const h = Math.floor(diffMs / 3600_000);
  const m = Math.floor((diffMs % 3600_000) / 60_000);
  const s = Math.floor((diffMs % 60_000) / 1_000);
  if (h > 0) return { label: `${h}h ${m}m`, pct, urgent };
  if (m > 0) return { label: `${m}m ${s}s`, pct, urgent };
  return { label: `${s}s`, pct, urgent };
}

export function formatCountdown(target: Date): string {
  const now = new Date();
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const h = Math.floor(diffMs / 3600_000).toString().padStart(2, '0');
  const m = Math.floor((diffMs % 3600_000) / 60_000).toString().padStart(2, '0');
  const s = Math.floor((diffMs % 60_000) / 1_000).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function co2Avoided(kg: number): string {
  return (kg * 2.5).toFixed(1);
}

export function waterSaved(kg: number): string {
  return (kg * 262).toFixed(0);
}
