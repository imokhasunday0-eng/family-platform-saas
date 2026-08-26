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

  await prisma.note.create({
    data: {
      familyId: membership.familyId,
      userId: membership.userId,
      title,
      content,
      category: body.category ? String(body.category).trim() : null,
    },
  });

  return NextResponse.json({ ok: true });
}

// Delete a note (family-scoped so nobody touches another family's notes)
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

