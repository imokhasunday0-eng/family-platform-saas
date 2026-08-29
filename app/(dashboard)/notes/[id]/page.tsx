import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { NoteDetail } from "@/components/note-detail";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;

  const note = await prisma.note.findFirst({
    where: { id, familyId: membership.familyId },
    include: {
      user: { select: { name: true } },
      todos: { orderBy: { position: "asc" } },
    },
  });

  if (!note) notFound();

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-7 sm:px-6 md:py-10">
        <NoteDetail
          note={{
            id: note.id,
            title: note.title,
            content: note.content,
            category: note.category,
            pinned: note.pinned,
            authorName: note.user.name || "Family",
            updatedAt: note.updatedAt.toISOString(),
            todos: note.todos.map((t) => ({
              id: t.id,
              content: t.content,
              done: t.done,
            })),
          }}
        />
      </div>
    </main>
  );
}
