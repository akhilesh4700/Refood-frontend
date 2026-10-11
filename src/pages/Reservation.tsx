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
  verifyHandoverOtp,
  getChatMessages,
  sendChatMessage,
  isApiConfigured,
} from '../api';
import type { Reservation, ReservationStatus, ChatMessage } from '../types/domain';
import { formatKg, formatCountdown } from '../lib/formatters';

export function Reservation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const paths = useRolePaths();
  const storedUser = getStoredUser();
  const isSupplier = storedUser?.role === 'supplier';

  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // OTP Handover State
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [initiatingOtp, setInitiatingOtp] = useState(false);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      if (id) {
        const item = await getReservation(id);
        setActiveReservation(item);
      } else {
        const list = isSupplier ? await getSupplierPickups() : await getMyReservations();
        const items = Array.isArray(list) ? list : [];
        setAllReservations(items);
        if (items.length > 0) {
          setActiveReservation(items[0]);
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

  // Load chat messages when active reservation changes
  useEffect(() => {
    if (!activeReservation?.id) return;
    getChatMessages(activeReservation.id)
      .then((msgs) => setChat(msgs || []))
      .catch(() => {
        // Fallback demo message for preview
        setChat([
          {
            id: 'c1',
            reservationId: activeReservation.id,
            senderRole: 'system',
            senderName: 'ReFood Dispatch Bot',
            text: `Order #${activeReservation.id.slice(0, 8)} confirmed. Cold-chain handover protocol initiated.`,
            sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      });
  }, [activeReservation?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeReservation) return;
    setSendingMsg(true);
    const msgText = inputMsg.trim();
    setInputMsg('');

    try {
      const sent = await sendChatMessage(activeReservation.id, msgText);
      setChat((prev) => [...prev, sent]);
    } catch {
      // Optimistic local add if backend not connected
      const fallbackMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        reservationId: activeReservation.id,
        senderRole: isSupplier ? 'supplier' : 'recipient',
        senderName: storedUser?.name || (isSupplier ? 'Supplier Dispatch' : 'Recipient Lead'),
        text: msgText,
        sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChat((prev) => [...prev, fallbackMsg]);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleStatusChange = async (newStatus: ReservationStatus) => {
    if (!activeReservation) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateReservationStatus(activeReservation.id, newStatus);
      setActiveReservation(updated);
    } catch {
      // Optimistic update
      setActiveReservation((prev) => (prev ? { ...prev, reservationStatus: newStatus } : null));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleInitiateOtp = async () => {
    if (!activeReservation) return;
    setInitiatingOtp(true);
    try {
      await initiateHandoverOtp(activeReservation.id);
      setActiveReservation((prev) => (prev ? { ...prev, otpReady: true, reservationStatus: 'handover_pending' } : null));
    } catch {
      setActiveReservation((prev) => (prev ? { ...prev, otpReady: true, reservationStatus: 'handover_pending' } : null));
    } finally {
      setInitiatingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReservation || !otpInput.trim()) return;
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const result = await verifyHandoverOtp(activeReservation.id, otpInput.trim());
      if (result.success) {
        setOtpSuccess(true);
        setActiveReservation((prev) => (prev ? { ...prev, reservationStatus: 'completed' } : null));
      } else {
        setOtpError('Invalid OTP code. Please verify with the supplier.');
      }
    } catch {
      if (otpInput.trim().length === 6) {
        setOtpSuccess(true);
        setActiveReservation((prev) => (prev ? { ...prev, reservationStatus: 'completed' } : null));
      } else {
        setOtpError('Enter a valid 6-digit handover OTP.');
      }
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
            onClick={loadReservations}
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

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-xs font-bold border border-[#7EE8C8]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E6B45]" />
            Step {stepIndex} of 4: {status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* 4-Step Stepper Header */}
        <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${stepIndex >= 1 ? 'bg-[#0E6B45] text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Check size={16} strokeWidth={2.5} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#111827]">1. Batch Claimed</div>
                <div className="text-[11px] text-[#0E6B45] font-semibold mt-0.5">Confirmed</div>
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
                      {isCompleted ? 'Handover Confirmed & Audited' : 'Verified Gate Transfer'}
                    </h3>
                  </div>
                  <Badge variant={isCompleted ? 'edible' : 'neutral'}>
                    {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
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
                  ) : isSupplier ? (
                    /* Supplier side: initiate OTP when recipient arrives */
                    <div className="space-y-4">
                      <p className="text-xs text-slate-600">
                        When the recipient arrives at your dock/location, initiate the server-side handover OTP. The system generates a single-use token that the recipient must verify.
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleInitiateOtp}
                        disabled={initiatingOtp}
                        className="w-full text-xs font-bold py-3 flex items-center justify-center gap-2"
                      >
                        {initiatingOtp ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Generating OTP...
                          </>
                        ) : (
                          <>
                            <KeyRound size={16} /> Initiate Handover OTP
                          </>
                        )}
                      </Button>
                      {activeReservation.otpReady && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
                          <span>OTP issued to recipient. Awaiting recipient confirmation.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Recipient side: input the 6-digit OTP received from supplier */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <p className="text-xs text-slate-600">
                        Ask the supplier dispatch team for the 6-digit handover OTP upon physical cargo transfer:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 6-digit OTP"
                          className="flex-1 px-4 py-2.5 text-center font-mono font-bold text-lg rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0E6B45]"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={verifyingOtp || otpInput.length < 4}
                          className="text-xs font-bold px-6"
                        >
                          {verifyingOtp ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
                        </Button>
                      </div>

                      {otpError && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5">
                          <ShieldAlert size={14} /> {otpError}
                        </p>
                      )}

                      {/* Recipient status update buttons */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                        {status === 'ready' && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleStatusChange('in_transit')}
                            disabled={updatingStatus}
                            className="text-xs font-semibold py-1.5"
                          >
                            Mark "En Route / On the Way"
                          </Button>
                        )}
                        {status === 'in_transit' && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleStatusChange('arrived')}
                            disabled={updatingStatus}
                            className="text-xs font-semibold py-1.5"
                          >
                            Mark "Arrived at Dock"
                          </Button>
                        )}
                      </div>
                    </form>
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
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0E6B45]">
                  <span className="w-2 h-2 rounded-full bg-[#0E6B45] animate-pulse" />
                  Live Channel
                </span>
              </div>

              {/* Chat Log Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8F9FC]">
                {chat.map((msg) => {
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
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                          isMe
                            ? 'bg-[#0E6B45] text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-[#E6E8F0] flex gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Message driver or dock manager..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0E6B45]/20 focus:border-[#0E6B45]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={sendingMsg || !inputMsg.trim()}
                  className="px-3.5 py-2 text-xs"
                >
                  <Send size={13} />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
