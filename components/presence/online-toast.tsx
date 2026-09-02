"use client";

import { useEffect, useRef, useState } from "react";
import { usePresence } from "./use-presence";

type Member = { id: string; name: string; avatarUrl?: string | null };

const VISIBLE_MS = 4000;
const COOLDOWN_MS = 10 * 60 * 1000; // don't repeat the same person within 10 min

export function OnlineToast({ members }: { members: Member[] }) {
  const { online, self } = usePresence();
  const [current, setCurrent] = useState<Member | null>(null);
  const [shown, setShown] = useState(false);
  const prevOnline = useRef<Set<string> | null>(null);
  const offlineStreak = useRef<Map<string, number>>(new Map());

  const cooldownMap = (): Map<string, number> => {
    try {
      return new Map(Object.entries(JSON.parse(sessionStorage.getItem("presence-cooldown") ?? "{}")));
    } catch {
      return new Map();
    }
  };
  const markCooldown = (id: string) => {
    try {
      const map = cooldownMap();
      map.set(id, Date.now());
      sessionStorage.setItem("presence-cooldown", JSON.stringify(Object.fromEntries(map)));
    } catch {}
  };

  useEffect(() => {
    const active = new Set(
      [...online].filter((id) => id !== self)
    );

    // First result is the baseline — never toast on page load
    if (prevOnline.current === null) {
      prevOnline.current = active;
      return;
    }

    // Track how long each person has been offline (anti-flap)
    for (const id of active) offlineStreak.current.delete(id);
    for (const id of members.map((m) => m.id)) {
      if (!active.has(id) && !offlineStreak.current.has(id)) {
        offlineStreak.current.set(id, Date.now());
      }
    }

    // Only toast someone who was offline for >= 1 poll cycle (stable transition)
    const newcomers = [...active].filter(
      (id) =>
        !prevOnline.current!.has(id) &&
        offlineStreak.current.has(id) &&
        Date.now() - offlineStreak.current.get(id)! >= 25000
    );
    prevOnline.current = active;

    if (newcomers.length === 0 || current) return;

    const now = Date.now();
    const cooldowns = cooldownMap();
    const member = newcomers
      .map((id) => members.find((m) => m.id === id))
      .find((m) => m && now - (cooldowns.get(m.id) ?? 0) > COOLDOWN_MS);
    if (!member) return;

    markCooldown(member.id);
    setCurrent(member);
    setShown(true);
    const hide = setTimeout(() => {
      setShown(false);
      setTimeout(() => setCurrent(null), 350); // after fade-out
    }, VISIBLE_MS);
    return () => clearTimeout(hide);
  }, [online, self, members, current]);

  if (!current) return null;

  const initial = current.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-2.5 rounded-full bg-slate-900/90 py-1.5 pl-1.5 pr-4 shadow-lg ring-1 ring-white/10 backdrop-blur dark:bg-slate-800/90">
        {current.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.avatarUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
            {initial}
          </span>
        )}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <p className="text-sm font-medium text-white">
          {current.name} is online
        </p>
      </div>
    </div>
  );
}
