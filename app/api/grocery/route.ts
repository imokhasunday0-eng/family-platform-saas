import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { notifyFamilyMembers } from "@/lib/notifications";

async function getContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;

  return membership;
}

async function getOrCreateList(familyId: string) {
  let list = await prisma.groceryList.findFirst({
    where: { familyId },
  });
  if (!list) {
    list = await prisma.groceryList.create({
      data: { familyId },
    });
  }
  return list;
}

// Add item
export async function POST(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name)
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const list = await getOrCreateList(membership.familyId);

  await prisma.groceryItem.create({
    data: {
      listId: list.id,
      name,
      quantity: body.quantity ? String(body.quantity) : null,
      category: body.category ? String(body.category) : null,
    },
  });

  await notifyFamilyMembers({
    familyId: membership.familyId,
    excludeUserId: membership.userId,
    title: "Grocery item added",
    body: `${name} was added to the grocery list.`,
  });

  return NextResponse.json({ ok: true });
}

// Toggle purchased
export async function PATCH(req: Request) {
  const membership = await getContext();

  if (!membership)
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );

  const body = await req.json();
  const id = String(body.id || "");

  if (!id)
    return NextResponse.json(
      { error: "id required" },
      { status: 400 }
    );

  // Verify item belongs to this family's list
  const item = await prisma.groceryItem.findFirst({
    where: {
      id,
      list: { familyId: membership.familyId },
    },
  });

  if (!item)
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );

  const purchased = Boolean(body.purchased);

  await prisma.groceryItem.update({
    where: { id },
    data: { purchased },
  });

  await notifyFamilyMembers({
    familyId: membership.familyId,
    excludeUserId: membership.userId,
    title: purchased
      ? "Grocery item purchased"
      : "Grocery item unchecked",
    body: purchased
      ? `${item.name} was marked as purchased.`
      : `${item.name} was marked as not purchased.`,
  });

  return NextResponse.json({ ok: true });
}

// Delete item

export async function DELETE(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  const item = await prisma.groceryItem.findFirst({
    where: { id, list: { familyId: membership.familyId } },
  });
  if (!item)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.groceryItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

