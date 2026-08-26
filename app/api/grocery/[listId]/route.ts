import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth/auth";
import { groceryItemSchema } from "@/features/grocery/schema";

async function getAuthorizedList(listId: string, requestHeaders: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const list = await prisma.groceryList.findFirst({
    where: { id: listId, family: { members: { some: { userId: session.user.id } } } },
    select: { id: true },
  });

  if (!list) return { error: NextResponse.json({ error: "Grocery list not found" }, { status: 404 }) };
  return { list };
}

export async function GET(_req: NextRequest, { params }: { params: { listId: string } }) {
  try {
    const access = await getAuthorizedList(params.listId, _req.headers);
    if ("error" in access) return access.error;

    const items = await prisma.groceryItem.findMany({
      where: { listId: params.listId },
      orderBy: [{ purchased: "asc" }, { id: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/grocery failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { listId: string } }) {
  try {
    const access = await getAuthorizedList(params.listId, req.headers);
    if ("error" in access) return access.error;

    const parsed = groceryItemSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const item = await prisma.groceryItem.create({
      data: { ...parsed.data, listId: params.listId },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/grocery failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
