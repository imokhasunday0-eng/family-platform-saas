import { PrismaClient } from "./generated/prisma";
const prisma = new PrismaClient();

async function main() {
  // find accepted invites whose invitee has NO member row in that family
  const invites = await prisma.invitation.findMany({
    where: { acceptedAt: { not: null } },
  });
  for (const i of invites) {
    const user = await prisma.user.findFirst({ where: { email: i.email } });
    if (!user) { console.log("no user account for " + i.email); continue; }
    const existing = await prisma.familyMember.findFirst({
      where: { userId: user.id, familyId: i.familyId },
    });
    if (existing) { console.log(i.email + " already a member"); continue; }
    await prisma.familyMember.create({
      data: { userId: user.id, familyId: i.familyId, role: i.role },
    });
    console.log("repaired: " + i.email + " added to family " + i.familyId);
  }
  await prisma.$disconnect();
}
main();
