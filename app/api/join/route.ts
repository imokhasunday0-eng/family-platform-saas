import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { notifyFamilyMembers } from "@/lib/notifications";

// GET: preview invite (family name)
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { error: "Invitation token is required" },
      { status: 400 }
    );
  }

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { family: true },
  });
  if (!invite || invite.acceptedAt)
    return NextResponse.json({ error: "Invalid or used invite" }, { status: 404 });
  return NextResponse.json({ familyName: invite.family.name, email: invite.email });
}

// POST: accept invite -> become FamilyMember
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json({ error: "Please log in first" }, { status: 401 });

  const body = await req.json();
  const invite = await prisma.invitation.findUnique({ where: { token: String(body.token) } });
  if (!invite || invite.acceptedAt)
    return NextResponse.json({ error: "Invalid or already used" }, { status: 404 });

  await prisma.familyMember.upsert({
    where: { userId_familyId: { userId: session.user.id, familyId: invite.familyId } },
    update: {},
    create: { userId: session.user.id, familyId: invite.familyId, role: invite.role },
  });
  await prisma.invitation.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  await notifyFamilyMembers({
    familyId: invite.familyId,
    excludeUserId: session.user.id,
    title: "New family member",
    body: `${session.user.name || session.user.email} joined the family.`,
  });

  return NextResponse.json({ ok: true });
}
