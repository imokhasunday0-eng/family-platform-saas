import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { BudgetView } from "@/components/budget-view";

type Entry = {
  id: string;
  kind: "expense" | "income";
  label: string;
  amount: number;
  note?: string | null;
  date: string;
};

export default async function BudgetPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let budget = await prisma.budget.findFirst({
    where: { familyId: membership.familyId, month, year },
    include: {
      expenses: { orderBy: { date: "desc" } },
      incomes: { orderBy: { date: "desc" } },
    },
  });

  const expenses: Entry[] = (budget?.expenses ?? []).map((e) => ({
    id: e.id,
    kind: "expense",
    label: e.category,
    amount: Number(e.amount),
    note: e.note,
    date: e.date.toISOString(),
  }));

  const incomes: Entry[] = (budget?.incomes ?? []).map((i) => ({
    id: i.id,
    kind: "income",
    label: i.source,
    amount: Number(i.amount),
    date: i.date.toISOString(),
  }));

  // Merge and sort newest first
  const entries = [...incomes, ...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const monthName = now.toLocaleDateString("en-US", { month: "long" });

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 md:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          Budget · {monthName} {year}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Family money
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Track what comes in and what goes out — everyone in the family sees
          it.
        </p>

        <div className="mt-6">
          <BudgetView entries={entries} />
        </div>
      </div>
    </main>
  );
}

