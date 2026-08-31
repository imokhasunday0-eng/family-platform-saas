"use client";

import { usePresence } from "./use-presence";

type Member = { id: string; name: string; avatarUrl?: string | null };

/**
 * Permanent presence indicator — no toasts, no come-and-go.
 * Shows a green dot per online member, next to their name.
 */
export function OnlineDots({ members }: { members: Member[] }) {
  const { online, self } = usePresence();

  const others = members.filter(
    (m) => online.has(m.id) && m.id !== self
  );

  if (others.length === 0) return null;

  return (
    <div className="mt-1 flex items-center gap-3">
      {others.map((m) => (
        <span key={m.id} className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {m.name}
          </span>
        </span>
      ))}
    </div>
  );
}
