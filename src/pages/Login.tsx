import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Leaf, Eye, EyeOff, Utensils, HandHeart,
  ArrowLeft, CheckCircle2, Loader2, AlertCircle,
  Building2, Phone, MapPin, User,
} from 'lucide-react';
import { signIn, signUp, ApiUnavailableError } from '../api';
import type { UserRole } from '../types/domain';

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
    ctaSignIn:   'Sign in as Supplier',
    ctaSignUp:   'Create Supplier Account',
    postLogin:   '/supplier/dashboard',
    otherRole:   'recipient' as UserRole,
    otherLabel:  'Recipient / Processor',
    otherPath:   '/recipient/login',
    features: [
      'List surplus food batches in under 2 minutes',
      'Auto-generated FSSAI-compliant audit logs',
      'Real-time pickup tracking & OTP handover',
    ],
    orgTypes: ['Hotel / Resort', 'Restaurant / Café', 'Bakery', 'Catering Company', 'Supermarket / Grocery', 'Corporate Cafeteria', 'Food Manufacturer', 'Other'],
  },
  recipient: {
    accent:      '#B8650A',
    accentLight: '#FBEBDD',
    accentHover: '#9a550a',
    icon:        <HandHeart size={22} className="text-[#B8650A]" />,
    iconBg:      'bg-[#FBEBDD]',
    badge:       'Recipients & Processors',
    label:       'Recipient / Processor',
    subLabel:    'NGOs, shelters, food banks, composters',
    ctaSignIn:   'Sign in as Recipient',
    ctaSignUp:   'Create Recipient Account',
    postLogin:   '/recipient/dashboard',
    otherRole:   'supplier' as UserRole,
    otherLabel:  'Food Supplier',
    otherPath:   '/supplier/login',
    features: [
      'Browse & claim available surplus in real time',
      'Smart filtering: Edible vs Organic Compost stream',
      'Safe-code pickup dispatch — no middlemen',
    ],
    orgTypes: ['NGO / Charity', 'Shelter / Food Bank', 'Soup Kitchen', 'Community Centre', 'Composting Facility', 'Biogas Plant', 'Animal Feed Producer', 'Other'],
  },
};

type AuthMode = 'login' | 'signup';

interface LoginProps {
  role: UserRole;
}

export function Login({ role }: LoginProps) {
  const cfg = CONFIG[role];
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isApiPending, setIsApiPending] = useState(false);

  // Sign-up only fields
  const [orgName, setOrgName]       = useState('');
  const [orgType, setOrgType]       = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone]           = useState('');
  const [address, setAddress]       = useState('');
  const [city, setCity]             = useState('');
  const [agreed, setAgreed]         = useState(false);

  const validate = (): string | null => {
    if (!email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';

    if (mode === 'signup') {
      if (!orgName.trim()) return 'Organisation name is required.';
      if (!orgType) return 'Please select your organisation type.';
      if (!contactName.trim()) return 'Contact person name is required.';
      if (!phone.trim()) return 'Contact phone number is required.';
      if (!address.trim()) return 'Address is required.';
      if (!city.trim()) return 'City is required.';
      if (!agreed) return 'Please accept the Terms of Service and Privacy Policy to continue.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn({ email: email.trim(), password, role });
      } else {
        await signUp({
          role,
          orgName: orgName.trim(),
          orgType,
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          password,
          acceptedTerms: agreed,
        });
      }
      setSuccess(true);
      await new Promise((r) => setTimeout(r, 600));
      navigate(cfg.postLogin);
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        setIsApiPending(true);
        setError('');
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Authentication failed. Please check your details and try again.'
        );
      }
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

            {/* API pending notice */}
            {isApiPending && (
              <div className="mb-6 p-4 rounded-[14px] border border-amber-200 bg-amber-50 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-700 text-amber-800">Backend not yet connected</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Authentication requires a backend API. Set{' '}
                    <code className="font-mono bg-amber-100 px-1 rounded">VITE_API_BASE_URL</code>{' '}
                    in <code className="font-mono bg-amber-100 px-1 rounded">.env</code> to connect to your backend.
                  </p>
                </div>
              </div>
            )}

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
                      onClick={() => { setMode(m); setError(''); setIsApiPending(false); }}
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

                  {/* ── Sign-up extra fields ── */}
                  {mode === 'signup' && (
                    <>
                      <div>
                        <label className="text-xs font-700 text-[#374151] block mb-1.5">
                          Organisation Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                          <input
                            type="text"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="e.g. Hotel Grand Royale"
                            autoComplete="organization"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-[12px] bg-[#F5F5FA] border border-[#E6E8F0]
                                       text-sm text-[#111827] placeholder:text-[#C4C9D4]
                                       focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/10 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-700 text-[#374151] block mb-1.5">
                          Organisation Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={orgType}
                          onChange={(e) => setOrgType(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#F5F5FA] border border-[#E6E8F0]
                                     text-sm text-[#111827] focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/10 transition-all"
                        >
                          <option value="">Select type…</option>
                          {cfg.orgTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-700 text-[#374151] block mb-1.5">
                            Contact Person <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                            <input
                              type="text"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder="Full name"
                              className="w-full pl-9 pr-3 py-2.5 rounded-[12px] bg-[#F5F5FA] border border-[#E6E8F0]
                                         text-sm text-[#111827] placeholder:text-[#C4C9D4]
                                         focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/10 transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-700 text-[#374151] block mb-1.5">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+91 98765…"
                              className="w-full pl-9 pr-3 py-2.5 rounded-[12px] bg-[#F5F5FA] border border-[#E6E8F0]
                                         text-sm text-[#111827] placeholder:text-[#C4C9D4]
                                         focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/10 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-700 text-[#374151] block mb-1.5">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin size={14} className="absolute left-3 top-3 text-[#9CA3AF]" />
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Street address"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-[12px] bg-[#F5F5FA] border border-[#E6E8F0]
                                       text-sm text-[#111827] placeholder:text-[#C4C9D4]
                                       focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/10 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-700 text-[#374151] block mb-1.5">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Bengaluru"
                          className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#F5F5FA] border border-[#E6E8F0]
                                     text-sm text-[#111827] placeholder:text-[#C4C9D4]
                                     focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/10 transition-all"
                        />
                      </div>
                    </>
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
                          className="text-[11px] font-700 text-[#5B6272] hover:text-[#111827] transition-colors"
                          onClick={() => {
                            // Integration pending: password reset requires backend
                            alert('Password reset requires backend integration.');
                          }}
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
                    {mode === 'signup' && (
                      <p className="text-[11px] text-[#9CA3AF] mt-1">
                        Minimum 8 characters.
                      </p>
                    )}
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
                        . Your organisation details will be reviewed. Verified status is issued by ReFood after review.
                      </label>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2.5 text-xs font-600 text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-[10px]">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      {error}
                    </div>
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
                      : (mode === 'login' ? cfg.ctaSignIn : cfg.ctaSignUp)}
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
