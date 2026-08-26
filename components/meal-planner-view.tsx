"use client";

import { useState } from "react";
import { Plus, Trash2, Utensils } from "lucide-react";

type Meal = {
  id: string;
  date: string;
  mealType: string;
  name: string;
};

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const MEAL_ICONS: Record<string, string> = {
  Breakfast: "🌅",
  Lunch: "☀️",
  Dinner: "🌙",
  Snack: "🍿",
};

function toKey(d: Date) {
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
export function MealPlannerView({ meals }: { meals: Meal[] }) {
  const [showForm, setShowForm] = useState(false);
  const todayKey = toKey(new Date());
  const [selectedDay, setSelectedDay] = useState(todayKey);

  // Build the next 7 days strip
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayMeals = meals.filter((m) => m.date === selectedDay);

  async function deleteMeal(id: string) {
    const res = await fetch("/api/meals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) alert("Could not delete meal");
  }

  return (
    <div className="space-y-5">
      {/* Day picker */}
      <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-3 shadow-sm backdrop-blur">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {days.map((d) => {
            const key = toKey(d);
            const isSelected = key === selectedDay;
            const count = meals.filter((m) => m.date === key).length;

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(key)}
                className={[
                  "flex min-w-[52px] flex-col items-center rounded-xl px-2 py-2 transition",
                  isSelected
                    ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md"
                    : "bg-slate-50 text-slate-600 dark:text-slate-300 hover:bg-amber-50",
                ].join(" ")}
              >
                <span className="text-[10px] font-semibold uppercase">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="mt-0.5 text-sm font-bold">{d.getDate()}</span>
                {count > 0 && (
                  <span
                    className={[
                      "mt-0.5 h-1.5 w-1.5 rounded-full",
                      isSelected ? "bg-white dark:bg-slate-900" : "bg-amber-400",
                    ].join(" ")}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add a meal
        </button>
      )}

      {/* Add form */}
      {showForm && <AddMealForm selectedDay={selectedDay} onDone={() => setShowForm(false)} />}

      {/* Meals for selected day */}
      <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {new Date(`${selectedDay}T12:00`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h3>

        {dayMeals.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center">
            <Utensils className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              No meals planned yet. What&apos;s cooking?
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {MEAL_TYPES.map((type) => {
              const typeMeals = dayMeals.filter((m) => m.mealType === type);
              if (typeMeals.length === 0) return null;

              return typeMeals.map((meal) => (
                <li
                  key={meal.id}
                  className="flex items-center gap-3 rounded-xl bg-amber-50/60 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 text-lg shadow-sm">
                    {MEAL_ICONS[meal.mealType] ?? "🍽️"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {meal.name}
                    </p>
                    <p className="text-[11px] font-semibold text-amber-600">
                      {meal.mealType}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMeal(meal.id)}
                    aria-label="Delete meal"
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ));
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddMealForm({
  selectedDay,
  onDone,
}: {
  selectedDay: string;
  onDone: () => void;
}) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        mealType: fd.get("mealType"),
        date: selectedDay,
      }),
    });

    if (res.ok) window.location.reload();
    else alert("Could not save meal");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5"
    >
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Add a meal</p>

      <div className="mt-3 space-y-2">
        <input
          name="name"
          required
          placeholder="e.g. Jollof rice & chicken"
          className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />

        <select
          name="mealType"
          defaultValue="Dinner"
          className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-amber-400"
        >
          {MEAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {MEAL_ICONS[t]} {t}
            </option>
          ))}
        </select>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90"
          >
            Save meal
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

