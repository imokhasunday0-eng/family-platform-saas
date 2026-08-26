"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  CheckSquare,
  CircleDollarSign,
  Home,
  Menu,
  MessageCircle,
  Settings,
  ShoppingCart,
  Utensils,
  FileText,
  X,
} from "lucide-react";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Meal Planner", href: "/meal-planner", icon: Utensils },
  { label: "Grocery", href: "/grocery", icon: ShoppingCart },
  { label: "Chores", href: "/chores", icon: CheckSquare },
  { label: "Budget", href: "/budget", icon: CircleDollarSign },
  { label: "Family Chat", href: "/chat", icon: MessageCircle },
  { label: "Notes", href: "/notes", icon: FileText },
];

const more = [
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileDrawer({ userName }: { userName?: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);


  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted md:hidden"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            />

            {/* Drawer panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-card md:hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">
                    F
                  </div>
                  <span className="text-sm font-bold">Family Platform</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
                >
                  <X className="h-[17px] w-[17px]" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-5">
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Workspace
                </p>
                <nav className="mt-3 space-y-1">
                  {nav.map(({ label, href, icon: Icon }) => {
                    const active =
                      href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className={
                          active
                            ? "flex items-center gap-3 rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground"
                            : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        }
                      >
                        <Icon className="h-[18px] w-[18px]" />
                        {label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="my-5 border-t border-border" />

                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  More
                </p>
                <nav className="mt-3 space-y-1">
                  {more.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {label}
                    </Link>
                  ))}
                </nav>
              </nav>

              <div className="border-t border-border p-4">
                <p className="truncate text-xs font-semibold">
                  {userName || "Account"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Family workspace
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

