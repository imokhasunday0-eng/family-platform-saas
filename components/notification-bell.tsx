"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [unread, setUnread] = useState<number | null>(null);

  const loadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUnread(data.unreadCount ?? 0);
    } catch {
      // silent — badge just keeps last value
    }
  }, []);

  useEffect(() => {
    loadCount();

    // Re-fetch whenever anything changes notifications anywhere in the app
    const handler = () => loadCount();
    window.addEventListener("notifications-changed", handler);
    return () => window.removeEventListener("notifications-changed", handler);
  }, [loadCount]);

  return (
    <Link
      href="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted"
      aria-label="Notifications"
    >
      <Bell className="h-[17px] w-[17px]" />
      {unread !== null && unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
