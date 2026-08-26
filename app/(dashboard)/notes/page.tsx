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
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-100 to-orange-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 md:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600/70">
          Shared space
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
          Family notes
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Sticky notes for the whole family — reminders, ideas, shopping lists.
        </p>

        <div className="mt-6">
          <NotesView
            notes={notes.map((n) => ({
              id: n.id,
              title: n.title,
              content: n.content,
              category: n.category,
            }))}
          />
        </div>
      </div>
    </main>
  );
}

