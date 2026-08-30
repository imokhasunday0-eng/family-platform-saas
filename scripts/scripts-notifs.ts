import { PrismaClient } from "./generated/prisma";
const prisma = new PrismaClient();

async function main() {
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { user: { select: { email: true } } },
  });
  for (const n of notifs) {
    console.log(
      n.createdAt.toISOString() +
      " | to=" + (n.user.email || n.userId) +
      " | " + n.title +
      " | read=" + (n.readAt ? "yes" : "NO")
    );
  }
  await prisma.$disconnect();
}
main();
