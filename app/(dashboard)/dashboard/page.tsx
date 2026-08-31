import { familyDisplayName } from "@/lib/family-name";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  Plus,
  ShoppingCart,
  Utensils,
} from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";

import { OverviewCard } from "@/components/cards/overview-card";
import { AnimatedGrid, AnimatedItem } from "@/components/animated-grid";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  let membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
    include: { family: true },
  });

  if (!membership) {
    const family = await prisma.family.create({
      data: { name: `${session.user.name.split(" ").pop()}'s Family` },
    });
    membership = await prisma.familyMember.create({
      data: {
        userId: session.user.id,
        familyId: family.id,
        role: "OWNER",
      },
      include: { family: true },
    });
    await prisma.settings.create({
      data: { familyId: family.id, timezone: "Africa/Lagos", currency: "NGN" },
    });
  }

  // ---------- Dates ----------
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // ---------- Real data ----------
  const [eventsToday, mealsToday, pendingAssignments, groceryLeft, budgetAgg, messageCount, recentNotes] =
    await Promise.all([
      prisma.calendarEvent.findMany({
        where: {
          familyId: membership.familyId,
          startsAt: { gte: startOfDay, lt: endOfDay },
        },
        orderBy: { startsAt: "asc" },
        take: 5,
      }),
      prisma.mealPlan.findMany({
        where: {
          familyId: membership.familyId,
          date: { gte: startOfDay, lt: endOfDay },
        },
        orderBy: { date: "asc" },
        include: { recipe: true },
      }),
      prisma.choreAssignment.findMany({
        where: { completedAt: null, chore: { familyId: membership.familyId } },
        orderBy: { dueDate: "asc" },
        take: 4,
        include: { chore: true, user: true },
      }),
      prisma.groceryItem.count({
        where: { purchased: false, list: { familyId: membership.familyId } },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          budget: { familyId: membership.familyId },
          date: { gte: startOfMonth },
        },
      }),
      prisma.message.count({
        where: { conversation: { familyId: membership.familyId } },
      }),
      prisma.note.findMany({
        where: { familyId: membership.familyId },
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        take: 3,
        include: { user: true },
      }),
    ]);

  const choresPending = await prisma.choreAssignment.count({
    where: { completedAt: null, chore: { familyId: membership.familyId } },
  });

  const mealPlans = await prisma.mealPlan.count({
    where: { familyId: membership.familyId, date: { gte: startOfDay } },
  });

  const monthSpent = Number(budgetAgg._sum.amount ?? 0);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const modules = [
    {
      title: "Today's Events",
      primary: eventsToday.length
        ? (eventsToday[0].allDay
            ? "All day"
            : formatTime(eventsToday[0].startsAt))
          + " \u00b7 " + eventsToday[0].title
          + (eventsToday.length > 1 ? " +" + (eventsToday.length - 1) + " more" : "")
        : "Your day is clear",
      secondary: eventsToday.length ? "Today" : "Nothing scheduled yet.",
      href: "/calendar",
    },
    {
      title: "Meal Planner",
      primary: mealsToday[0]
        ? (mealsToday[0].recipe ? mealsToday[0].recipe.title : "A meal is planned")
        : "No meals planned",
      secondary: mealsToday[0] ? "Tonight" : "Plan tonight's dinner.",
      href: "/meal-planner",
    },
    {
      title: "Pending Chores",
      primary: choresPending ? choresPending + " remaining" : "All caught up",
      secondary: choresPending
        ? "Waiting for the family"
        : "Nothing waiting for the family.",
      href: "/chores",
    },
    {
      title: "Grocery List",
      primary: groceryLeft
        ? groceryLeft + (groceryLeft === 1 ? " item" : " items")
        : "Your list is clear",
      secondary: groceryLeft ? "To pick up" : "Nothing to pick up.",
      href: "/grocery",
    },
    {
      title: "Budget",
      primary: "\u20a6" + monthSpent.toLocaleString(),
      secondary: "Spent this month",
      href: "/budget",
    },
    {
      title: "Family Chat",
      primary: messageCount
        ? messageCount + (messageCount === 1 ? " message" : " messages")
        : "Start the conversation",
      secondary: messageCount ? "In family chat" : "Say hello to the family.",
      href: "/chat",
    },
  ];

  const firstName = session.user.name?.split(" ")[0] || "there";
  const hour = now.getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";
  else if (hour < 5) greeting = "Up late?";

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const MEAL_EMOJI: Record<string, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snack: "🍎",
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 md:px-8 md:py-10">
        {/* ═══════════ LEVEL 1: HERO ═══════════ */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-900 px-6 py-7 text-white shadow-[0_8px_30px_rgba(79,70,229,0.18)] sm:px-8 sm:py-9">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {familyDisplayName(membership.family.name)}
            </h1>
            <p className="mt-1 text-lg font-semibold text-indigo-100">
              {greeting}.
            </p>

            <p className="mt-3 text-sm leading-6 text-indigo-200">
              Plan your family&apos;s day, all in one place.
            </p>

            <div className="mt-5 flex items-center gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200/90">
                {dateLabel}
              </p>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-indigo-100 underline-offset-4 transition hover:text-white hover:underline"
              >
                View calendar →
              </Link>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8 -bottom-36 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-24 top-10 h-56 w-56 rounded-full bg-gradient-to-br from-fuchsia-300/15 to-transparent blur-2xl" />
        </section>

        {/* ═══════════ LEVEL 2: QUICK STATS ═══════════ */}
        <section className="mt-10 sm:mt-12">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              Quick access
            </p>
            <h2 className="mt-1.5 text-xl font-bold tracking-[-0.02em] text-slate-900 dark:text-slate-100">
              Family workspace
            </h2>
          </div>

          <AnimatedGrid className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            {modules.map((module) => (
              <AnimatedItem key={module.title}>
                <OverviewCard {...module} />
              </AnimatedItem>
            ))}
          </AnimatedGrid>
        </section>

        {/* ═══════════ LEVEL 3: TODAY + SIDE COLUMN ═══════════ */}
        <section className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          {/* Today — wide card */}
          <div className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur transition hover:shadow-lg dark:border-white/10 dark:bg-slate-900/85 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Today
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">
                  Your family schedule
                </h2>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                See calendar
              </Link>
            </div>

            <div className="mt-5 space-y-2">
              {/* Real events */}
              {eventsToday.length === 0 ? (
                <div className="flex items-center gap-4 rounded-xl border border-dashed border-indigo-200 p-3.5 dark:border-indigo-900">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      No events scheduled today
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      Add an event to start building your family schedule.
                    </p>
                  </div>
                </div>
              ) : (
                eventsToday.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-4 rounded-xl bg-indigo-50/60 p-3.5 dark:bg-indigo-950/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {ev.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {ev.allDay ? "All day" : formatTime(ev.startsAt)}
                        </span>
                        {ev.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {ev.location}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Real meals today */}
              {mealsToday.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center gap-4 rounded-xl bg-amber-50/60 p-3.5 dark:bg-amber-950/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-base shadow-sm dark:bg-slate-900">
                    {MEAL_EMOJI[meal.mealType] || "🍽️"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {meal.recipe?.title || `${meal.mealType} planned`}
                    </p>
                    <p className="mt-0.5 text-[11px] capitalize text-slate-500 dark:text-slate-400">
                      {meal.mealType}
                    </p>
                  </div>
                </div>
              ))}

              {/* Real pending chores */}
              {pendingAssignments.length > 0 && (
                <>
                  <p className="pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    Chores waiting
                  </p>
                  {pendingAssignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 rounded-xl bg-violet-50/60 p-3.5 dark:bg-violet-950/30"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm dark:bg-slate-900 dark:text-violet-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {a.chore.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {a.user.name || "Unassigned"}
                          {a.dueDate && ` · due ${a.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                          {a.chore.points > 0 && ` · ⭐ ${a.chore.points}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Side column */}
          <div className="space-y-4">
            {/* Essentials */}
            <div className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur transition hover:shadow-lg dark:border-white/10 dark:bg-slate-900/85 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                Get organized
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">
                Start with the essentials
              </h2>

              <div className="mt-5 space-y-2">
                <Link
                  href="/meal-planner"
                  className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Plan this week&apos;s meals
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                </Link>
                <Link
                  href="/grocery"
                  className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Create a grocery list
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                </Link>
                <Link
                  href="/chores"
                  className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-violet-50 dark:hover:bg-violet-950/30"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Assign chores
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                </Link>
              </div>
            </div>

            {/* Recent notes */}
            <div className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur transition hover:shadow-lg dark:border-white/10 dark:bg-slate-900/85 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Notes
                </p>
                <Link
                  href="/notes"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  All notes
                </Link>
              </div>

              {recentNotes.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-3 text-center text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  No notes yet — jot down your first one 📝
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {recentNotes.map((note) => (
                    <Link
                      key={note.id}
                      href={`/notes/${note.id}`}
                      className="block rounded-xl bg-slate-50 p-3 transition hover:bg-amber-50 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                    >
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {note.pinned && "📌 "}
                        {note.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">
                        {note.user.name || "Someone"} ·{" "}
                        {new Date(note.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
