import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
    select: { familyId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  const settings = await prisma.settings.findUnique({
    where: { familyId: membership.familyId },
  });

  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
    select: { familyId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  const body = await request.json();

  const allowedFields = [
    "notificationsInApp",
    "notificationsEmail",
    "notificationsPush",
    "eventReminders",
    "choreReminders",
    "mealReminders",
    "groceryReminders",
    "budgetAlerts",
  ] as const;

  const data: Partial<Record<(typeof allowedFields)[number], boolean>> = {};

  for (const field of allowedFields) {
    if (typeof body[field] === "boolean") {
      data[field] = body[field];
    }
  }

  const settings = await prisma.settings.update({
    where: { familyId: membership.familyId },
    data,
  });

  return NextResponse.json(settings);
}
