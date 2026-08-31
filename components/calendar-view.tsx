"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  startsAt: string;
  allDay: boolean;
  location?: string | null;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toKey(d: Date) {
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
export function CalendarView({
  events,
  todayKey,
  familyName,
}: {
  events: EventItem[];
  todayKey: string;
  familyName: string;
}) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const [localToday] = useState(() => toKey(new Date()));
  const [selectedDay, setSelectedDay] = useState(localToday);
  const [showForm, setShowForm] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const byDay: Record<string, EventItem[]> = {};
  for (const ev of events) {
    const key = ev.startsAt.slice(0, 10);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(ev);
  }

  const selectedEvents = byDay[selectedDay] ?? [];
  const monthName = cursor.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      {/* Month grid */}
      <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{monthName}</h2>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
              aria-label="Add event"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <p
              key={d}
              className="py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500"
            >
              {d}
            </p>
          ))}

          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const key = toKey(new Date(year, month, day));
            const hasEvents = (byDay[key]?.length ?? 0) > 0;
            const isToday = key === localToday;
            const isSelected = key === selectedDay;

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(key)}
                className={[
                  "relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition",
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md"
                    : isToday
                    ? "border-2 border-indigo-400 text-indigo-700"
                    : "text-slate-600 dark:text-slate-300 hover:bg-muted",
                ].join(" ")}
              >
                {day}
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add event form */}
      {showForm && <AddEventForm selectedDay={selectedDay} />}

      {/* Selected day events */}
      <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Events on{" "}
          {new Date(`${selectedDay}T12:00`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </h3>

        {selectedEvents.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Nothing planned yet. A clear day for the {familyName}.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {selectedEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-3 rounded-xl bg-indigo-50/70 p-3"
              >
                <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                  <span className="text-[11px] font-bold text-indigo-600">
                    {ev.allDay
                      ? "All day"
                      : new Date(ev.startsAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    {ev.title}
                  </p>
                  {ev.location && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                      <MapPin className="h-3 w-3" /> {ev.location}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddEventForm({ selectedDay }: { selectedDay: string }) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        time: fd.get("time"),
        location: fd.get("location"),
        date: selectedDay,
      }),
    });

    if (res.ok) window.location.reload();
    else alert("Could not save event");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5"
    >
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Add an event</p>

      <input type="hidden" name="date" value={selectedDay} />

      <div className="mt-3 space-y-2">
        <input
          name="title"
          required
          placeholder="Event title (e.g. Dentist appointment)"
          className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            name="time"
            type="time"
            className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-indigo-400"
          />
          <input
            name="location"
            placeholder="Location (optional)"
            className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-indigo-400"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90"
        >
          Save event
        </button>
      </div>
    </form>
  );
}

