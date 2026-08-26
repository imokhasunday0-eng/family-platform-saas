import { prisma } from "@/lib/prisma";

export async function notifyFamilyMembers({
  familyId,
  excludeUserId,
  title,
  body,
}: {
  familyId: string;
  excludeUserId?: string;
  title: string;
  body?: string;
}) {
  const members = await prisma.familyMember.findMany({
    where: {
      familyId,
    },
    select: {
      userId: true,
    },
  });

  if (members.length === 0) return;

  await prisma.notification.createMany({
    data: members.map((member) => ({
      userId: member.userId,
      title,
      body: body ?? null,
      channel: "in_app",
    })),
  });
}

export async function notifyUser({
  userId,
  title,
  body,
}: {
  userId: string;
  title: string;
  body?: string;
}) {
  await prisma.notification.create({
    data: {
      userId,
      title,
      body: body ?? null,
      channel: "in_app",
    },
  });
}
