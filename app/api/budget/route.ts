import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";
import { notifyFamilyMembers } from "@/lib/notifications";

async function getContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;

  return membership;
}

function getCurrentBudgetKey(now: Date) {
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// Find or create the current month's budget
async function getBudget(familyId: string) {
  const now = new Date();
  const key = getCurrentBudgetKey(now);

  let budget = await prisma.budget.findFirst({
    where: { familyId, month: key.month, year: key.year },
  });
  if (!budget) {
    budget = await prisma.budget.create({
      data: {
        familyId,
        name: "Monthly budget",
        month: key.month,
        year: key.year,
      },
    });
  }
  return budget;
}

// Add an expense or income
export async function POST(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const kind = String(body.kind || "");
  const label = String(body.label || "").trim();
  const amountNum = Number(body.amount);

  if (!["expense", "income"].includes(kind))
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  if (!label)
    return NextResponse.json({ error: "Label required" }, { status: 400 });
  if (!isFinite(amountNum) || amountNum <= 0)
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const budget = await getBudget(membership.familyId);
  const amountStr = amountNum.toFixed(2);

  if (kind === "expense") {
    await prisma.expense.create({
      data: {
        budgetId: budget.id,
        userId: membership.userId,
        category: label,
        amount: amountStr,
        note: body.note ? String(body.note).trim() || null : null,
        date: new Date(),
      },
    });
  } else {
    await prisma.income.create({
      data: {
        budgetId: budget.id,
        userId: membership.userId,
        source: label,
        amount: amountStr,
        date: new Date(),
      },
    });
  }

  await notifyFamilyMembers({
    familyId: membership.familyId,
    excludeUserId: membership.userId,
    title: kind === "expense" ? "New expense added" : "New income added",
    body:
      kind === "expense"
        ? `${label} expense of ${amountStr} was added to the family budget.`
        : `${label} income of ${amountStr} was added to the family budget.`,
  });

  return NextResponse.json({ ok: true });
}

// Delete an expense or income
export async function DELETE(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  const kind = String(body.kind || "");
  if (!id || !["expense", "income"].includes(kind))
    return NextResponse.json(
      { error: "id and kind required" },
      { status: 400 }
    );

  const budgetIds = (
    await prisma.budget.findMany({ where: { familyId: membership.familyId } })
  ).map((b) => b.id);

  if (kind === "expense") {
    const existing = await prisma.expense.findFirst({
      where: { id, budgetId: { in: budgetIds } },
    });
    if (!existing)
      return NextResponse.json({ ok: true });
    await prisma.expense.delete({ where: { id } });
  } else {
    const existing = await prisma.income.findFirst({
      where: { id, budgetId: { in: budgetIds } },
    });
    if (!existing)
      return NextResponse.json({ ok: true });
    await prisma.income.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}

