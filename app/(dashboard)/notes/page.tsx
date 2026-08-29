import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { NotesView } from "@/components/notes-view";

export default async function NotesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;

  const notes = await prisma.note.findMany({
    where: { familyId: membership.familyId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: { todos: true },
  });

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 md:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600/70">
          Shared space
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
          Family notes
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Tap a note to open it, edit it, or add a to-do list.
        </p>

        <div className="mt-6">
          <NotesView
            notes={notes.map((n) => ({
              id: n.id,
              title: n.title,
              content: n.content,
              category: n.category,
              pinned: n.pinned,
              todoTotal: n.todos.length,
              todoDone: n.todos.filter((t) => t.done).length,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
