"use client";

import { useEffect, useRef, useState } from "react";
import { usePresence } from "./use-presence";

type Member = { id: string; name: string; avatarUrl?: string | null };

const VISIBLE_MS = 5000;
const REPEAT_MS = 5 * 60 * 1000; // same person can re-toast every 5 min

export function OnlineToast({ members }: { members: Member[] }) {
  const { online, self } = usePresence();
  const [current, setCurrent] = useState<Member | null>(null);
  const [shown, setShown] = useState(false);
  const prevOnline = useRef<Set<string> | null>(null);
  const lastShownAt = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const active = new Set([...online].filter((id) => id !== self));

    if (prevOnline.current === null) {
      prevOnline.current = active;
      return;
    }

    const newcomers = [...active].filter(
      (id) => !prevOnline.current!.has(id)
    );
    prevOnline.current = active;

    if (newcomers.length === 0 || current) return;

    const now = Date.now();
    const member = newcomers
      .map((id) => members.find((m) => m.id === id))
      .find((m) => m && now - (lastShownAt.current.get(m.id) ?? 0) > REPEAT_MS);
    if (!member) return;

    lastShownAt.current.set(member.id, now);
    setCurrent(member);
    setShown(true);
    const hide = setTimeout(() => {
      setShown(false);
      setTimeout(() => setCurrent(null), 400);
    }, VISIBLE_MS);
    return () => clearTimeout(hide);
  }, [online, self, members, current]);

  if (!current) return null;

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 transition-all duration-500 ${
        shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
    >
      <p className="animate-pulse bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-500 bg-clip-text text-sm font-semibold tracking-tight text-transparent drop-shadow-sm">
        {current.name} is online ✨
      </p>
    </div>
  );
}
