"use client";

import { useEffect, useState } from "react";

export function OnlineDot({ userId }: { userId: string }) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const read = () => {
      const el = document.getElementById("presence-data");
      if (!el) return;
      try {
        const ids: string[] = JSON.parse(el.getAttribute("data-online") || "[]");
        setOnline(ids.includes(userId));
      } catch {}
    };
    read();
    const obs = new MutationObserver(read);
    const el = document.getElementById("presence-data");
    if (el) obs.observe(el, { attributes: true });
    return () => obs.disconnect();
  }, [userId]);

  if (!online) return null;
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-slate-900"
      title="Online"
    />
  );
}
