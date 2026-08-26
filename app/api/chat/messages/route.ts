import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";

// Fetch messages newer than what the client already has
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return NextResponse.json([], { status: 401 });

  const body = await req.json().catch(() => ({}));
  const conversationId = String(body.conversationId || "");
  const skipCount = Number(body.after || 0);

  if (!conversationId) return NextResponse.json([]);

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, familyId: membership.familyId },
  });
  if (!convo) return NextResponse.json([]);

  const all = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  // Only return messages the client doesn't have yet
  const fresh = all.slice(skipCount).map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    isMine: m.userId === session.user.id,
    senderName: m.user.name || "Family",
  }));

  return NextResponse.json(fresh);
}

