import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { ChatView } from "@/components/chat-view";
export const viewport = { interactiveWidget: "resizes-content" };

export default async function ChatPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;

  let convo = await prisma.conversation.findFirst({
    where: { familyId: membership.familyId },
    orderBy: { createdAt: "desc" },
  });
  if (!convo) {
    convo = await prisma.conversation.create({
      data: { familyId: membership.familyId },
    });
  }

  const rows = await prisma.message.findMany({
    where: { conversationId: convo.id },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  const messages = rows.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    isMine: m.userId === session.user.id,
    senderName: m.user.name || "Family",
  }));

    return (
    <main className="-mb-24 md:-mb-10">
      <div className="flex h-[calc(100dvh-68px)] flex-col overflow-hidden rounded-b-none border border-border bg-white shadow-sm">
        {/* Slim header */}
        <div className="shrink-0 border-b border-border px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-black">
            Family chat 💬
          </h1>
        </div>

        {/* Chat fills everything between header and screen bottom */}
        <div className="min-h-0 flex-1">
          <ChatView conversationId={convo.id} initialMessages={messages} />
        </div>
      </div>
    </main>
  );
}

