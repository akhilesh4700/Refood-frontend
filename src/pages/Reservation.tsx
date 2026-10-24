import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  AlertTriangle,
  Send,
  Truck,
  Shield,
  Layers,
  Sparkles,
  ClipboardList,
  User,
  Loader2,
  Inbox,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Ban,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useRolePaths } from '../lib/useRolePaths';
import {
  getStoredUser,
  getMyReservations,
  getSupplierPickups,
  getReservation,
  updateReservationStatus,
  initiateHandoverOtp,
  getReservationOtp,
  verifyHandoverOtp,
  getChatMessages,
  sendChatMessage,
  isApiConfigured,
} from '../api';
import type { Reservation, ReservationStatus, ChatMessage } from '../types/domain';
import { formatKg, formatCountdown } from '../lib/formatters';

const CHAT_WINDOW_MS = 2 * 60 * 60 * 1000;

export function Reservation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const paths = useRolePaths();
  const storedUser = getStoredUser();
  const isSupplier = storedUser?.role === 'supplier';

  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // Chat State
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [inputMsg, setInputMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sendChatError, setSendChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Chat lifecycle rules:
  // - In-progress: chat is open
  // - Cancelled: closed immediately (read-only)
  // - Completed: open for exactly 2 hours after handoverVerifiedAt, then closed (read-only)
  const isReservationCancelled = activeReservation?.reservationStatus === 'cancelled';
  const isReservationCompleted = activeReservation?.reservationStatus === 'completed';

  const verifiedTimestamp = activeReservation?.handoverVerifiedAt
    ? new Date(activeReservation.handoverVerifiedAt).getTime()
    : null;

  const isChatExpired = Boolean(
    isReservationCompleted &&
    (!verifiedTimestamp || now >= verifiedTimestamp + CHAT_WINDOW_MS)
  );

  const isChatClosed = isReservationCancelled || isChatExpired;

  // Real-time synchronization: schedule state update precisely at 2-hour cutoff
  useEffect(() => {
    if (activeReservation?.reservationStatus !== 'completed' || !activeReservation?.handoverVerifiedAt) {
      return;
    }
    const verifiedTime = new Date(activeReservation.handoverVerifiedAt).getTime();
    const remainingMs = verifiedTime + CHAT_WINDOW_MS - Date.now();
    if (remainingMs <= 0) {
      setNow(Date.now());
      return;
    }
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, remainingMs);
    return () => clearTimeout(timer);
  }, [activeReservation?.reservationStatus, activeReservation?.handoverVerifiedAt]);

  // OTP Handover State (Recipient inputs code supplied by supplier)
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [initiatingOtp, setInitiatingOtp] = useState(false);

  // Supplier OTP Display State (Supplier generates and views the code)
  const [supplierOtp, setSupplierOtp] = useState<{ otp: string; expiresAt: string } | null>(null);
  const [fetchingSupplierOtp, setFetchingSupplierOtp] = useState(false);
  const [supplierOtpError, setSupplierOtpError] = useState<string | null>(null);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadReservations = useCallback(async (targetId?: string) => {
    setLoading(true);
    try {
      if (id) {
        const item = await getReservation(id);
        setActiveReservation(item);
      } else {
        const list = isSupplier ? await getSupplierPickups() : await getMyReservations();
        const items = Array.isArray(list) ? list : (list as any)?.data ?? [];
        setAllReservations(items);
        if (items.length > 0) {
          const selected = targetId
            ? items.find((r: Reservation) => r.id === targetId) || items[0]
            : items[0];
          setActiveReservation(selected);
        } else {
          setActiveReservation(null);
        }
      }
    } catch {
      setActiveReservation(null);
    } finally {
      setLoading(false);
    }
  }, [id, isSupplier]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Load and poll chat messages for active reservation
  const fetchChat = useCallback(async (isInitial = false) => {
    if (!activeReservation?.id) return;
    if (isInitial) setLoadingChat(true);
    try {
      const msgs = await getChatMessages(activeReservation.id);
      setChat(msgs || []);
      setChatError(null);
    } catch (err: unknown) {
      if (isInitial) {
        const msg = err instanceof Error ? err.message : 'Unable to load chat messages.';
        setChatError(msg);
      }
    } finally {
      if (isInitial) setLoadingChat(false);
    }
  }, [activeReservation?.id]);

  useEffect(() => {
    if (!activeReservation?.id) {
      setChat([]);
      setChatError(null);
      return;
    }
    fetchChat(true);

    // Stop six-second polling when the chat is closed (expired or cancelled)
    if (isChatClosed) {
      return;
    }

    const interval = setInterval(() => {
      fetchChat(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeReservation?.id, fetchChat, isChatClosed]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMsg.trim();
    if (!text || !activeReservation || sendingMsg || isChatClosed) return;

    setSendingMsg(true);
    setSendChatError(null);

    try {
      const sent = await sendChatMessage(activeReservation.id, text);
      setChat((prev) => [...prev, sent]);
      setInputMsg('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setSendChatError(msg);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleUpdateStatus = async (newStatus: ReservationStatus) => {
    if (!activeReservation) return;
    setUpdatingStatus(true);
    setActionError(null);
    try {
      const updated = await updateReservationStatus(activeReservation.id, newStatus);
      if (updated && updated.id) {
        setActiveReservation(updated);
      }
      await loadReservations(activeReservation.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update reservation status.';
      setActionError(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusChange = handleUpdateStatus;

  // Supplier recovers active generated OTP on reload
  const loadSupplierOtp = useCallback(async () => {
    if (!activeReservation || !isSupplier) return;
    const isReady = activeReservation.otpReady || activeReservation.reservationStatus === 'handover_pending';
    if (!isReady) {
      setSupplierOtp(null);
      return;
    }
    setFetchingSupplierOtp(true);
    setSupplierOtpError(null);
    try {
      const data = await getReservationOtp(activeReservation.id);
      setSupplierOtp(data);
    } catch {
      // If server does not have an active unexpired OTP in memory, supplier can re-issue
      setSupplierOtp(null);
    } finally {
      setFetchingSupplierOtp(false);
    }
  }, [activeReservation, isSupplier]);

  useEffect(() => {
    if (activeReservation && isSupplier && (activeReservation.otpReady || activeReservation.reservationStatus === 'handover_pending')) {
      loadSupplierOtp();
    } else if (!isSupplier) {
      setSupplierOtp(null);
      setSupplierOtpError(null);
    }
  }, [activeReservation?.id, activeReservation?.otpReady, activeReservation?.reservationStatus, isSupplier, loadSupplierOtp]);

  // Supplier initiates handover OTP by clicking "Complete Transaction"
  const handleInitiateOtp = async () => {
    if (!activeReservation || initiatingOtp) return;
    setInitiatingOtp(true);
    setActionError(null);
    setSupplierOtpError(null);
    try {
      const res = await initiateHandoverOtp(activeReservation.id);
      if (res?.otp) {
        setSupplierOtp({ otp: res.otp, expiresAt: res.expiresAt });
      }
      setActiveReservation((prev) => (prev ? { ...prev, otpReady: true, reservationStatus: 'handover_pending' } : null));
      await loadReservations(activeReservation.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate handover OTP.';
      setActionError(msg);
      setSupplierOtpError(msg);
    } finally {
      setInitiatingOtp(false);
    }
  };

  // Recipient submits the 6-digit code supplied by the supplier
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpInput.trim();
    if (!activeReservation || cleanOtp.length !== 6 || verifyingOtp) return;

    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const result = await verifyHandoverOtp(activeReservation.id, cleanOtp);
      if (result?.success) {
        setOtpSuccess(true);
        setActiveReservation((prev) => (prev ? {
          ...prev,
          reservationStatus: 'completed',
          otpReady: false,
          handoverVerifiedAt: result.verifiedAt || new Date().toISOString(),
        } : null));
        setOtpInput('');
        await loadReservations(activeReservation.id);
      } else {
        setOtpError('Invalid OTP code. Please check with the supplier.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Please check the code.';
      setOtpError(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto px-6 py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={32} className="animate-spin text-[#0E6B45] mb-3" />
        <p className="text-xs font-medium">Loading pickup order and tracking telemetry...</p>
      </div>
    );
  }

  if (!activeReservation) {
    return (
      <div className="max-w-[1240px] mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <Inbox size={28} />
        </div>
        <h2 className="text-xl font-bold text-[#111827]">
          {isSupplier ? 'No Scheduled Pickups' : 'No Active Reservations'}
        </h2>
        <p className="text-xs text-[#5B6272] mt-2 max-w-sm mx-auto leading-relaxed">
          {isSupplier
            ? 'When recipients claim your surplus listings, collection coordination and OTP handover will appear here.'
            : 'You have not reserved any surplus batches. Browse the marketplace to find and claim available food.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to={isSupplier ? '/supplier/listings' : '/recipient/browse'}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            {isSupplier ? 'Manage My Inventory' : 'Browse Available Surplus'}
          </Link>
          <button
            onClick={() => loadReservations()}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>
    );
  }

  const status = activeReservation.reservationStatus;
  const isCompleted = status === 'completed';

  const stepIndex =
    status === 'pending' || status === 'confirmed'
      ? 1
      : status === 'preparing' || status === 'ready'
      ? 2
      : status === 'in_transit' || status === 'arrived' || status === 'handover_pending'
      ? 3
      : 4;

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-16">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-[#E6E8F0]">
        <div className="max-w-[1240px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#5B6272] font-medium">
            <Link to={isSupplier ? '/supplier/dashboard' : '/recipient/dashboard'} className="hover:text-[#111827]">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-[#111827]">
              {isSupplier ? 'Supplier Pickup Queue' : 'My Claim'} #{activeReservation.id.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#5B6272] font-bold uppercase tracking-wider text-[10px]">CURRENT STATE</span>
            <span className="font-mono font-bold text-[#111827] bg-[#EEF0FA] px-2.5 py-1 rounded-md border border-[#E6E8F0] uppercase">
              {status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-6 pt-6 space-y-6">
        {/* Reservation Selector (if multiple records exist) */}
        {allReservations.length > 1 && (
          <div className="bg-white rounded-2xl border border-[#E6E8F0] p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6272]">
                {isSupplier ? 'Pickup Queue & Claim Requests' : 'My Reservations'} ({allReservations.length})
              </span>
              <span className="text-[11px] text-[#5B6272]">Select an order to inspect</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {allReservations.map((r) => {
                const isSelected = r.id === activeReservation.id;
                const isPending = r.reservationStatus === 'pending';
                const isCancelled = r.reservationStatus === 'cancelled';
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setActiveReservation(r);
                      setActionError(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all text-left flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#111827] text-white border-[#111827] shadow-xs'
                        : 'bg-[#F8F9FC] text-[#111827] border-[#E6E8F0] hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate max-w-[150px]">
                      {r.listing?.title || `Order #${r.id.slice(0, 6)}`}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isPending
                          ? isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
                          : isCancelled
                          ? isSelected ? 'bg-red-400 text-white' : 'bg-red-100 text-red-700'
                          : isSelected ? 'bg-[#0E6B45] text-white' : 'bg-[#DDF7EE] text-[#0E6B45]'
                      }`}
                    >
                      {r.reservationStatus.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
              {isSupplier ? 'Pickup Dispatch' : 'Reservation Order'} #{activeReservation.id.slice(0, 8)}
            </h1>
            <p className="text-xs text-[#5B6272] mt-1">
              Listing: <strong className="text-slate-800">{activeReservation.listing?.title || 'Surplus Batch'}</strong> · Recipient: {activeReservation.recipientName}
            </p>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            status === 'pending'
              ? 'bg-[#FBEBDD] text-[#B8650A] border-[#B8650A]/30'
              : status === 'cancelled'
              ? 'bg-[#FDE7E7] text-[#C62828] border-[#C62828]/30'
              : 'bg-[#DDF7EE] text-[#0E6B45] border-[#7EE8C8]/40'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              status === 'pending' ? 'bg-[#B8650A]' : status === 'cancelled' ? 'bg-[#C62828]' : 'bg-[#0E6B45]'
            }`} />
            {status === 'pending' ? 'AWAITING APPROVAL' : status === 'cancelled' ? 'RESERVATION CANCELLED' : `Step ${stepIndex} of 4: ${status.replace('_', ' ').toUpperCase()}`}
          </span>
        </div>

        {/* 4-Step Stepper Header */}
        <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                status === 'cancelled' ? 'bg-red-100 text-red-600' : stepIndex >= 1 ? 'bg-[#0E6B45] text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {status === 'cancelled' ? <Ban size={16} /> : <Check size={16} strokeWidth={2.5} />}
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#111827]">1. Batch Claimed</div>
                <div className={`text-[11px] font-semibold mt-0.5 ${
                  status === 'pending'
                    ? 'text-amber-600'
                    : status === 'cancelled'
                    ? 'text-red-600'
                    : 'text-[#0E6B45]'
                }`}>
                  {status === 'pending'
                    ? 'Pending Approval'
                    : status === 'cancelled'
                    ? 'Cancelled'
                    : 'Confirmed'}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${stepIndex >= 2 ? 'bg-[#0E6B45] text-white' : 'bg-slate-100 text-slate-400'}`}>
                <ClipboardList size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#111827]">2. Prep & Packaging</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">Cold storage verify</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${stepIndex >= 3 ? 'bg-[#0E6B45] text-white ring-4 ring-[#7EE8C8]/40' : 'bg-slate-100 text-slate-400'}`}>
                <Truck size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#111827]">3. Handover & OTP</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">On-site verification</div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${stepIndex === 4 ? 'bg-[#0E6B45] text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Sparkles size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#111827]">4. Completed</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">Audit log recorded</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Handover & OTP Panel */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] overflow-hidden shadow-xs border-t-4 border-t-[#0E6B45]">
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E6E8F0]">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">
                      DISPATCH & HANDOVER PROTOCOL
                    </div>
                    <h3 className="text-lg font-bold text-[#111827] mt-0.5">
                      {isCompleted ? 'Handover Confirmed & Audited' : status === 'pending' ? 'Claim Approval Review' : status === 'cancelled' ? 'Reservation Cancelled' : 'Verified Gate Transfer'}
                    </h3>
                  </div>
                  <Badge variant={isCompleted ? 'edible' : status === 'pending' ? 'organic' : 'neutral'}>
                    {isCompleted ? 'COMPLETED' : status === 'pending' ? 'PENDING APPROVAL' : status === 'cancelled' ? 'CANCELLED' : 'IN PROGRESS'}
                  </Badge>
                </div>

                <div className="pt-4 space-y-4">
                  {isCompleted ? (
                    <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
                      <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                      <h4 className="text-base font-bold text-emerald-900">Handover Complete</h4>
                      <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                        Food recovery handover verified. Chain of custody timestamped and ESG impact metrics registered.
                      </p>
                    </div>
                  ) : status === 'cancelled' ? (
                    <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-center space-y-2">
                      <AlertTriangle size={36} className="text-red-600 mx-auto" />
                      <h4 className="text-base font-bold text-red-900">Reservation Cancelled / Rejected</h4>
                      <p className="text-xs text-red-700 max-w-sm mx-auto leading-relaxed">
                        This claim was cancelled or rejected. The surplus batch has been restored to active status or withdrawn.
                      </p>
                    </div>
                  ) : status === 'pending' ? (
                    isSupplier ? (
                      /* Supplier Review & Decision for Pending Claim */
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                            <Clock size={16} className="text-amber-600 shrink-0" />
                            <span>Incoming Surplus Claim Request</span>
                          </div>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            Recipient <strong>{activeReservation.recipientName}</strong> has requested to claim this batch ({activeReservation.listing?.weightKg ? formatKg(activeReservation.listing.weightKg) : ''}).
                            Please review the request and either accept to confirm the pickup or reject to release the listing back to the marketplace.
                          </p>
                        </div>

                        {actionError && (
                          <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
                            <ShieldAlert size={15} className="shrink-0" />
                            <span>{actionError}</span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <Button
                            variant="primary"
                            onClick={() => handleUpdateStatus('confirmed')}
                            disabled={updatingStatus}
                            className="flex-1 text-xs font-bold py-3 flex items-center justify-center gap-2 bg-[#0E6B45] hover:bg-[#0A5234]"
                          >
                            {updatingStatus ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> Processing Decision...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={16} /> Accept & Confirm Claim
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleUpdateStatus('cancelled')}
                            disabled={updatingStatus}
                            className="flex-1 text-xs font-bold py-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center justify-center gap-2"
                          >
                            {updatingStatus ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> Processing Decision...
                              </>
                            ) : (
                              <>
                                <Ban size={16} /> Reject Claim
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Recipient View when Awaiting Approval */
                      <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-2">
                        <Clock size={36} className="text-amber-600 mx-auto" />
                        <h4 className="text-base font-bold text-amber-900">Awaiting Supplier Approval</h4>
                        <p className="text-xs text-amber-800 max-w-sm mx-auto leading-relaxed">
                          Your claim request has been placed with <strong>{activeReservation.listing?.supplierName || 'the supplier'}</strong>.
                          Pickup scheduling, packaging coordination, and handover OTP will be activated once the supplier accepts your claim.
                        </p>
                      </div>
                    )
                  ) : isSupplier ? (
                    /* Supplier side: initiate handover OTP and view generated code */
                    <div className="space-y-4">
                      {actionError && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
                          <ShieldAlert size={15} className="shrink-0" />
                          <span>{actionError}</span>
                        </div>
                      )}

                      {!supplierOtp && !activeReservation.otpReady && status !== 'handover_pending' ? (
                        /* Stage 1: Supplier initiates handover by clicking Complete Transaction */
                        <div className="space-y-3">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            When the recipient arrives at your pickup location, click below to initiate handover and generate the single-use verification code.
                          </p>
                          <Button
                            variant="primary"
                            onClick={handleInitiateOtp}
                            disabled={initiatingOtp}
                            className="w-full text-xs font-bold py-3 flex items-center justify-center gap-2 bg-[#0E6B45] hover:bg-[#0A5234]"
                          >
                            {initiatingOtp ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> Generating Code...
                              </>
                            ) : (
                              <>
                                <KeyRound size={16} /> Complete Transaction
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        /* Stage 2: Supplier views the generated OTP and its expiry time to share with the recipient */
                        <div className="space-y-4">
                          {fetchingSupplierOtp ? (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                              <Loader2 size={24} className="animate-spin text-[#0E6B45] mx-auto" />
                              <p className="text-xs font-medium text-slate-600">Retrieving handover code...</p>
                            </div>
                          ) : supplierOtp ? (
                            <div className="p-6 bg-[#DDF7EE] rounded-2xl border border-[#7EE8C8]/60 text-center space-y-3">
                              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#0E6B45] uppercase tracking-wider">
                                <KeyRound size={16} /> Pickup Handover Code
                              </div>
                              <div className="font-mono text-3xl font-extrabold tracking-widest text-[#0E6B45] py-2.5 px-6 bg-white rounded-xl border border-[#7EE8C8]/40 shadow-xs max-w-[240px] mx-auto select-all">
                                {supplierOtp.otp}
                              </div>
                              <p className="text-xs text-[#0E6B45]/90 max-w-sm mx-auto leading-relaxed">
                                Share this single-use 6-digit code with the recipient at pickup. Once they enter and verify it on their screen, the transaction will be marked completed.
                              </p>
                              <div className="text-[11px] text-[#5B6272] flex items-center justify-center gap-1 pt-1">
                                <Clock size={12} />
                                <span>
                                  Valid until {new Date(supplierOtp.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="pt-2 flex justify-between items-center text-xs text-slate-500 border-t border-[#7EE8C8]/40">
                                <span>Expired or lost code?</span>
                                <button
                                  type="button"
                                  onClick={handleInitiateOtp}
                                  disabled={initiatingOtp}
                                  className="text-xs font-bold text-[#0E6B45] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  <RefreshCw size={12} className={initiatingOtp ? 'animate-spin' : ''} />
                                  Re-issue New OTP
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-3">
                              <Clock size={28} className="text-amber-600 mx-auto" />
                              <h4 className="text-xs font-bold text-amber-900">Handover Protocol Initiated</h4>
                              <p className="text-xs text-amber-800 max-w-sm mx-auto leading-relaxed">
                                Handover is awaiting recipient verification. Click below to generate or re-issue a fresh 6-digit code.
                              </p>
                              <Button
                                variant="primary"
                                onClick={handleInitiateOtp}
                                disabled={initiatingOtp}
                                className="text-xs font-bold py-2 px-5 bg-[#0E6B45] hover:bg-[#0A5234] mx-auto inline-flex items-center gap-1.5"
                              >
                                <KeyRound size={14} /> Re-issue Handover OTP
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Recipient side: Enter code provided by the supplier and verify */
                    <div className="space-y-4">
                      {activeReservation.otpReady || status === 'handover_pending' ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                              <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
                              <span>Handover Initiated — Enter Supplier Code</span>
                            </div>
                            <p className="text-xs text-amber-800 leading-relaxed">
                              Ask the supplier dispatch team for the 6-digit handover code displayed on their screen, enter it below, and verify to finalize collection.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                              Enter 6-Digit Handover Code
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••••"
                                className="flex-1 px-4 py-2.5 text-center font-mono font-bold text-xl rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0E6B45]"
                                disabled={verifyingOtp}
                              />
                              <Button
                                type="submit"
                                variant="primary"
                                disabled={verifyingOtp || otpInput.trim().length !== 6}
                                className="text-xs font-bold px-6 bg-[#0E6B45] hover:bg-[#0A5234]"
                              >
                                {verifyingOtp ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" /> Verifying...
                                  </>
                                ) : (
                                  'Verify & Complete'
                                )}
                              </Button>
                            </div>
                          </div>

                          {otpError && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
                              <ShieldAlert size={15} className="shrink-0" />
                              <span>{otpError}</span>
                            </div>
                          )}
                        </form>
                      ) : (
                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                          <KeyRound size={28} className="text-slate-400 mx-auto" />
                          <h4 className="text-xs font-bold text-slate-800">Handover Protocol Standing By</h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                            Your reservation is confirmed. Once you arrive at the pickup location, the supplier dispatch team will initiate transfer, and you can enter their 6-digit handover code here.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Manifest Card */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#111827]">Surplus Batch Details</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{activeReservation.listing?.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supplier: {activeReservation.listing?.supplierName || 'Verified Supplier'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Net Weight</span>
                  <span className="text-xl font-bold text-[#0E6B45]">
                    {activeReservation.listing?.weightKg ? formatKg(activeReservation.listing.weightKg) : '—'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#5B6272] space-y-1.5 pt-2">
                <p className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#0E6B45]" />
                  Pickup Address: <strong>{activeReservation.pickupAddress || 'Address on record'}</strong>
                </p>
                {activeReservation.onSiteContact && (
                  <p className="flex items-center gap-1.5">
                    <User size={13} className="text-[#0E6B45]" />
                    On-site Contact: <strong>{activeReservation.onSiteContact}</strong> {activeReservation.onSitePhone ? `(${activeReservation.onSitePhone})` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Coordination Channel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E6E8F0] overflow-hidden shadow-xs flex flex-col h-[520px]">
              <div className="px-5 py-3.5 bg-white border-b border-[#E6E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#0E6B45]" />
                  <span className="text-xs font-bold text-[#111827]">Dispatch Coordination Chat</span>
                </div>
                {isChatClosed ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    {isReservationCancelled ? 'Closed' : 'Archived (Read-Only)'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0E6B45]">
                    <span className="w-2 h-2 rounded-full bg-[#0E6B45] animate-pulse" />
                    Live Channel
                  </span>
                )}
              </div>

              {/* Chat Log Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8F9FC]">
                {loadingChat && chat.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 space-y-2">
                    <Loader2 size={20} className="animate-spin text-[#0E6B45]" />
                    <p className="text-xs">Loading dispatch chat...</p>
                  </div>
                ) : chatError && chat.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <ShieldAlert size={24} className="text-red-500" />
                    <p className="text-xs text-red-700 font-medium">{chatError}</p>
                    <button
                      type="button"
                      onClick={() => fetchChat(true)}
                      className="text-xs font-bold text-[#0E6B45] hover:underline inline-flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                ) : chat.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-1.5 text-slate-400 py-16">
                    <MessageSquare size={24} className="text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No Messages Yet</p>
                    <p className="text-[11px] text-slate-400 max-w-[220px]">
                      Use this live channel to coordinate pickup arrival, bay doors, and timing.
                    </p>
                  </div>
                ) : (
                  chat.map((msg) => {
                    const isMe =
                      (isSupplier && msg.senderRole === 'supplier') ||
                      (!isSupplier && msg.senderRole === 'recipient');
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 px-1">
                          <span className="font-semibold">{msg.senderName}</span>
                          <span>· {msg.sentAt}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs break-words ${
                            isMe
                              ? 'bg-[#0E6B45] text-white rounded-tr-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {sendChatError && (
                <div className="px-3 py-1.5 bg-red-50 border-t border-red-200 text-red-700 text-[11px] flex items-center justify-between">
                  <span>{sendChatError}</span>
                  <button
                    type="button"
                    onClick={() => setSendChatError(null)}
                    className="font-bold text-red-900 hover:underline"
                  >
                    ✕
                  </button>
                </div>
              )}

              {isChatClosed && (
                <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 text-slate-600 text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock size={12} className="text-slate-500 shrink-0" />
                    {isReservationCancelled
                      ? 'This reservation was cancelled. Chat is read-only.'
                      : 'Handover complete. The 2-hour dispatch coordination window has expired (read-only).'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                    Read-Only
                  </span>
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-[#E6E8F0] flex gap-2">
                <input
                  type="text"
                  maxLength={1000}
                  value={inputMsg}
                  disabled={sendingMsg || isChatClosed}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder={
                    isReservationCancelled
                      ? 'Chat closed — reservation was cancelled'
                      : isChatExpired
                      ? 'Chat closed — 2-hour post-handover window expired'
                      : 'Message driver or dock manager...'
                  }
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0E6B45]/20 focus:border-[#0E6B45] disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={sendingMsg || !inputMsg.trim() || isChatClosed}
                  className="px-3.5 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMsg ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
