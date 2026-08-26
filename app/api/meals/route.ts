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

function buildDate(dateStr: string) {
  return new Date(dateStr + "T12:00");
}

// Add a meal plan entry
export async function POST(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  const dateStr = String(body.date || "");
  const mealType = String(body.mealType || "Dinner");

  const VALID_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
  if (!name || !dateStr)
    return NextResponse.json(
      { error: "Name and date required" },
      { status: 400 }
    );
  if (!VALID_TYPES.includes(mealType))
    return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });

  // Find or create the recipe by title
  let recipe = await prisma.recipe.findFirst({
    where: { title: name },
  });
  if (!recipe) {
    recipe = await prisma.recipe.create({
      data: {
        title: name,
        instructions: "",
      },
    });
  }

  await prisma.mealPlan.create({
    data: {
      familyId: membership.familyId,
      date: buildDate(dateStr),
      mealType,
      recipeId: recipe.id,
    },
  });

  await notifyFamilyMembers({
    familyId: membership.familyId,
    excludeUserId: membership.userId,
    title: "Meal plan updated",
    body: `${name} was added to the ${mealType} meal plan.`,
  });

  return NextResponse.json({ ok: true });
}

// Delete a meal plan entry
export async function DELETE(req: Request) {
  const membership = await getContext();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.mealPlan.findFirst({
    where: { id, familyId: membership.familyId },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.mealPlan.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

