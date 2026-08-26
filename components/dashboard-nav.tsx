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
            {active && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 rounded-xl bg-accent"
                transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
              >
                <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
              </motion.div>
            )}
            <Icon
              className={cn(
                "relative z-10 h-[18px] w-[18px]",
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
  void pathname;

  // Mobile bottom bar is rendered by the layout itself;
  // keeping this export so imports don't break.
  return null;
}

