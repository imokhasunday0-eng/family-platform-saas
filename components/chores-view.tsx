"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Sparkles } from "lucide-react";

type ChoreItem = {
  id: string;
  title: string;
  description?: string | null;
  points: number;
  dueDate?: string | null;
  completedAt?: Date | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
};

type Member = {
  id: string;
  name: string;
  role: string;
};

export function ChoresView({
  chores,
  members,
}: {
  chores: ChoreItem[];
  members: Member[];
}) {
  const [showForm, setShowForm] = useState(false);

  const pending = chores.filter((c) => !c.completedAt);
  const done = chores.filter((c) => c.completedAt);

  async function handleComplete(id: string) {
    try {
      const res = await fetch("/api/chores", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

     const data = await res.json().catch(() => null);

     if (!res.ok) {
       console.error("Complete chore failed:", res.status, data);
       alert(data?.error || `Could not complete chore (${res.status})`);
       return;
     }

     window.location.reload();
   } catch (error) {
     console.error("Complete chore request failed:", error);
     alert("Could not connect to the server");
   }
 }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 text-center shadow-sm backdrop-blur">
          <p className="text-2xl font-bold text-indigo-600">{pending.length}</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            To do
          </p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 text-center shadow-sm backdrop-blur">
          <p className="text-2xl font-bold text-emerald-600">{done.length}</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Completed
          </p>
        </div>
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add a chore
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <AddChoreForm members={members} onDone={() => setShowForm(false)} />
      )}

      {/* Pending */}
      <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">To do</h3>

        {pending.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-400 dark:text-slate-500">
            All done! Add a new chore to keep things running.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pending.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-xl bg-indigo-50/60 p-3"
              >
                <button
                  onClick={() => handleComplete(c.id)}
                  aria-label="Complete chore"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-indigo-300 bg-white dark:bg-slate-900 text-transparent transition hover:border-emerald-500 hover:text-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    {c.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                    {c.assignedToName ? `For ${c.assignedToName}` : "Unassigned"}
                    {c.dueDate &&
                      ` · Due ${new Date(c.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}`}
                  </p>
                </div>

                <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-700">
                  <Sparkles className="h-3 w-3" /> {c.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Completed */}
      {done.length > 0 && (
        <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Completed ✅</h3>
          <ul className="mt-3 space-y-2">
            {done.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-xl bg-emerald-50/60 p-3 opacity-75"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <p className="flex-1 truncate text-xs font-semibold text-slate-500 line-through">
                  {c.title}
                </p>
                <span className="shrink-0 text-[11px] font-bold text-emerald-600">
                  +{c.points} pts
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AddChoreForm({
  members,
  onDone,
}: {
  members: Member[];
  onDone: () => void;
}) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const res = await fetch("/api/chores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        points: Number(fd.get("points") || 10),
        assignedToId: fd.get("assignedToId"),
        dueDate: fd.get("dueDate"),
      }),
    });

    if (res.ok) window.location.reload();
    else alert("Could not save chore");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5"
    >
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Add a chore</p>

      <div className="mt-3 space-y-2">
        <input
          name="title"
          required
          placeholder="e.g. Wash the dishes"
          className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            name="points"
            type="number"
            min={1}
            defaultValue={10}
            className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-indigo-400"
          />
          <input
            name="dueDate"
            type="date"
            className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-indigo-400"
          />
        </div>

        <select
          name="assignedToId"
          className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-indigo-400"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90"
          >
            Save chore
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

