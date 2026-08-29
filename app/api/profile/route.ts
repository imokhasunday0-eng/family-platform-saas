import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  });
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name)
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  return NextResponse.json({ ok: true });
}
