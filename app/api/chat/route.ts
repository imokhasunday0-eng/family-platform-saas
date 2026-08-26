import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";

async function getContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;

  return membership;
}

// Send a message
export async function POST(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const content = String(body.content || "").trim();
  const conversationId = String(body.conversationId || "");

  if (!content)
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  if (!conversationId)
    return NextResponse.json(
      { error: "conversationId required" },
      { status: 400 }
    );

  // Security: conversation must belong to this family
  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, familyId: membership.familyId },
  });
  if (!convo)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.message.create({
    data: {
      conversationId,
      userId: membership.userId,
      content,
    },
  });

  return NextResponse.json({ ok: true });
}

