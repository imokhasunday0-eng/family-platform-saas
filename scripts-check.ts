import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const members = await prisma.familyMember.findMany({
    include: {
      user: { select: { email: true } },
      family: { select: { id: true, name: true } },
    },
  });
  console.log("=== FAMILY MEMBERS (" + members.length + ") ===");
  for (const m of members) {
    console.log(
      "family=" + m.family.name +
      " | familyId=" + m.familyId +
      " | user=" + (m.user.email || m.userId) +
      " | role=" + m.role
    );
  }
  const invites = await prisma.invitation.findMany({
    include: { family: { select: { name: true } } },
  });
  console.log("=== INVITATIONS (" + invites.length + ") ===");
  for (const i of invites) {
    console.log(
      "family=" + i.family.name +
      " | invited=" + i.email +
      " | role=" + i.role +
      " | accepted=" + (i.acceptedAt ? i.acceptedAt.toISOString() : "PENDING")
    );
  }
  await prisma.$disconnect();
}
main();
