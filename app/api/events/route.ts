import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { notifyFamilyMembers } from "@/lib/notifications";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership)
    return NextResponse.json({ error: "No family" }, { status: 403 });

  const body = await req.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const dateStr = String(body.date); // yyyy-mm-dd
  const time = body.time ? String(body.time) : null;
  const startsAt = time
    ? new Date(dateStr + "T" + time)
    : new Date(`${dateStr}T12:00`);
  if (isNaN(startsAt.getTime()))
    return NextResponse.json({ error: "Invalid date or time" }, { status: 400 });

  await prisma.calendarEvent.create({
    data: {
      familyId: membership.familyId,
      title,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
      allDay: !time,
      location: body.location ? String(body.location) : null,
    },
  });

  await notifyFamilyMembers({
    familyId: membership.familyId,
    excludeUserId: session.user.id,
    title: "New family event",
    body: `${title} was added to the family calendar.`,
  });

  return NextResponse.json({ ok: true });
}

