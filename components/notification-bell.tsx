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

    // Poll every 20s so notifications created server-side (new chores,
    // family joins, etc.) show up without a manual page reload
    const interval = setInterval(loadCount, 20000);

    // Instant refresh when the user returns to the tab
    const onFocus = () => {
      if (document.visibilityState === "visible") loadCount();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.removeEventListener("notifications-changed", handler);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      clearInterval(interval);
    };
  }, [loadCount]);

  return (
    <Link
      href="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
      aria-label="Notifications"
    >
      <Bell className="h-[17px] w-[17px]" />
      {unread !== null && unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-none text-primary-foreground">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
