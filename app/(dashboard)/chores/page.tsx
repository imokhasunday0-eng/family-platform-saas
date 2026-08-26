import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { ChoresView } from "@/components/chores-view";

export default async function ChoresPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
    include: { family: true },
  });
  if (!membership) return null;

  const [chores, members] = await Promise.all([
    prisma.chore.findMany({
      where: { familyId: membership.familyId },
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.familyMember.findMany({
      where: { familyId: membership.familyId },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const serialized = chores.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    points: c.points,
    completedAt: c.assignments[0]?.completedAt ?? null,
    dueDate: c.assignments[0]?.dueDate?.toISOString() ?? null,
    assignedToName: c.assignments[0]?.user.name ?? null,
  }));

  const memberList = members.map((m) => ({
    id: m.id,
    name: m.user.name,
    role: m.role,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 md:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          Chores
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Family responsibilities
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Tap the circle to mark a chore done — points are awarded automatically!
        </p>

        <div className="mt-6">
          <ChoresView chores={serialized} members={memberList} />
        </div>
      </div>
    </main>
  );
}

