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

// Add a to-do item to a note
export async function POST(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const noteId = String(body.noteId || "");
  const content = String(body.content || "").trim();

  if (!noteId || !content)
    return NextResponse.json(
      { error: "noteId and content required" },
      { status: 400 }
    );

  const note = await prisma.note.findFirst({
    where: { id: noteId, familyId: membership.familyId },
  });
  if (!note)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const count = await prisma.noteTodo.count({ where: { noteId } });

  const todo = await prisma.noteTodo.create({
    data: { noteId, content, position: count },
  });

  return NextResponse.json({
    ok: true,
    todo: { id: todo.id, content: todo.content, done: todo.done },
  });
}

// Toggle a to-do item done/undone
export async function PATCH(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  const todo = await prisma.noteTodo.findFirst({
    where: { id, note: { familyId: membership.familyId } },
  });
  if (!todo)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.noteTodo.update({
    where: { id },
    data: { done: Boolean(body.done) },
  });

  return NextResponse.json({ ok: true });
}

// Delete a to-do item
export async function DELETE(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  const todo = await prisma.noteTodo.findFirst({
    where: { id, note: { familyId: membership.familyId } },
  });
  if (!todo)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.noteTodo.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
