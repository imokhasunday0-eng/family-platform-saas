"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  senderName: string;
};

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-fuchsia-500",
  "bg-lime-600",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (today.getTime() - thatDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function ChatView({
  conversationId,
  initialMessages,
  familyName,
}: {
  conversationId: string;
  initialMessages: ChatMessage[];
  familyName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const realCount = useRef(initialMessages.length);
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = scrollBoxRef.current;
    if (!box) return;
    requestAnimationFrame(() => {
      box.scrollTop = box.scrollHeight;
    });
  }, [messages]);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, after: realCount.current }),
        });
        if (!res.ok) return;
        const fresh = (await res.json()) as ChatMessage[];
        if (fresh.length === 0) return;
        realCount.current += fresh.length;
        setMessages((prev) => {
          const withoutTmp = prev.filter((m) => !m.id.startsWith("tmp-"));
          const seen = new Set(withoutTmp.map((m) => m.id));
          return [...withoutTmp, ...fresh.filter((m) => !seen.has(m.id))];
        });
      } catch {}
    }
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [conversationId]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, conversationId }),
      });

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: "tmp-" + Date.now(),
            content: trimmed,
            createdAt: new Date().toISOString(),
            isMine: true,
            senderName: "You",
          },
        ]);
      } else {
        alert("Could not send message");
      }
    } catch {
      alert("Could not connect to the server");
    } finally {
      setSending(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem(
      "content"
    ) as HTMLInputElement;
    if (!input) return;
    const content = input.value;
    input.value = "";
    sendMessage(content);
  }

  function timeLabel(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Build the message list with date dividers inserted between days.
  const rendered: React.ReactNode[] = [];
  let lastDay: string | null = null;

  messages.forEach((msg) => {
    const key = dayKey(msg.createdAt);
    if (key !== lastDay) {
      lastDay = key;
      rendered.push(
        <div key={"day-" + key} className="flex justify-center py-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
            {dayLabel(msg.createdAt)}
          </span>
        </div>
      );
    }
    rendered.push(
      msg.isMine ? (
        <div key={msg.id} className="flex justify-end">
          <div className="max-w-[75%]">
            <p className="mb-1 text-right text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              You · {timeLabel(msg.createdAt)}
            </p>
            <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-purple-600 px-4 py-2.5 text-xs leading-relaxed text-white shadow-sm">
              {msg.content}
            </div>
          </div>
        </div>
      ) : (
        <div key={msg.id} className="flex items-end justify-start gap-2">
          <div
            className={
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white " +
              avatarColor(msg.senderName)
            }
          >
            {(msg.senderName || "F").charAt(0).toUpperCase()}
          </div>
          <div className="max-w-[75%]">
            <p className="mb-1 text-left text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {msg.senderName} · {timeLabel(msg.createdAt)}
            </p>
            <div className="rounded-2xl rounded-bl-md border border-border bg-white/90 px-4 py-2.5 text-xs leading-relaxed text-slate-700 dark:bg-slate-800/90 dark:text-slate-200">
              {msg.content}
            </div>
          </div>
        </div>
      )
    );
  });

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Messages — only this scrolls */}
      <div
        ref={scrollBoxRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            No messages yet — say hello to the {familyName}.
          </p>
        ) : (
          rendered
        )}
      </div>

      {/* Input — fixed at bottom of screen */}
      <form
        onSubmit={handleFormSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-border bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 p-3"
      >
        <input
          name="content"
          placeholder="Type a message..."
          autoComplete="off"
          className="flex-1 rounded-xl border border-border bg-white dark:bg-slate-900 px-4 py-2.5 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
