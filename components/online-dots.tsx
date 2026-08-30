"use client";

import { useEffect, useState } from "react";

export function OnlineDots() {
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/presence", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setOnline(new Set(data.online ?? []));
      } catch {}
    };
    load();
    const interval = setInterval(load, 20000);
    const onFocus = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <span
      id="presence-data"
      data-online={JSON.stringify(Array.from(online))}
      style={{ display: "none" }}
    />
  );
}
