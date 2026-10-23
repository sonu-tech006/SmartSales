import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, AlertCircle, Check } from 'lucide-react';
import { NotificationItem } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { EmptyState, SkeletonLoader } from '../components/common/UIComponents';

export const NotificationsPage: React.FC = () => {
  const { success: toastSuccess } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      toastSuccess('Notification marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Platform Activity & Notifications
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time logs for ETL pipeline executions, model validations, and system alerts
        </p>
      </div>

      {loading ? (
        <SkeletonLoader rows={4} />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description="System events and forecast completion alerts will appear here."
          icon={Bell}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-2xs">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                n.read ? 'bg-white opacity-80' : 'bg-indigo-50/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {getIcon(n.type)}
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 rounded hover:bg-indigo-50 transition-colors shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
