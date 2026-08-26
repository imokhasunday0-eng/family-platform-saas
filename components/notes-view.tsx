"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pin } from "lucide-react";
import { PinOff } from "lucide-react";

type NoteItem = {
  id: string;
  title: string;
  content: string;
  category?: string | null;
};

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

  async function deleteNote(id: string) {
    setBusy(true);
    const res = await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-5">
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
              placeholder="Write something..."
              className="w-full resize-none rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-amber-400"
            />
            <select
              name="category"
              defaultValue="General"
              className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2.5 text-xs outline-none focus:border-amber-400"
            >
              <option>General</option>
              <option>Shopping</option>
              <option>Reminder</option>
              <option>Idea</option>
              <option>Important</option>
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

      {/* Notes grid */}
      {notes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
          No notes yet. Jot down your first one above!
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={[
                "flex flex-col rounded-2xl border p-4 shadow-sm transition hover:shadow-md",
                CATEGORY_STYLES[note.category ?? "General"] ??
                  "bg-white dark:bg-slate-900 border-border",
              ].join(" ")}
            >
              {/* Category chip — small label up top */}
              <div className="flex items-center justify-between gap-2">
                {note.category ? (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-orange-700 shadow-sm">
                    {note.category}
                  </span>
                ) : (
                  <span />
                )}
                <button
                  disabled={busy}
                  onClick={() => deleteNote(note.id)}
                  aria-label="Delete note"
                  className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-100 hover:text-red-500 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Title — the biggest, boldest element */}
              <h3 className="mt-1.5 text-base font-extrabold leading-tight tracking-tight text-slate-900 dark:text-black">
                {note.title}
              </h3>

              {/* Body — clearly secondary */}
              <p className="mt-1.5 flex-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

