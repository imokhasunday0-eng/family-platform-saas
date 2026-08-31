import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Bell,
  Settings,
} from "lucide-react";
import { auth } from "@/server/auth/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { MobileDrawer } from "@/components/mobile-drawer";
import { NotificationBell } from "@/components/notification-bell";
import { AmbientBackground } from "@/components/ambient-background";
import { prisma } from "@/lib/prisma";
import { familyDisplayName } from "@/lib/family-name";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";

const bottomNav = [
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  const membership = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
    include: { family: true },
  });
  const familyName = membership
    ? familyDisplayName(membership.family.name)
    : "Family Platform";

  const initials =
    session.user.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <>
      <PresenceHeartbeat />
      <AmbientBackground />
      <div className="relative z-10 min-h-screen text-foreground">
      {/* Sidebar (desktop only) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-[76px] items-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/90 text-sm font-bold text-white">
              F
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight">
                {familyName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Family Platform
              </p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Workspace
          </p>
          <nav className="mt-3">
            <DashboardNav />
          </nav>

          <div className="my-6 border-t border-border" />

          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            More
          </p>
          <nav className="mt-3 space-y-1">
            {bottomNav.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">
                {session.user.name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:pl-[250px]">
        {/* Header — no backdrop-blur so the drawer positions correctly */}
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-border bg-background px-4 md:px-8">
          <div className="md:hidden flex items-center gap-2">
            <MobileDrawer userName={session.user.name} />
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">
                F
              </div>
              <span className="text-sm font-bold">{familyName}</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <p className="text-xs text-muted-foreground">
              {familyName} \u00b7 Private workspace
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />

            <div className="hidden h-7 w-px bg-border sm:block" />

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {initials}
              </div>
              <span className="hidden max-w-[120px] truncate text-xs font-semibold sm:block">
                {session.user.name}
              </span>
            </div>
          </div>
        </header>

        <main className="pb-24 md:pb-10">{children}</main>
      </div>
    </div>
    </>
  );
}

