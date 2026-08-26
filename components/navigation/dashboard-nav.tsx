"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Utensils,
  ShoppingCart,
  CheckSquare,
  Wallet,
  MessageCircle,
  FileText,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Meals", href: "/meal-planner", icon: Utensils },
  { label: "Grocery", href: "/grocery", icon: ShoppingCart },
  { label: "Chores", href: "/chores", icon: CheckSquare },
  { label: "Budget", href: "/budget", icon: Wallet },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {nav.map(({ label, href, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {/* Sliding pill background */}
            {active && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 rounded-xl bg-accent"
                transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
              >
                {/* Accent bar on left edge */}
                <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
              </motion.div>
            )}

            {/* Content above pill */}
            <Icon
              className={cn(
                "relative z-10 h-[18px] w-[18px] transition-colors",
                active && "text-primary"
              )}
            />
            <span className="relative z-10">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileDashboardNav() {
  const pathname = usePathname();

  const mobileItems = [
    ...nav.filter((n) =>
      ["Dashboard", "Calendar", "Chat"].includes(n.label)
    ),
    nav.find((n) => n.label === "Settings")!,
  ];

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-50 border-t px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {mobileItems.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="relative flex min-w-[62px] flex-col items-center gap-1 px-2 py-1.5"
            >
              {/* Sliding dot indicator */}
              {active && (
                <motion.span
                  layoutId="mobile-nav-dot"
                  className="absolute -top-[13px] h-1 w-6 rounded-full bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

