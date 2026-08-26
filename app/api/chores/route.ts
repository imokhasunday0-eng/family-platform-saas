import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { notifyFamilyMembers } from "@/lib/notifications";

async function getContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership) return null;

  return {
    session,
    membership,
  };
}

// Create a chore
export async function POST(req: Request) {
  const ctx = await getContext();

  if (!ctx) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const title = String(body.title || "").trim();

  if (!title) {
    return NextResponse.json(
      { error: "Title required" },
      { status: 400 }
    );
  }

  const points = Math.max(
    1,
    Math.min(100, Number(body.points) || 10)
  );

  const assignedToId = body.assignedToId
    ? String(body.assignedToId)
    : null;

  const dueDate = body.dueDate
    ? new Date(`${body.dueDate}T12:00`)
    : null;

  let assigneeUserId: string | null = null;

  if (assignedToId) {
    const member = await prisma.familyMember.findUnique({
      where: { id: assignedToId },
    });

    if (!member || member.familyId !== ctx.membership.familyId) {
      return NextResponse.json(
        { error: "Invalid assignee" },
        { status: 400 }
      );
    }

    assigneeUserId = member.userId;
  }

  const chore = await prisma.chore.create({
    data: {
      familyId: ctx.membership.familyId,
      title,
      points,
      assignments: assigneeUserId
        ? {
            create: {
              userId: assigneeUserId,
              dueDate,
            },
          }
        : undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    id: chore.id,
  });
}

// Complete a chore
export async function PATCH(req: Request) {
  const ctx = await getContext();

  if (!ctx) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const id = String(body.id || "");

  if (!id) {
    return NextResponse.json(
      { error: "id required" },
      { status: 400 }
    );
  }

  const chore = await prisma.chore.findFirst({
    where: {
      id,
      familyId: ctx.membership.familyId,
    },
    include: {
      assignments: true,
    },
  });

  if (!chore) {
    return NextResponse.json(
      { error: "Chore not found" },
      { status: 404 }
    );
  }

  // Assigned chore
  if (chore.assignments.length > 0) {
    const assignment = chore.assignments[0];

    if (assignment.completedAt) {
      return NextResponse.json({
        ok: true,
        alreadyCompleted: true,
      });
    }

    await prisma.choreAssignment.update({
      where: {
        id: assignment.id,
      },
      data: {
        completedAt: new Date(),
      },
    });

    await prisma.familyMember.update({
      where: {
        userId_familyId: {
          userId: assignment.userId,
          familyId: ctx.membership.familyId,
        },
      },
      data: {
        points: {
          increment: chore.points,
        },
      },
    });
  }

  // Notify the family after successful completion.
  // The notification helper currently sends to all family members.
  try {
    await notifyFamilyMembers({
      familyId: ctx.membership.familyId,
      title: "Chore completed",
      body: `${chore.title} was completed and ${chore.points} points were awarded.`,
    });
  } catch (error) {
    // Notification failure must never prevent chore completion.
    console.error("Notification creation failed:", error);
  }

  return NextResponse.json({
    ok: true,
  });
}
