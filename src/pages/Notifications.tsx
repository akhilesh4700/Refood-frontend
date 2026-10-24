import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, CheckCheck, Clock, Loader2, AlertCircle,
  Leaf, Truck, Recycle, ShieldCheck, Package,
  AlertTriangle, MessageSquare,
} from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, ApiUnavailableError } from '../api';
import type { AppNotification, NotificationEventType } from '../types/domain';

/* ─── Icon + colour per event type ──────────────────────────────────── */
const EVENT_CONFIG: Record<NotificationEventType, { icon: React.ElementType; bg: string; text: string }> = {
  reservation_new:              { icon: Package,       bg: 'bg-[#DDF7EE]', text: 'text-[#0E6B45]' },
  reservation_confirmed:        { icon: CheckCheck,    bg: 'bg-[#DDF7EE]', text: 'text-[#0E6B45]' },
  reservation_cancelled:        { icon: AlertTriangle, bg: 'bg-[#FDE7E7]', text: 'text-[#C62828]' },
  reservation_conflict:         { icon: AlertTriangle, bg: 'bg-[#FDE7E7]', text: 'text-[#C62828]' },
  pickup_deadline_approaching:  { icon: Clock,         bg: 'bg-[#FBEBDD]', text: 'text-[#B8650A]' },
  recipient_on_the_way:         { icon: Truck,         bg: 'bg-[#EEF0FA]', text: 'text-[#5B6272]' },
  recipient_arrived:            { icon: Truck,         bg: 'bg-[#DDF7EE]', text: 'text-[#0E6B45]' },
  handover_completed:           { icon: ShieldCheck,   bg: 'bg-[#DDF7EE]', text: 'text-[#0E6B45]' },
  payment_update:               { icon: Package,       bg: 'bg-[#EEF0FA]', text: 'text-[#5B6272]' },
  chat_message:                 { icon: MessageSquare, bg: 'bg-[#EEF0FA]', text: 'text-[#5B6272]' },
  listing_expired:              { icon: AlertTriangle, bg: 'bg-[#FDE7E7]', text: 'text-[#C62828]' },
  system:                       { icon: ShieldCheck,   bg: 'bg-[#EEF0FA]', text: 'text-[#5B6272]' },
};

const DEFAULT_CONFIG = { icon: Bell, bg: 'bg-[#EEF0FA]', text: 'text-[#5B6272]' };

function getConfig(eventType: NotificationEventType) {
  return EVENT_CONFIG[eventType] ?? DEFAULT_CONFIG;
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [apiPending, setApiPending]       = useState(false);
  const [markingAll, setMarkingAll]       = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        setApiPending(true);
        setNotifications([]);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load notifications.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
    );
    try {
      await markNotificationRead(id);
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, isRead: false } : n)
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      // Revert on failure
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: false })));
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-16">

      {/* Top Header Bar */}
      <div className="bg-white border-b border-[#E6E8F0]">
        <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6272] bg-[#EEF0FA] px-2.5 py-0.5 rounded-full">
                Activity Feed
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold text-[#0E6B45] bg-[#DDF7EE] px-2.5 py-0.5 rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] tracking-tight">
              Notifications
            </h1>
          </div>

          {!apiPending && !loading && notifications.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-700
                         bg-[#EEF0FA] text-[#5B6272] hover:bg-[#E6E8F0] transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {markingAll
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCheck size={14} />}
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-8">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-[#0E6B45]" />
          </div>
        )}

        {/* API pending */}
        {!loading && apiPending && (
          <div className="bg-white rounded-2xl border border-[#E6E8F0] p-10 text-center shadow-xs">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-[#111827] mb-2">
              Notifications will appear here
            </h3>
            <p className="text-sm text-[#5B6272] max-w-md mx-auto leading-relaxed">
              Real-time notifications are delivered by the backend. Configure{' '}
              <code className="font-mono bg-[#EEF0FA] px-1.5 py-0.5 rounded text-xs">VITE_API_BASE_URL</code>{' '}
              to connect.
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-700 text-red-800">Failed to load notifications</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button
                onClick={loadNotifications}
                className="mt-3 text-xs font-700 text-red-700 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !apiPending && !error && notifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E6E8F0] p-12 text-center shadow-xs">
            <Bell size={36} className="text-[#D1D5DB] mx-auto mb-4" />
            <p className="text-base font-bold text-[#111827]">No notifications yet</p>
            <p className="text-sm text-[#5B6272] mt-2">
              Platform events and pickup updates will appear here.
            </p>
          </div>
        )}

        {/* Notification list */}
        {!loading && !apiPending && !error && notifications.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E6E8F0] overflow-hidden shadow-sm divide-y divide-[#E6E8F0]">
            {notifications.map((item) => {
              const config = getConfig(item.eventType);
              const Icon = config.icon;
              return (
                <div
                  key={item.id}
                  className={`p-5 flex items-start gap-4 transition-colors cursor-pointer
                    ${item.isRead ? 'bg-white' : 'bg-[#FAFAFC]'} hover:bg-[#EEF0FA]/50`}
                  onClick={() => !item.isRead && handleMarkRead(item.id)}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                    <Icon size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#0E6B45] shrink-0" />
                      )}
                      <h3 className="text-sm font-bold text-[#111827] truncate">{item.title}</h3>
                    </div>
                    <p className="text-xs text-[#5B6272] mt-1 leading-relaxed">{item.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#5B6272]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                      {item.relatedPath && (
                        <Link
                          to={item.relatedPath}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!item.isRead) {
                              handleMarkRead(item.id);
                            }
                          }}
                          className="font-semibold text-[#0E6B45] hover:underline"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
