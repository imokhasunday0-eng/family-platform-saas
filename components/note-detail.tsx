"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Todo = {
  id: string;
  content: string;
  done: boolean;
};

type NoteData = {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  pinned: boolean;
  authorName: string;
  updatedAt: string;
  todos: Todo[];
};

const CATEGORIES = ["General", "Shopping", "Reminder", "Idea", "Important"];

const CATEGORY_STYLES: Record<string, string> = {
  General: "bg-amber-50 border-amber-200",
  Shopping: "bg-emerald-50 border-emerald-200",
  Reminder: "bg-sky-50 border-sky-200",
  Idea: "bg-fuchsia-50 border-fuchsia-200",
  Important: "bg-red-50 border-red-200",
};

export function NoteDetail({ note }: { note: NoteData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pinned, setPinned] = useState(note.pinned);
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState<Todo[]>(note.todos);

  const style =
    CATEGORY_STYLES[note.category ?? "General"] ??
    "bg-white dark:bg-slate-900 border-border";

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);

    const res = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: note.id,
        title: fd.get("title"),
        content: fd.get("content"),
        category: fd.get("category"),
      }),
    });

    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      alert("Could not save changes");
    }
  }

  async function togglePin() {
    setBusy(true);
    const res = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id, pinned: !pinned }),
    });
    setBusy(false);
    if (res.ok) {
      setPinned(!pinned);
      router.refresh();
    }
  }

  async function deleteNote() {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id }),
    });
    if (res.ok) {
      router.push("/notes");
    } else {
      setBusy(false);
      alert("Could not delete note");
    }
  }

  async function addTodo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = newTodo.trim();
    if (!content) return;
    setBusy(true);

    const res = await fetch("/api/notes/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: note.id, content }),
    });

    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      if (data.todo) {
        setTodos((prev) => [...prev, data.todo]);
      }
      setNewTodo("");
    } else {
      alert("Could not add item");
    }
  }

  async function toggleTodo(todo: Todo) {
    const newDone = !todo.done;
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, done: newDone } : t))
    );

    const res = await fetch("/api/notes/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: todo.id, done: newDone }),
    });
    if (!res.ok) {
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, done: todo.done } : t))
      );
    }
  }

  async function deleteTodo(id: string) {
    setBusy(true);
    const res = await fetch("/api/notes/todos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    if (res.ok) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  }

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/notes"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-amber-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All notes
      </Link>

      {/* Note card */}
      <div className={"rounded-2xl border p-5 shadow-sm " + style}>
        {/* Top row: category + actions */}
        <div className="flex items-center justify-between gap-2">
          {note.category ? (
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-orange-700 shadow-sm dark:bg-slate-900/80">
              {note.category}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={togglePin}
              disabled={busy}
              aria-label={pinned ? "Unpin" : "Pin"}
              className={
                "rounded-lg p-2 transition disabled:opacity-40 " +
                (pinned
                  ? "text-orange-500"
                  : "text-slate-300 hover:text-orange-500")
              }
            >
              {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setEditing(!editing)}
              aria-label="Edit note"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-100 hover:text-amber-600"
            >
              {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </button>
            <button
              onClick={deleteNote}
              disabled={busy}
              aria-label="Delete note"
              className="rounded-lg p-2 text-slate-300 transition hover:bg-red-100 hover:text-red-500 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* View mode */}
        {!editing && (
          <>
            <h1 className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-black">
              {note.title}
            </h1>
            <p className="mt-1 text-[10px] font-semibold text-slate-400">
              By {note.authorName} · Updated{" "}
              {new Date(note.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {note.content}
            </p>
          </>
        )}

        {/* Edit mode */}
        {editing && (
          <form onSubmit={saveEdit} className="mt-3 space-y-2">
            <input
              name="title"
              defaultValue={note.title}
              required
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:bg-slate-900"
            />
            <textarea
              name="content"
              defaultValue={note.content}
              required
              rows={6}
              className="w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-xs outline-none focus:border-amber-400 dark:bg-slate-900"
            />
            <select
              name="category"
              defaultValue={note.category ?? "General"}
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-xs outline-none focus:border-amber-400 dark:bg-slate-900"
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
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* To-do list */}
      <div className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm backdrop-blur dark:bg-slate-900/85 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            To-do list 📋
          </p>
          {todos.length > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              {doneCount}/{todos.length}
            </span>
          )}
        </div>

        {todos.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
            No to-do items yet. Add what needs doing below.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
              >
                <button
                  onClick={() => toggleTodo(todo)}
                  aria-label="Toggle done"
                  className={
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition " +
                    (todo.done
                      ? "border-emerald-400 bg-emerald-500 text-white"
                      : "border-emerald-300 bg-white text-transparent hover:border-emerald-600 hover:text-emerald-600")
                  }
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <p
                  className={
                    "flex-1 text-xs font-semibold " +
                    (todo.done
                      ? "text-slate-400 line-through"
                      : "text-slate-700 dark:text-slate-200")
                  }
                >
                  {todo.content}
                </p>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  disabled={busy}
                  aria-label="Delete to-do item"
                  className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add to-do form */}
        <form onSubmit={addTodo} className="mt-3 flex gap-2">
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add an item..."
            className="flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:bg-slate-900"
          />
          <button
            type="submit"
            disabled={busy || !newTodo.trim()}
            className="flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </form>
      </div>
    </div>
  );
}
