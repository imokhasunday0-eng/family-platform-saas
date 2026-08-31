"use client";

import { useEffect, useState } from "react";

type PresenceState = {
  online: Set<string>;
  self: string | null;
};

/**
 * Heartbeats every poll and returns the set of online family member ids.
 * Mount once per page — it both keeps you visible and watches others.
 */
export function usePresence(pollMs = 30000): PresenceState {
  const [state, setState] = useState<PresenceState>({
    online: new Set(),
    self: null,
  });

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      try {
        await fetch("/api/presence", { method: "POST" }); // heartbeat
        const res = await fetch("/api/presence");
        if (res.ok && alive) {
          const data = await res.json();
          setState({ online: new Set(data.online), self: data.self ?? null });
        }
      } catch {
        // offline / tab sleeping — try again next tick
      }
    };

    tick();
    const timer = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [pollMs]);

  return state;
}
