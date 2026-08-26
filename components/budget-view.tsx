"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Entry = {
  id: string;
  kind: "expense" | "income";
  label: string;
  amount: number;
  note?: string | null;
  date: string;
};

export function BudgetView({ entries }: { entries: Entry[] }) {
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const router = useRouter();
  const [deleting, setDeleting] = useState<string[]>([]);

  const income = entries
    .filter((e) => e.kind === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const expenses = entries
    .filter((e) => e.kind === "expense")
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = income - expenses;

  function formatMoney(n: number) {
    return n.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    });
  }

  async function deleteEntry(id: string, entryKind: string) {
    const key = entryKind + "-" + id;
    setDeleting((prev) => [...prev, key]);
    const res = await fetch("/api/budget", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kind: entryKind }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting((prev) => prev.filter((k) => k !== key));
      alert("Could not delete");
  }
    }
  

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white shadow-lg">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
          This month
        </p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">
          {formatMoney(balance)}
        </p>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-white dark:bg-slate-900/15 px-3 py-2 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase text-white/70">
              Income
            </p>
            <p className="text-sm font-bold text-emerald-200">
              +{formatMoney(income)}
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-white dark:bg-slate-900/15 px-3 py-2 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase text-white/70">
              Expenses
            </p>
            <p className="text-sm font-bold text-red-200">
              -{formatMoney(expenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add transaction
        </button>
      )}

      {/* Form */}
      {showForm && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const res = await fetch("/api/budget", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                kind,
                label: fd.get("label"),
                amount: fd.get("amount"),
                note: fd.get("note"),
              }),
            });
            if (res.ok) window.location.reload();
            else alert("Could not save transaction");
          }}
          className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5"
        >
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Add transaction</p>

          {/* Type toggle */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKind("expense")}
              className={[
                "rounded-xl border-2 px-3 py-2 text-xs font-bold transition",
                kind === "expense"
                  ? "border-red-400 bg-red-50 text-red-600"
                  : "border-border bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500",
              ].join(" ")}
            >
              💸 Expense
            </button>
            <button
              type="button"
              onClick={() => setKind("income")}
              className={[
                "rounded-xl border-2 px-3 py-2 text-xs font-bold transition",
                kind === "income"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                  : "border-border bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500",
              ].join(" ")}
            >
              💵 Income
            </button>
          </div>

          <div className="mt-2 space-y-2">
            <input
              name="label"
              required
              placeholder={kind === "expense" ? "Category (e.g. Food)" : "Source (e.g. Salary)"}
              className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              min={0.01}
              required
              placeholder="Amount"
              className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-violet-400"
            />
            {kind === "expense" && (
              <input
                name="note"
                placeholder="Note (optional)"
                className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-violet-400"
              />
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* History */}
      <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">History</h3>

        {entries.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No transactions yet. Track your first one above!
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.kind + "-" + entry.id}
                className={[
                  "flex items-center gap-3 rounded-xl p-3",
                  entry.kind === "income" ? "bg-emerald-50/70" : "bg-red-50/50",
                ].join(" ")}
              >
                <span className="text-base">
                  {entry.kind === "income" ? "💵" : "💸"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    {entry.label}
                  </p>
                  <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {entry.note ? " · " + entry.note : ""}
                  </p>
                </div>
                <p
                  className={[
                    "shrink-0 text-xs font-extrabold",
                    entry.kind === "income" ? "text-emerald-600" : "text-red-500",
                  ].join(" ")}
                >
                  {entry.kind === "income" ? "+" : "-"}
                  {formatMoney(entry.amount)}
                </p>
                <button
                  disabled={deleting.includes(entry.kind + "-" + entry.id)}
                  onClick={() => deleteEntry(entry.id, entry.kind)}
                  aria-label="Delete transaction"
                  className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

