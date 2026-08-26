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
  return { userId: session.user.id, membership };
}

// GET: family info + members
export async function GET() {
  const ctx = await getContext();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const family = await prisma.family.findUnique({
    where: { id: ctx.membership.familyId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { role: "asc" },
      },
      invitations: {
        where: { acceptedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return NextResponse.json(family);
}

// POST: create an invitation
export async function POST(req: Request) {
  const ctx = await getContext();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const role = ["OWNER", "ADMIN", "MEMBER", "CHILD"].includes(body.role)
    ? body.role
    : "MEMBER";
  if (!email.includes("@"))
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });

  const existing = await prisma.invitation.findFirst({
    where: { familyId: ctx.membership.familyId, email, acceptedAt: null },
  });
  if (existing) return NextResponse.json(existing);

  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const invite = await prisma.invitation.create({
    data: { familyId: ctx.membership.familyId, email, role, token },
  });

  await notifyFamilyMembers({
    familyId: ctx.membership.familyId,
    excludeUserId: ctx.userId,
    title: "New family invitation",
    body: `${email} was invited to join the family as ${role}.`,
  });

  return NextResponse.json(invite);
}

// PATCH: rename family (owner/admin only)
export async function PATCH(req: Request) {
  const ctx = await getContext();
  if (!ctx || !["OWNER", "ADMIN"].includes(ctx.membership.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const family = await prisma.family.update({
    where: { id: ctx.membership.familyId },
    data: { name },
  });
  return NextResponse.json(family);
}
