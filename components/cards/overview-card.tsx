import Link from "next/link";
import {
  CalendarDays,
  CheckSquare,
  CircleDollarSign,
  MessageCircle,
  ShoppingCart,
  Utensils,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewCardProps {
  title: string;
  primary: string;   // the meaningful state: "Tonight · Chicken & rice"
  secondary?: string; // quiet supporting line: "No meals planned" etc.
  href: string;
  className?: string;
}

// Muted, sophisticated accents — color as identifier, not decoration
const styles: Record<string, { icon: any; tile: string; text: string }> = {
  "Today's Events": {
    icon: CalendarDays,
    tile: "bg-module-events text-white",
    text: "group-hover:text-module-events",
  },
  "Meal Planner": {
    icon: Utensils,
    tile: "bg-module-meals text-white",
    text: "group-hover:text-module-meals",
  },
  "Pending Chores": {
    icon: CheckSquare,
    tile: "bg-module-chores text-white",
    text: "group-hover:text-module-chores",
  },
  "Grocery List": {
    icon: ShoppingCart,
    tile: "bg-module-grocery text-white",
    text: "group-hover:text-module-grocery",
  },
  Budget: {
    icon: CircleDollarSign,
    tile: "bg-module-budget text-white",
    text: "group-hover:text-module-budget",
  },
  "Family Chat": {
    icon: MessageCircle,
    tile: "bg-module-chat text-white",
    text: "group-hover:text-module-chat",
  },
};

export function OverviewCard({
  title,
  primary,
  secondary,
  href,
  className,
}: OverviewCardProps) {
  const s = styles[title] || styles["Today's Events"];
  const Icon = s.icon;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full w-full flex-col rounded-card border border-slate-200/70 bg-white p-4 shadow-1 transition duration-200 hover:border-slate-300/80 hover:shadow-2 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/15",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-icon transition-colors duration-200",
            s.tile
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>

        {/* Discovered, not noticed */}
        <ArrowUpRight className="mt-1 h-3.5 w-3.5 text-slate-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-slate-600" />
      </div>

      <div className="mt-auto pt-5">
        <p className="text-[13px] font-semibold tracking-tight text-slate-700 dark:text-slate-300">
          {title}
        </p>
        <p className="mt-1.5 text-sm font-semibold leading-5 tracking-tight text-slate-900 dark:text-slate-100">
          {primary}
        </p>
        {secondary && (
          <p className="mt-0.5 text-xs leading-5 text-slate-400 dark:text-slate-500">
            {secondary}
          </p>
        )}
      </div>
    </Link>
  );
}
