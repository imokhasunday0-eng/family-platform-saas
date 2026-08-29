"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  channel: string;
  link: string | null;
  createdAt: string;
};

function getIcon(notification: Notification) {
  const text =
    (notification.title + " " + (notification.body ?? "")).toLowerCase();

  if (text.includes("chore")) return "✓";
  if (text.includes("event") || text.includes("calendar")) return "◷";
  if (text.includes("grocery")) return "🛒";
  if (text.includes("budget") || text.includes("₦")) return "₦";
  if (text.includes("family") || text.includes("member")) return "👨‍👩‍👧";

  return "🔔";
}

function getIconStyle(notification: Notification) {
  const text =
    (notification.title + " " + (notification.body ?? "")).toLowerCase();

  if (text.includes("chore"))
    return "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400";
  if (text.includes("event") || text.includes("calendar"))
    return "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400";
  if (text.includes("grocery"))
    return "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400";
  if (text.includes("budget") || text.includes("₦"))
    return "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400";

  return "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400";
}

function formatTime(date: string) {
  const value = new Date(date);
  const now = new Date();
  const diff = now.getTime() - value.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60)
    return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
  if (hours < 24)
    return hours + (hours === 1 ? " hour ago" : " hours ago");
  if (days < 7)
    return days + (days === 1 ? " day ago" : " days ago");

  return value.toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();

      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    const notification = notifications.find((item) => item.id === id);

    if (!notification || notification.read) return;

    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) return;

    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );

    setUnreadCount((count) => Math.max(0, count - 1));
    window.dispatchEvent(new Event("notifications-changed"));
  };

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    await markAsRead(notification.id);

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const deleteNotification = async (id: string) => {
    const res = await fetch("/api/notifications", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) return;

    setNotifications((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed && !removed.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return current.filter((item) => item.id !== id);
    });
    window.dispatchEvent(new Event("notifications-changed"));
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ all: true }),
    });

    if (!res.ok) return;

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      }))
    );

    setUnreadCount(0);
    window.dispatchEvent(new Event("notifications-changed"));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Activity center
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Stay updated with everything happening in your family.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-blue-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">
              Notification center
            </p>

            <p className="mt-1 text-2xl font-bold">
              {unreadCount} unread
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl backdrop-blur-sm">
            🔔
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Recent notifications
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
              🔔
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              You're all caught up
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              New family activity will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={
                  "group flex w-full cursor-pointer items-start gap-4 px-5 py-5 text-left transition " +
                  (!notification.read
                    ? "bg-blue-50/40 hover:bg-blue-50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40")
                }
              >
                <div
                  className={
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold " +
                    getIconStyle(notification)
                  }
                >
                  {getIcon(notification)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {notification.title}
                    </p>

                    {!notification.read && (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                    )}
                  </div>

                  {notification.body && (
                    <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
                      {notification.body}
                    </p>
                  )}

                  <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                    {formatTime(notification.createdAt)}
                    {notification.link && (
                      <span className="ml-2 font-semibold text-blue-500">
                        Click to open →
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  aria-label="Delete notification"
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
