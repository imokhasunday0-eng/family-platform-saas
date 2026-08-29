import { prisma } from "@/lib/prisma";

export async function notifyFamilyMembers({
  familyId,
  excludeUserId,
  title,
  body,
  link,
}: {
  familyId: string;
  excludeUserId?: string;
  title: string;
  body?: string;
  link?: string;
}) {
  const members = await prisma.familyMember.findMany({
    where: {
      familyId,
    },
    select: {
      userId: true,
    },
  });

  // Filter out the person who triggered the action (if requested),
  // but only if other members would still receive it.
  const targets = excludeUserId
    ? members.filter((m) => m.userId !== excludeUserId)
    : members;

  const finalTargets =
    targets.length > 0
      ? targets
      : members.filter((m) => m.userId === excludeUserId);

  if (finalTargets.length === 0) return;

  await prisma.notification.createMany({
    data: finalTargets.map((member) => ({
      userId: member.userId,
      title,
      body: body ?? null,
      link: link ?? null,
      channel: "in_app",
    })),
  });
}

export async function notifyUser({
  userId,
  title,
  body,
  link,
}: {
  userId: string;
  title: string;
  body?: string;
  link?: string;
}) {
  await prisma.notification.create({
    data: {
      userId,
      title,
      body: body ?? null,
      link: link ?? null,
      channel: "in_app",
    },
  });
}
