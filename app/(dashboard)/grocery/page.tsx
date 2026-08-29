import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { GroceryView } from "@/components/grocery-view";

export default async function GroceryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;

  let list = await prisma.groceryList.findFirst({
    where: { familyId: membership.familyId },
    include: { items: { orderBy: { name: "asc" } } },
  });

  if (!list) {
    list = await prisma.groceryList.create({
      data: { familyId: membership.familyId },
      include: { items: true },
    });
  }

  const items = list.items.map((i) => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    category: i.category,
    purchased: i.purchased,
  }));

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 md:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          Grocery
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Shared shopping list
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Tap the checkbox when something lands in the cart — everyone in the
          family sees updates!
        </p>

        <div className="mt-6">
          <GroceryView items={items} />
        </div>
      </div>
    </main>
  );
}

