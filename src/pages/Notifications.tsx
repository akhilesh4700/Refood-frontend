import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Truck,
  Leaf,
  Recycle,
  AlertTriangle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  stream: 'edible' | 'organic' | 'urgent' | 'system';
  read: boolean;
  link?: string;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Driver Arrived at Dock 3',
    description: 'Driver Ramesh Kumar (Robin Hood Army) has arrived for pickup #RF-84920.',
    timestamp: '2 mins ago',
    stream: 'urgent',
    read: false,
    link: '/reservations/RF-84920',
  },
  {
    id: 'notif-2',
    title: 'New Reservation for Surplus Batch #RF-84920',
    description: 'Robin Hood Army Bengaluru reserved 45 kg Artisanal Bakery & Breakfast Surplus.',
    timestamp: '24 mins ago',
    stream: 'edible',
    read: false,
    link: '/reservations/RF-84920',
  },
  {
    id: 'notif-3',
    title: 'Biogas Conversion Handover Verified',
    description: 'Biomass batch #RF-84922 (120 kg Coffee Grounds) received at Hasiru Dala Bio-Unit.',
    timestamp: '3 hours ago',
    stream: 'organic',
    read: true,
  },
  {
    id: 'notif-4',
    title: 'Daily Cold-Chain Temperature Log Signed',
    description: 'Sous Chef Anita Sharma uploaded verified HACCP temperature sensor telemetry.',
    timestamp: '5 hours ago',
    stream: 'system',
    read: true,
  },
  {
    id: 'notif-5',
    title: 'Monthly Scope 3 ESG Audit Generated',
    description: 'Your September diversion figures (1,970 kg) are ready for download in Sustainability Reports.',
    timestamp: 'Yesterday',
    stream: 'edible',
    read: true,
    link: '/analytics',
  },
];

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-16">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-[#E6E8F0]">
        <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6272] bg-[#EEF0FA] px-2.5 py-0.5 rounded-full">
                Realtime Activity
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold text-[#0E6B45] bg-[#DDF7EE] px-2.5 py-0.5 rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
              Notifications & Activity Feed
            </h1>
          </div>

          <Button
            variant="secondary"
            className="flex items-center gap-2 text-xs font-semibold text-[#5B6272]"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={15} />
            Mark All as Read
          </Button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-8">
        <div className="bg-white rounded-2xl border border-[#E6E8F0] overflow-hidden shadow-sm divide-y divide-[#E6E8F0]">
          {notifications.map((item) => {
            const iconBg =
              item.stream === 'urgent'
                ? 'bg-[#FDE7E7] text-[#C62828]'
                : item.stream === 'organic'
                ? 'bg-[#FBEBDD] text-[#B8650A]'
                : item.stream === 'edible'
                ? 'bg-[#DDF7EE] text-[#0E6B45]'
                : 'bg-[#EEF0FA] text-[#5B6272]';

            const Icon =
              item.stream === 'urgent'
                ? AlertTriangle
                : item.stream === 'organic'
                ? Recycle
                : item.stream === 'edible'
                ? Leaf
                : ShieldCheck;

            return (
              <div
                key={item.id}
                className={`p-5 flex items-start gap-4 transition-colors ${
                  item.read ? 'bg-white' : 'bg-[#FAFAFC]'
                } hover:bg-[#EEF0FA]/50`}
                onClick={() => markRead(item.id)}
              >
                {/* Stream colored icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#0E6B45] shrink-0" />
                    )}
                    <h3 className="text-sm font-bold text-[#111827] truncate">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#5B6272] mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[#5B6272]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {item.timestamp}
                    </span>
                    {item.link && (
                      <a
                        href={item.link}
                        className="font-semibold text-[#0E6B45] hover:underline flex items-center gap-0.5"
                      >
                        View Details
                        <ChevronRight size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
