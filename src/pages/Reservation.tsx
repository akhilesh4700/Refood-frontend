import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Sliders,
  Snowflake,
  ClipboardList,
  Sparkles,
  Layers
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useRolePaths } from '../lib/useRolePaths';

interface ChatItem {
  id: string;
  sender: string;
  role: 'recipient' | 'supplier' | 'driver';
  time: string;
  text: string;
}

const initialChat: ChatItem[] = [
  {
    id: '1',
    sender: 'Downtown Mission Dispatch',
    role: 'recipient',
    time: '17:15',
    text: 'Hi Chef Marcus, our volunteer driver Elena is en route in a white van (Plate #5XYZ89), arriving at 17:40.',
  },
  {
    id: '2',
    sender: 'Chef Marcus Vance',
    role: 'supplier',
    time: '17:22',
    text: 'Great Elena, gate security has your name. Dock 2 is clear and trays are packed in commercial Cambro coolers ready for transfer.',
  },
  {
    id: '3',
    sender: 'Elena (Driver)',
    role: 'driver',
    time: '17:35',
    text: 'Arrived at security gate now, buzzing through.',
  },
];

export function Reservation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(2);
  const [chat, setChat] = useState<ChatItem[]>(initialChat);
  const [inputMsg, setInputMsg] = useState('');
  const [countdown, setCountdown] = useState('01:42:10');

  // Checklist items
  const [chkTemp, setChkTemp] = useState(false);
  const [chkSeal, setChkSeal] = useState(false);
  const [chkReceipt, setChkReceipt] = useState(false);

  const [completed, setCompleted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let seconds = 3600 + 42 * 60 + 10;
    const timer = setInterval(() => {
      seconds = Math.max(0, seconds - 1);
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg: ChatItem = {
      id: `chat-${Date.now()}`,
      sender: 'Chef Marcus Vance',
      role: 'supplier',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputMsg.trim(),
    };

    setChat((prev) => [...prev, newMsg]);
    setInputMsg('');
  };

  const isChecklistComplete = chkTemp && chkSeal && chkReceipt;

  const handleCompletePickup = () => {
    if (!isChecklistComplete) return;
    setCompleted(true);
    setCurrentStep(4);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-16">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-[#E6E8F0]">
        <div className="max-w-[1240px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#5B6272] font-medium">
            <Link to="/listings" className="hover:text-[#111827]">Reservations & Pickups</Link>
            <span>›</span>
            <span className="text-[#111827]">Order #{id || 'RF-84920'}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#5B6272] font-bold uppercase tracking-wider text-[10px]">TARGET HANDOVER</span>
            <span className="font-mono font-bold text-[#111827] bg-[#EEF0FA] px-2.5 py-1 rounded-md border border-[#E6E8F0]">
              17:45 Local
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-6 pt-6">
        {/* Title Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
            Active Pickup Order #{id || 'RF-84920'}
          </h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-xs font-bold border border-[#7EE8C8]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E6B45]" />
            {completed ? 'Pickup Completed (Step 4 of 4)' : 'In Progress (Step 2 of 4)'}
          </span>
        </div>

        {/* 4-Step Stepper Header */}
        <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 mb-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="flex items-start gap-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#0E6B45] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check size={16} strokeWidth={2.5} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#111827]">1. Listing Reserved</div>
                <div className="text-[11px] text-[#0E6B45] font-semibold mt-0.5">Completed · 14:15</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">Allocated to Downtown Hope Mission</div>
              </div>
            </div>

            {/* Step 2 (Active) */}
            <div className="flex items-start gap-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#0E6B45] text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-[#7EE8C8]/40">
                <ClipboardList size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#0E6B45] flex items-center gap-1.5">
                  2. Ready for Pickup
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0E6B45]" />
                </div>
                <div className="text-[11px] text-[#0E6B45] font-semibold mt-0.5">Active Step</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">Packed & chilled at 15:45 · 3.4°C verified</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#EEF0FA] text-[#5B6272] flex items-center justify-center shrink-0">
                <Truck size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#5B6272]">3. In Transit</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">Pending OTP Verification</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">Driver Elena arriving via Dock 2</div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3 relative">
              <div className="w-8 h-8 rounded-full bg-[#EEF0FA] text-[#5B6272] flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#5B6272]">4. Impact Logged</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">Awaiting Handover</div>
                <div className="text-[11px] text-[#5B6272] mt-0.5">~84kg CO2e offset calculation</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Dock Handover Code */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] overflow-hidden shadow-xs border-t-4 border-t-[#0E6B45]">
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">
                      DOCK HANDOVER CODE
                    </div>
                    <h3 className="text-xl font-bold text-[#111827] mt-0.5">Show at Loading Gate</h3>
                    <p className="text-xs text-[#5B6272] mt-1">
                      Present this code or scan directly to release cargo manifest
                    </p>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#FBEBDD] border border-[#B8650A]/20 flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#B8650A]">Expires in</span>
                    <span className="font-mono text-sm font-extrabold text-[#B8650A]">{countdown}</span>
                  </div>
                </div>

                {/* Inner Handover Container */}
                <div className="bg-[#F6F7FB] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-8 border border-[#E6E8F0]">
                  <div className="p-3 bg-white rounded-2xl border border-[#E6E8F0] shadow-sm shrink-0">
                    <QRCodeSVG
                      value="REFOOD-AUTH-GATE-DOCK2:RF-84920:PIN-749218"
                      size={135}
                      fgColor="#0E6B45"
                      level="H"
                    />
                  </div>

                  <div className="text-center sm:text-left flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6272]">
                      VERIFICATION PIN
                    </div>
                    <div className="font-mono text-3xl lg:text-4xl font-extrabold text-[#0E6B45] tracking-wider my-2">
                      749 – 218
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#0E6B45] font-semibold mt-1">
                      <CheckCircle2 size={15} />
                      Verified Cold-Chain Handover Protocol
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Surplus Items Manifest */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#111827]">Surplus Items Manifest</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-xs font-semibold">
                  <Snowflake size={13} />
                  Stored at 3.4°C
                </span>
              </div>

              <div className="p-4 bg-white border border-[#E6E8F0] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=300&h=300&fit=crop"
                      alt="Catering trays"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-[#0E6B45] text-white text-[10px] font-bold">
                        Edible Surplus
                      </span>
                      <span className="text-[11px] text-[#5B6272] font-mono">Batch #RTZ-092</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#111827]">35 kg Chilled Catering Trays</h4>
                    <p className="text-xs text-[#5B6272] mt-0.5 max-w-md">
                      Ritz Executive Catering - Main Banquet Surplus (Halal-friendly, allergens tagged on trays 1-6).
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-[#E6E8F0] sm:pl-6 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="text-[10px] uppercase font-bold text-[#5B6272]">Total Weight</span>
                  <span className="text-2xl font-bold text-[#0E6B45]">35.0 kg</span>
                </div>
              </div>
            </div>

            {/* Card 3: Pickup Location & Logistics */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Pickup Location & Logistics</h3>
                  <p className="text-xs text-[#5B6272] mt-0.5">
                    Loading Dock 2 · Direct freight elevator access
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Opening Google Maps navigation to Loading Dock 2...')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF0FA] hover:bg-[#E6E8F0] text-xs font-semibold text-[#111827] rounded-xl transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} />
                  Open in Google Maps
                </button>
              </div>

              {/* Map Container */}
              <div className="relative h-56 rounded-2xl overflow-hidden border border-[#E6E8F0] bg-[#EEF0FA] mb-4">
                {/* Styled OpenStreetMap Canvas simulation */}
                <div className="absolute inset-0 bg-[#E8ECEF]">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#CBD5E1_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
                  {/* Roads / graphic styling */}
                  <svg className="w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="80" x2="600" y2="120" stroke="#CBD5E1" strokeWidth="18" />
                    <line x1="120" y1="0" x2="280" y2="250" stroke="#CBD5E1" strokeWidth="14" />
                    <line x1="200" y1="220" x2="550" y2="40" stroke="#7EE8C8" strokeWidth="5" strokeDasharray="6 4" />
                  </svg>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#0E6B45] text-white flex items-center justify-center shadow-lg ring-4 ring-white animate-pulse">
                    <MapPin size={22} />
                  </div>
                </div>

                {/* Floating Address Bar */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#E6E8F0] flex items-center justify-between text-xs shadow-md">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#0E6B45] shrink-0" />
                    <div>
                      <div className="font-bold text-[#111827]">450 Grand Ave, Dock 2</div>
                      <div className="text-[11px] text-[#5B6272]">Entrance off Commercial Alleyway</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[#EEF0FA] font-mono text-xs font-bold text-[#111827] border border-[#E6E8F0]">
                    Gate Pin: 4402
                  </span>
                </div>
              </div>

              {/* On-Site Contact Bar */}
              <div className="p-3 bg-[#FAFAFC] rounded-xl border border-[#E6E8F0] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&h=100&fit=crop"
                    alt="Chef Marcus Vance"
                    className="w-10 h-10 rounded-full object-cover border border-[#E6E8F0]"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#111827]">Chef Marcus Vance</h4>
                    <p className="text-[11px] text-[#5B6272]">Kitchen Director · On-site Contact</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alert('Calling Kitchen Dock: +1 (415) 890-2100')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E6E8F0] text-xs font-semibold text-[#111827] rounded-xl hover:bg-[#EEF0FA] cursor-pointer"
                  >
                    <Phone size={13} className="text-[#0E6B45]" />
                    Call Dock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const chatInput = document.getElementById('coord-chat-input');
                      chatInput?.focus();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0E6B45] text-white text-xs font-semibold rounded-xl hover:bg-[#0A5234] cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    Message Chef
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 1: Coordination Channel */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] overflow-hidden shadow-xs flex flex-col h-[460px]">
              <div className="px-5 py-3.5 bg-white border-b border-[#E6E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#0E6B45]" />
                  <span className="text-xs font-bold text-[#111827]">Coordination Channel</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0E6B45]">
                  <span className="w-2 h-2 rounded-full bg-[#0E6B45] animate-pulse" />
                  Live Dispatch
                </span>
              </div>

              {/* Chat Log Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white">
                {chat.map((m) => {
                  const isSupplier = m.role === 'supplier';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isSupplier ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-[#5B6272] mb-1 px-1 font-medium">
                        {m.sender} · {m.time}
                      </div>
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isSupplier
                            ? 'bg-[#0E6B45] text-white rounded-tr-none'
                            : 'bg-[#EEF0FA] text-[#111827] rounded-tl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Form with React state */}
              <form onSubmit={handleSend} className="p-3 border-t border-[#E6E8F0] bg-white flex items-center gap-2">
                <input
                  id="coord-chat-input"
                  type="text"
                  placeholder="Type coordinate message..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs bg-[#EEF0FA] rounded-full border border-transparent focus:outline-none focus:border-[#0E6B45] focus:bg-white text-[#111827]"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim()}
                  className="w-8 h-8 rounded-full bg-[#0E6B45] hover:bg-[#0A5234] disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>

            {/* Card 2: Important Pickup Checklist */}
            <div className="bg-white rounded-2xl border border-[#E6E8F0] p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Sliders size={18} className="text-[#0E6B45]" />
                <h3 className="text-sm font-bold text-[#111827]">Important Pickup Checklist</h3>
              </div>
              <p className="text-xs text-[#5B6272] mb-4">
                Complete mandatory cold-chain compliance items prior to departure:
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6E8F0] bg-white hover:bg-[#FAFAFC] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={chkTemp}
                    onChange={(e) => setChkTemp(e.target.checked)}
                    className="mt-0.5 rounded text-[#0E6B45] focus:ring-[#0E6B45] cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#111827] block">Check Temperature Upon Arrival</span>
                    <span className="text-[#5B6272] text-[11px] block mt-0.5">
                      Log probed temperature (&lt; 4.0°C / 40°F required for prepared meats)
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6E8F0] bg-white hover:bg-[#FAFAFC] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={chkSeal}
                    onChange={(e) => setChkSeal(e.target.checked)}
                    className="mt-0.5 rounded text-[#0E6B45] focus:ring-[#0E6B45] cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#111827] block">Verify Seal Integrity</span>
                    <span className="text-[#5B6272] text-[11px] block mt-0.5">
                      Confirm tamper-evident security labels intact on all 8 catering trays
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6E8F0] bg-white hover:bg-[#FAFAFC] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={chkReceipt}
                    onChange={(e) => setChkReceipt(e.target.checked)}
                    className="mt-0.5 rounded text-[#0E6B45] focus:ring-[#0E6B45] cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#111827] block">Sign Digital Handover Receipt</span>
                    <span className="text-[#5B6272] text-[11px] block mt-0.5">
                      Chef Marcus signs on recipient driver tablet at loading zone
                    </span>
                  </div>
                </label>
              </div>

              {/* Confirm Release Button */}
              <Button
                variant="primary"
                className="w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs"
                disabled={!isChecklistComplete || completed}
                onClick={handleCompletePickup}
              >
                <Check size={16} />
                {completed ? 'Food Received & Order Completed' : 'Confirm Food Received / Complete Pickup'}
              </Button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => alert('Report Issue modal opened')}
                  className="text-[#C62828] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <AlertTriangle size={12} />
                  Report Issue with Order
                </button>
                <span className="text-[#5B6272]">·</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Cancel this scheduled pickup order?')) {
                      window.location.href = window.location.pathname.startsWith('/recipient')
                        ? '/recipient/dashboard'
                        : '/supplier/dashboard';
                    }
                  }}
                  className="text-[#5B6272] hover:underline cursor-pointer"
                >
                  Cancel Pickup
                </button>
              </div>
            </div>

            {/* Card 3: Good Samaritan Protection Active */}
            <div className="p-4 rounded-2xl bg-[#E6FAF2] border border-[#7EE8C8]/30 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#7EE8C8] text-[#0A5234] flex items-center justify-center shrink-0">
                <Shield size={16} />
              </div>
              <div className="text-xs text-[#111827]">
                <span className="font-bold block">Good Samaritan Protection Active</span>
                <span className="text-[#5B6272] text-[11px] block mt-0.5">
                  Donation is covered under Federal Bill Emerson Good Samaritan Food Donation Act and applicable Indian FSSAI food donation liability guidance.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
