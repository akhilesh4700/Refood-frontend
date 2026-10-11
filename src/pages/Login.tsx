import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Leaf, Eye, EyeOff, Utensils, HandHeart,
  ArrowLeft, CheckCircle2, Loader2,
} from 'lucide-react';
import { signIn, type UserRole } from '../api';

/* ─── Role config (colors, copy, post-login redirect) ───────────────── */
const CONFIG = {
  supplier: {
    accent:      '#0E6B45',
    accentLight: '#DDF7EE',
    accentHover: '#0a5234',
    icon:        <Utensils size={22} className="text-[#0E6B45]" />,
    iconBg:      'bg-[#DDF7EE]',
    badge:       'Donors & Supply',
    label:       'Food Supplier',
    subLabel:    'Hotels, bakeries, caterers, supermarkets',
    ctaLabel:    'Sign in as Supplier',
    postLogin:   '/supplier/dashboard',
    signupPath:  '/supplier/login',
    otherRole:   'buyer' as UserRole,
    otherLabel:  'Recipient / Processor',
    otherPath:   '/recipient/login',
    features: [
      'List surplus food batches in under 2 minutes',
      'Auto-generated FSSAI-compliant audit logs',
      'Real-time pickup tracking & OTP handover',
    ],
  },
  buyer: {
    accent:      '#B8650A',
    accentLight: '#FBEBDD',
    accentHover: '#9a550a',
    icon:        <HandHeart size={22} className="text-[#B8650A]" />,
    iconBg:      'bg-[#FBEBDD]',
    badge:       'Recipients & Processors',
    label:       'Recipient / Processor',
    subLabel:    'NGOs, shelters, food banks, composters',
    ctaLabel:    'Sign in as Recipient',
    postLogin:   '/recipient/dashboard',
    signupPath:  '/recipient/login',
    otherRole:   'supplier' as UserRole,
    otherLabel:  'Food Supplier',
    otherPath:   '/supplier/login',
    features: [
      'Browse & claim available surplus in real time',
      'Smart filtering: Edible vs Organic Compost stream',
      'Safe-code pickup dispatch — no middlemen',
    ],
  },
};

type AuthMode = 'login' | 'signup';

interface LoginProps {
  /** Passed statically by the router — no runtime query param needed. */
  role: UserRole;
}

export function Login({ role }: LoginProps) {
  const cfg = CONFIG[role];
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!password)     { setError('Password is required.'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (mode === 'signup' && !orgName.trim()) { setError('Organisation name is required.'); return; }
    if (mode === 'signup' && !agreed) { setError('Please accept the terms to continue.'); return; }

    setLoading(true);
    try {
      await signIn(role, email.trim(), password);
      setSuccess(true);
      await new Promise((r) => setTimeout(r, 650));
      navigate(cfg.postLogin);
    } catch {
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5FA] flex flex-col">

      {/* Top bar */}
      <header className="border-b border-[#E6E8F0] bg-white px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center shadow-sm"
            style={{ background: cfg.accent }}
          >
            <Leaf size={14} className="text-white" />
          </div>
          <span className="font-800 text-[#111827] text-lg tracking-tight">ReFood</span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-600 text-[#5B6272] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[900px] grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── Left: context panel ──────────────────────────── */}
          <div className="hidden lg:flex flex-col gap-6">
            {/* Role identity */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${cfg.iconBg} rounded-[16px] flex items-center justify-center`}>
                {cfg.icon}
              </div>
              <div>
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-[11px] font-700"
                  style={{ background: cfg.accentLight, color: cfg.accent }}
                >
                  {cfg.badge}
                </span>
                <p className="text-2xl font-800 text-[#111827] mt-1 leading-tight">{cfg.label}</p>
                <p className="text-sm text-[#5B6272]">{cfg.subLabel}</p>
              </div>
            </div>

            {/* Feature list */}
            <div className="bg-white rounded-[18px] border border-[#E6E8F0] p-6
                           shadow-[0_1px_3px_rgba(16,24,40,0.05),0_4px_16px_rgba(16,24,40,0.04)]">
              <p className="text-[10px] font-800 uppercase tracking-widest text-[#9CA3AF] mb-4">
                What you get
              </p>
              <ul className="space-y-4">
                {cfg.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: cfg.accent }} />
                    <span className="text-sm text-[#374151] leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Switch role CTA */}
            <div className="bg-white rounded-[14px] border border-[#E6E8F0] p-4 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0
                           ${role === 'supplier' ? 'bg-[#FBEBDD]' : 'bg-[#DDF7EE]'}`}
              >
                {role === 'supplier'
                  ? <HandHeart size={16} className="text-[#B8650A]" />
                  : <Utensils  size={16} className="text-[#0E6B45]" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-700 text-[#374151]">
                  Are you a {cfg.otherLabel}?
                </p>
                <Link
                  to={cfg.otherPath}
                  className="text-xs font-700 hover:underline"
                  style={{ color: cfg.accent }}
                >
                  Go to {cfg.otherLabel} login →
                </Link>
              </div>
            </div>
          </div>

          {/* ── Right: Auth form ─────────────────────────────── */}
          <div className="bg-white rounded-[24px] border border-[#E6E8F0] p-8
                         shadow-[0_4px_24px_rgba(16,24,40,0.08),0_1px_4px_rgba(16,24,40,0.04)]">

            {/* Mobile role header */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 ${cfg.iconBg} rounded-[12px] flex items-center justify-center`}>
                {cfg.icon}
              </div>
              <div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-700"
                  style={{ background: cfg.accentLight, color: cfg.accent }}
                >
                  {cfg.badge}
                </span>
                <p className="text-base font-800 text-[#111827] mt-0.5">{cfg.label}</p>
              </div>
            </div>

            {success ? (
              /* ── Success state ───── */
              <div className="flex flex-col items-center gap-4 py-10">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: cfg.accentLight }}
                >
                  <CheckCircle2 size={32} style={{ color: cfg.accent }} />
                </div>
                <p className="text-lg font-800 text-[#111827]">Welcome to ReFood!</p>
                <p className="text-sm text-[#5B6272] text-center">
                  Signing you in as <strong>{cfg.label}</strong>…
                </p>
                <Loader2 size={20} className="animate-spin text-[#9CA3AF] mt-1" />
              </div>
            ) : (
              <>
                {/* Mode tabs */}
                <div className="flex bg-[#F5F5FA] rounded-[12px] p-1 mb-7">
                  {(['login', 'signup'] as AuthMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setError(''); }}
                      className={`flex-1 py-2 text-sm font-700 rounded-[10px] transition-all duration-200 ${
                        mode === m
                          ? 'bg-white text-[#111827] shadow-sm'
                          : 'text-[#9CA3AF] hover:text-[#5B6272]'
                      }`}
                    >
                      {m === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <h2 className="text-xl font-800 text-[#111827]">
                      {mode === 'login' ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p className="text-sm text-[#5B6272] mt-1">
                      {mode === 'login'
                        ? `Sign in to your ${cfg.label} account`
                        : `Join ReFood as a verified ${cfg.label}`}
                    </p>
                  </div>

                  {/* Organisation name — signup only */}
                  {mode === 'signup' && (
                    <div>
                      <label className="text-xs font-700 text-[#374151] block mb-1.5">
                        Organisation Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. Hotel Grand Royale"
                        autoComplete="organization"
                        className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#F5F5FA] border border-[#E6E8F0]
                                   text-sm text-[#111827] placeholder:text-[#C4C9D4]
                                   focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/10 transition-all"
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="text-xs font-700 text-[#374151] block mb-1.5">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@organisation.com"
                      autoComplete="email"
                      required
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#F5F5FA] border border-[#E6E8F0]
                                 text-sm text-[#111827] placeholder:text-[#C4C9D4]
                                 focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/10 transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-700 text-[#374151]">
                        Password <span className="text-red-500">*</span>
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          className="text-[11px] font-700 hover:underline"
                          style={{ color: cfg.accent }}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        required
                        className="w-full px-3.5 py-2.5 pr-10 rounded-[12px] bg-[#F5F5FA] border border-[#E6E8F0]
                                   text-sm text-[#111827] placeholder:text-[#C4C9D4]
                                   focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/10 transition-all"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#5B6272] transition-colors"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* T&C — signup only */}
                  {mode === 'signup' && (
                    <div className="flex items-start gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id="agree-terms"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded"
                        style={{ accentColor: cfg.accent }}
                      />
                      <label htmlFor="agree-terms" className="text-xs text-[#5B6272] leading-relaxed">
                        I agree to ReFood's{' '}
                        <span className="font-700 cursor-pointer hover:underline" style={{ color: cfg.accent }}>
                          Terms of Service
                        </span>{' '}
                        and{' '}
                        <span className="font-700 cursor-pointer hover:underline" style={{ color: cfg.accent }}>
                          Privacy Policy
                        </span>
                        . Your organisation will be verified within 24 hours.
                      </label>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <p className="text-xs font-600 text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-[10px]">
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-[12px] text-sm font-700 text-white flex items-center justify-center gap-2
                               transition-all duration-200 active:scale-[0.98] disabled:opacity-60 mt-2
                               shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                    style={{ background: loading ? `${cfg.accent}99` : cfg.accent }}
                  >
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                      : cfg.ctaLabel}
                  </button>

                  {/* Switch to other role (mobile-visible; desktop has left panel) */}
                  <div className="lg:hidden pt-2 border-t border-[#E6E8F0]">
                    <Link
                      to={cfg.otherPath}
                      className="flex items-center justify-center gap-1.5 text-xs font-700 hover:underline"
                      style={{ color: cfg.accent }}
                    >
                      {role === 'supplier'
                        ? <HandHeart size={13} />
                        : <Utensils  size={13} />}
                      Sign in as {cfg.otherLabel} instead
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
