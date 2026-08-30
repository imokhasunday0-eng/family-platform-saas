"use client";

import { useEffect } from "react";

export function PresenceHeartbeat() {
  useEffect(() => {
    const ping = () => {
      fetch("/api/presence", { method: "POST", cache: "no-store" }).catch(
        () => {}
      );
    };
    ping(); // immediately on mount
    const interval = setInterval(ping, 60000); // then every 60s
    return () => clearInterval(interval);
  }, []);
  return null;
}
