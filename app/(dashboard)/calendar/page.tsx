import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar-view";

export default async function CalendarPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
    include: { family: true },
  });
  if (!membership) return null;
  const familyName = membership.family.name;

  const events = await prisma.calendarEvent.findMany({
    where: { familyId: membership.familyId },
    orderBy: { startsAt: "asc" },
  });

  const serialized = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    startsAt: ev.startsAt.toISOString(),
    allDay: ev.allDay,
    location: ev.location,
  }));

  const now = new Date();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  const todayKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 md:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          Calendar
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Family schedule
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Tap a day to see its events. Tap + to add something new.
        </p>

        <div className="mt-6">
          <CalendarView events={serialized} todayKey={todayKey} familyName={familyName} />
        </div>
      </div>
    </main>
  );
}

