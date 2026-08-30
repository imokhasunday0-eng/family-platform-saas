import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/lib/prisma";

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

// POST — heartbeat from open dashboard tabs
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeen: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// GET — ids of family members currently online
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
    include: {
      family: {
        include: {
          members: {
            include: { user: { select: { id: true, lastSeen: true } } },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "No family" }, { status: 404 });
  }

  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  const online = membership.family.members
    .filter((m) => m.user.lastSeen && m.user.lastSeen > cutoff)
    .map((m) => m.user.id);

  return NextResponse.json({ online });
}
