"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  senderName: string;
};

export function ChatView({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: ChatMessage[];
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

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem(
      "content"
    ) as HTMLInputElement;
    const content = input.value.trim();
    if (!content) return;
    input.value = "";
    setSending(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, conversationId }),
    });
    setSending(false);
    if (res.ok) {
      setMessages((prev) => [
        ...prev,
        {
          id: "tmp-" + Date.now(),
          content,
          createdAt: new Date().toISOString(),
          isMine: true,
          senderName: "You",
        },
      ]);
    } else {
      alert("Could not send message");
    }
  }

  function timeLabel(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white dark:bg-slate-900">
      {/* Messages — only this scrolls */}
      <div
        ref={scrollBoxRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            No messages yet. Say hi to your family! 👋
          </p>
        ) : (
          messages.map((msg) =>
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
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[75%]">
                  <p className="mb-1 text-left text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    {msg.senderName} · {timeLabel(msg.createdAt)}
                  </p>
                  <div className="rounded-2xl rounded-bl-md border border-border bg-slate-50 px-4 py-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Input — fixed at bottom of screen */}
      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-white dark:bg-slate-900 p-3">
        <input
          name="content"
          placeholder="Type a message..."
          autoComplete="off"
          className="flex-1 rounded-xl border border-border bg-white dark:bg-slate-900 px-4 py-2.5 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
        <button
          type="button"
          onClick={(e) => {
            const input = e.currentTarget.parentElement?.querySelector("input");
            if (!input || !input.value.trim()) return;
            const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent<HTMLFormElement>;
            // reuse sendMessage logic by simulating submit on the input's container
            const content = input.value;
            fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content, conversationId }),
            }).then((res) => {
              if (res.ok) {
                setMessages((prev) => [
                  ...prev,
                  { id: "tmp-" + Date.now(), content, createdAt: new Date().toISOString(), isMine: true, senderName: "You" },
                ]);
                input.value = "";
              }
            });
          }}
          disabled={sending}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

