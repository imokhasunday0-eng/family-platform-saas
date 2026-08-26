import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
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
      data: { name: `${session.user.name}'s Family` },
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
      data: {
        familyId: family.id,
        timezone: "Africa/Lagos",
        currency: "NGN",
      },
    });
  }

  // ---------- Real data ----------
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [eventsToday, mealPlans, choresPending, groceryLeft, budgetAgg, messages] =
    await Promise.all([
      prisma.calendarEvent.count({
        where: {
          familyId: membership.familyId,
          startsAt: { gte: startOfDay, lt: endOfDay },
        },
      }),
      prisma.mealPlan.count({
        where: { familyId: membership.familyId, date: { gte: startOfDay } },
      }),
      prisma.choreAssignment.count({
        where: { completedAt: null, chore: { familyId: membership.familyId } },
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
    ]);

  const monthSpent = Number(budgetAgg._sum.amount ?? 0);


  const modules = [
    { title: "Today's Events", value: eventsToday + (eventsToday === 1 ? " event today" : " events today"), href: "/calendar" },
    { title: "Meal Planner", value: mealPlans + (mealPlans === 1 ? " meal planned" : " meals planned"), href: "/meal-planner" },
    { title: "Pending Chores", value: choresPending + (choresPending === 1 ? " chore to do" : " chores to do"), href: "/chores" },
    { title: "Grocery List", value: groceryLeft + (groceryLeft === 1 ? " item left" : " items left"), href: "/grocery" },
    { title: "Budget", value: `Spent ${monthSpent.toLocaleString()} this month`, href: "/budget" },
    { title: "Family Chat", value: messages + (messages === 1 ? " message" : " messages"), href: "/chat" },
  ];

  const firstName = session.user.name?.split(" ")[0] || "there";

  const hour = now.getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";
  else if (hour < 5) greeting = "Up late?";

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 md:px-8 md:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-7 text-white shadow-[0_18px_45px_rgba(99,102,241,0.35)] sm:px-8 sm:py-9">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo sm:text-4xl">
              {membership.family.name}
            </h1>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-indigo-100 sm:text-2xl">
              {greeting}.
            </h2>



            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-200">
              Keep your family's schedule, meals, chores, shopping and finances
              organized in one place.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/calendar"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" />
                Add something
              </Link>

              <Link
                href="/calendar"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                View calendar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8 -bottom-36 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-24 top-10 h-56 w-56 rounded-full bg-gradient-to-br from-pink-400/30 to-transparent blur-2xl" />
        </section>

        {/* QUICK ACCESS */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 dark:text-slate-500">
                Quick access
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 dark:text-slate-100">
                Family workspace
              </h2>
            </div>
          </div>

          <AnimatedGrid className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            {modules.map((module) => (
              <AnimatedItem key={module.title}>
                <OverviewCard {...module} />
              </AnimatedItem>
            ))}
          </AnimatedGrid>
        </section>

        {/* TODAY + ESSENTIALS */}
        <section className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-white/60 bg-white/85 dark:bg-slate-900/85 p-5 shadow-sm backdrop-blur transition hover:shadow-lg sm:p-6 dark:border-white/10 dark:bg-slate-900/85">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 dark:text-slate-500">
                  Today
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100 dark:text-slate-100">
                  Your family schedule
                </h2>
              </div>

              <Link
                href="/calendar"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                See calendar
              </Link>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-4 rounded-xl bg-indigo-50/60 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 dark:text-slate-100">
                    No events scheduled yet
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                    Add an event to start building your family schedule.
                  </p>
                </div>
                <CalendarDays className="hidden h-4 w-4 text-indigo-300 sm:block" />
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-dashed border-violet-200 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200">
                    Chores are ready to organize
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                    Assign responsibilities to family members.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/85 dark:bg-slate-900/85 p-5 shadow-sm backdrop-blur transition hover:shadow-lg sm:p-6 dark:border-white/10 dark:bg-slate-900/85">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 dark:text-slate-500">
              Get organized
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100 dark:text-slate-100">
              Start with the essentials
            </h2>

            <div className="mt-5 space-y-2">
              <Link
                href="/meal-planner"
                className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-amber-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <Utensils className="h-4 w-4" />
                </div>
                <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200">
                  Plan this week's meals
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </Link>

              <Link
                href="/grocery"
                className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-emerald-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200">
                  Create a grocery list
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

