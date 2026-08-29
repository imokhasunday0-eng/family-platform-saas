"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pin, PinOff, Search } from "lucide-react";

type NoteItem = {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  pinned: boolean;
  todoTotal: number;
  todoDone: number;
};

const CATEGORIES = ["General", "Shopping", "Reminder", "Idea", "Important"];

const CATEGORY_STYLES: Record<string, string> = {
  General: "bg-amber-50 border-amber-200",
  Shopping: "bg-emerald-50 border-emerald-200",
  Reminder: "bg-sky-50 border-sky-200",
  Idea: "bg-fuchsia-50 border-fuchsia-200",
  Important: "bg-red-50 border-red-200",
};

export function NotesView({ notes }: { notes: NoteItem[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      if (categoryFilter !== "All" && (n.category ?? "General") !== categoryFilter)
        return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    });
  }, [notes, search, categoryFilter]);

  const pinned = filtered.filter((n) => n.pinned);
  const rest = filtered.filter((n) => !n.pinned);

  async function togglePin(id: string, pinned: boolean) {
    setBusy(true);
    const res = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function deleteNote(id: string) {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  function renderCard(note: NoteItem) {
    const style =
      CATEGORY_STYLES[note.category ?? "General"] ??
      "bg-white dark:bg-slate-900 border-border";

    return (
      <div
        key={note.id}
        className={
          "flex flex-col rounded-2xl border p-4 shadow-sm transition hover:shadow-md " +
          style
        }
      >
        <div className="flex items-center justify-between gap-2">
          {note.category ? (
            <span className="rounded-full bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-orange-700 shadow-sm">
              {note.category}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-0.5">
            <button
              disabled={busy}
              onClick={() => togglePin(note.id, !note.pinned)}
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              className={
                "-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 transition disabled:opacity-30 " +
                (note.pinned
                  ? "text-orange-500"
                  : "text-slate-300 hover:text-orange-500")
              }
            >
              {note.pinned ? (
                <Pin className="h-3.5 w-3.5" />
              ) : (
                <PinOff className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              disabled={busy}
              onClick={() => deleteNote(note.id)}
              aria-label="Delete note"
              className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-100 hover:text-red-500 disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <Link href={"/notes/" + note.id} className="mt-1.5 block">
          <h3 className="text-base font-extrabold leading-tight tracking-tight text-slate-900 dark:text-black">
            {note.title}
          </h3>
          <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
            {note.content}
          </p>

          {note.todoTotal > 0 && (
            <p className="mt-2 text-[10px] font-bold text-emerald-600">
              ☑ {note.todoDone}/{note.todoTotal} done
            </p>
          )}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {["All", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={
              "rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition " +
              (categoryFilter === cat
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-500 border border-border hover:border-amber-300")
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New note
        </button>
      )}

      {/* Form */}
      {showForm && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const fd = new FormData(e.currentTarget);
            const res = await fetch("/api/notes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: fd.get("title"),
                content: fd.get("content"),
                category: fd.get("category"),
              }),
            });
            setBusy(false);
            if (res.ok) {
              setShowForm(false);
              router.refresh();
            } else {
              alert("Could not save note");
            }
          }}
          className="rounded-2xl border border-white/60 bg-white dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur sm:p-5"
        >
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">New note</p>

          <div className="mt-3 space-y-2">
            <input
              name="title"
              required
              placeholder="Title"
              className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Write something... You can add a to-do list after saving."
              className="w-full resize-none rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-amber-400"
            />
            <select
              name="category"
              defaultValue="General"
              className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-amber-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
              >
                Save note
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

      {/* Notes */}
      {notes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
          No notes yet. Jot down your first one above!
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
          No notes match your search or filter.
        </p>
      ) : (
        <div className="space-y-5">
          {pinned.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-orange-600">
                <Pin className="h-3 w-3" /> Pinned
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {pinned.map(renderCard)}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  Others
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {rest.map(renderCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
