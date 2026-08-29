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
    ? new Date(String(body.dueDate) + "T12:00")
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

  // Notify the assignee that a chore was assigned to them.
  if (assigneeUserId && assigneeUserId !== ctx.session.user.id) {
    try {
      await prisma.notification.create({
        data: {
          userId: assigneeUserId,
          title: "You have been assigned a chore",
          body:
            title +
            " - " +
            points +
            " points. Check your chores page for details.",
          link: "/chores",
          channel: "in_app",
        },
      });
    } catch (error) {
      console.error("Notification creation failed:", error);
    }
  }

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

  // Assigned chore: mark the assignment complete and award points.
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
  } else {
    // Unassigned chore: the person completing it gets an assignment
    // record with the completion date, and earns the points.
    await prisma.choreAssignment.create({
      data: {
        choreId: chore.id,
        userId: ctx.session.user.id,
        completedAt: new Date(),
      },
    });

    await prisma.familyMember.update({
      where: {
        userId_familyId: {
          userId: ctx.session.user.id,
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
  try {
    await notifyFamilyMembers({
      familyId: ctx.membership.familyId,
      title: "Chore completed",
      body:
        chore.title +
        " was completed and " +
        chore.points +
        " points were awarded.",
    });
  } catch (error) {
    console.error("Notification creation failed:", error);
  }

  return NextResponse.json({
    ok: true,
  });
}

// Delete a chore (only completed chores can be deleted)
export async function DELETE(req: Request) {
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

  const isCompleted =
    chore.assignments.length > 0 &&
    chore.assignments[0].completedAt !== null;

  if (!isCompleted) {
    return NextResponse.json(
      { error: "Only completed chores can be deleted" },
      { status: 400 }
    );
  }

  await prisma.chore.delete({
    where: { id: chore.id },
  });

  return NextResponse.json({ ok: true });
}
