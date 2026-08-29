"use client";

import { useState } from "react";
import {
  Check,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";

type Item = {
  id: string;
  name: string;
  quantity?: string | null;
  category?: string | null;
  purchased: boolean;
};

export function GroceryView({ items }: { items: Item[] }) {
  const [showForm, setShowForm] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pending = items.filter((i) => !i.purchased);
  const bought = items.filter((i) => i.purchased);

  async function togglePurchased(id: string, purchased: boolean) {
    const res = await fetch("/api/grocery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, purchased }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error || "Could not update item");
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;

    setDeletingId(id);

    try {
      const res = await fetch("/api/grocery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Could not delete item");
      } else {
        window.location.reload();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 text-center shadow-sm backdrop-blur">
          <p className="text-2xl font-bold text-emerald-600">
            {pending.length}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            To buy
          </p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 text-center shadow-sm backdrop-blur">
          <p className="text-2xl font-bold text-slate-400 dark:text-slate-500">{bought.length}</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            In cart
          </p>
        </div>
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add an item
        </button>
      )}

      {/* Add form */}
      {showForm && <AddItemForm onDone={() => setShowForm(false)} />}

      {/* Shopping list - collapsible */}
      <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5">
        <button
          type="button"
          onClick={() => setListOpen(!listOpen)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Shopping list
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              {pending.length}
            </span>
          </span>
          <ChevronDown
            className={
              "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 " +
              (listOpen ? "rotate-180" : "")
            }
          />
        </button>

        {listOpen && (
          pending.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-400 dark:text-slate-500">
              Empty! Add what your family needs.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pending.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-emerald-50/60 p-3"
                >
                  <button
                    onClick={() => {
                      togglePurchased(item.id, true);
                    }}
                    aria-label="Mark purchased"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-emerald-300 bg-white dark:bg-slate-900 text-transparent transition hover:border-emerald-600 hover:text-emerald-600"
                  >
                    <Check className="h-4 w-4" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {item.name}
                      {item.quantity && (
                        <span className="ml-2 font-semibold text-slate-400 dark:text-slate-500">
                          x{item.quantity}
                        </span>
                      )}
                    </p>
                    {item.category && (
                      <span className="mt-1 inline-block rounded-full bg-white dark:bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm">
                        {item.category}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={deletingId === item.id}
                    aria-label="Delete item"
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      {/* In cart - collapsible */}
      {bought.length > 0 && (
        <div className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5">
          <button
            type="button"
            onClick={() => setCartOpen(!cartOpen)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              In the cart 🛒
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                {bought.length}
              </span>
            </span>
            <ChevronDown
              className={
                "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 " +
                (cartOpen ? "rotate-180" : "")
              }
            />
          </button>

          {cartOpen && (
            <ul className="mt-3 space-y-2">
              {bought.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <button
                    onClick={() => {
                      togglePurchased(item.id, false);
                    }}
                    aria-label="Move back to list"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-emerald-400 bg-emerald-500 text-white transition hover:bg-white hover:text-emerald-500 dark:bg-slate-900"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <p className="flex-1 truncate text-xs font-semibold text-slate-400 dark:text-slate-500 line-through">
                    {item.name}
                  </p>
                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={deletingId === item.id}
                    aria-label="Delete item"
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function AddItemForm({ onDone }: { onDone: () => void }) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const res = await fetch("/api/grocery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        quantity: fd.get("quantity"),
        category: fd.get("category"),
      }),
    });

    if (res.ok) window.location.reload();
    else alert("Could not save item");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5"
    >
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Add an item</p>

      <div className="mt-3 space-y-2">
        <input
          name="name"
          required
          placeholder="e.g. Rice"
          className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            name="quantity"
            type="number"
            min={1}
            placeholder="Quantity"
            className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-emerald-400"
          />
          <select
            name="category"
            defaultValue=""
            className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-emerald-400"
          >
            <option value="">Category</option>
            <option value="Produce">🥬 Produce</option>
            <option value="Grains">🌾 Grains</option>
            <option value="Protein">🍗 Protein</option>
            <option value="Dairy">🥛 Dairy</option>
            <option value="Snacks">🍿 Snacks</option>
            <option value="Household">🧼 Household</option>
            <option value="Other">📦 Other</option>
          </select>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90"
          >
            Add item
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
