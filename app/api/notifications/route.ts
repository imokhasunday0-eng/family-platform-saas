import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return NextResponse.json({
    notifications,
    unreadCount,
  });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();

  if (body.all === true) {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ success: true });
  }

  if (typeof body.id !== "string") {
    return NextResponse.json(
      { error: "Notification id is required" },
      { status: 400 }
    );
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: body.id,
      userId: session.user.id,
    },
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  await prisma.notification.update({
    where: {
      id: notification.id,
    },
    data: {
      read: true,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.all === true) {
    await prisma.notification.deleteMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ success: true });
  }

  if (typeof body.id !== "string") {
    return NextResponse.json(
      { error: "Notification id is required" },
      { status: 400 }
    );
  }

  await prisma.notification.deleteMany({
    where: { id: body.id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
