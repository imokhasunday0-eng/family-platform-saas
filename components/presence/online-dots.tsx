"use client";

import { usePresence } from "./use-presence";

type Member = { id: string; name: string; avatarUrl?: string | null };

export function OnlineDots({ members }: { members: Member[] }) {
  const { online, self } = usePresence();
  const others = members.filter((m) => online.has(m.id) && m.id !== self);

  return (
    <div className="h-6 shrink-0 overflow-hidden border-b border-border/60 px-4">
      {others.length > 0 && (
        <div className="flex h-6 items-center gap-4">
          {others.map((m) => (
            <span key={m.id} className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
              </span>
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-xs font-medium text-transparent">
                {m.name}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
