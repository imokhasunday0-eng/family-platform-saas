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
  value: string;
  href: string;
  className?: string;
}

const styles: Record<
  string,
  { icon: any; tile: string; glow: string; text: string }
> = {
  "Today's Events": {
    icon: CalendarDays,
    tile: "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white",
    glow: "group-hover:shadow-indigo-500/20",
    text: "group-hover:text-indigo-600",
  },
  "Meal Planner": {
    icon: Utensils,
    tile: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
    glow: "group-hover:shadow-amber-500/20",
    text: "group-hover:text-amber-600",
  },
  "Pending Chores": {
    icon: CheckSquare,
    tile: "bg-gradient-to-br from-violet-500 to-purple-600 text-white",
    glow: "group-hover:shadow-violet-500/20",
    text: "group-hover:text-violet-600",
  },
  "Grocery List": {
    icon: ShoppingCart,
    tile: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    glow: "group-hover:shadow-emerald-500/20",
    text: "group-hover:text-emerald-600",
  },
  Budget: {
    icon: CircleDollarSign,
    tile: "bg-gradient-to-br from-rose-500 to-pink-600 text-white",
    glow: "group-hover:shadow-rose-500/20",
    text: "group-hover:text-rose-600",
  },
  "Family Chat": {
    icon: MessageCircle,
    tile: "bg-gradient-to-br from-sky-500 to-blue-600 text-white",
    glow: "group-hover:shadow-sky-500/20",
    text: "group-hover:text-sky-600",
  },
};

export function OverviewCard({
  title,
  value,
  href,
  className,
}: OverviewCardProps) {
  const s = styles[title] || styles["Today's Events"];
  const Icon = s.icon;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/85 transition duration-300 hover:-translate-y-1 hover:shadow-xl",
        s.glow,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110",
            s.tile
          )}
        >
          <Icon className="h-[20px] w-[20px]" />
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
          <ArrowUpRight
            className={cn("h-4 w-4 transition", s.text)}
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <p className="text-[13px] font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {title}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500">{value}</p>
      </div>

      {/* bottom color line */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r opacity-70 transition-transform duration-300 group-hover:scale-x-100",
          s.tile
        )}
      />
    </Link>
  );
}

