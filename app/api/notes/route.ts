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

// Create a note
export async function POST(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();

  if (!title)
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  if (!content)
    return NextResponse.json({ error: "Content required" }, { status: 400 });

  const note = await prisma.note.create({
    data: {
      familyId: membership.familyId,
      userId: membership.userId,
      title,
      content,
      category: body.category ? String(body.category).trim() : null,
    },
  });

  return NextResponse.json({ ok: true, id: note.id });
}

// Edit a note (title, content, category, pinned)
export async function PATCH(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.note.findFirst({
    where: { id, familyId: membership.familyId },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: {
    title?: string;
    content?: string;
    category?: string | null;
    pinned?: boolean;
  } = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title)
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    data.title = title;
  }

  if (body.content !== undefined) {
    const content = String(body.content).trim();
    if (!content)
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    data.content = content;
  }

  if (body.category !== undefined) {
    data.category = body.category ? String(body.category).trim() : null;
  }

  if (body.pinned !== undefined) {
    data.pinned = Boolean(body.pinned);
  }

  await prisma.note.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true });
}

// Delete a note
export async function DELETE(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.note.findFirst({
    where: { id, familyId: membership.familyId },
  });
  if (!existing) return NextResponse.json({ ok: true });

  await prisma.note.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
