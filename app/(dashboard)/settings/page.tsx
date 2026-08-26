"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  role: string;
  points: number;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

type Invite = {
  id: string;
  email: string;
  role: string;
  token: string;
};

type NotificationSettings = {
  notificationsInApp: boolean;
  notificationsEmail: boolean;
  notificationsPush: boolean;
  eventReminders: boolean;
  choreReminders: boolean;
  mealReminders: boolean;
  groceryReminders: boolean;
  budgetAlerts: boolean;
};

export default function SettingsPage() {
  const [family, setFamily] = useState<{
    id: string;
    name: string;
    members: Member[];
    invitations: Invite[];
  } | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [msg, setMsg] = useState("");
  const [dark, setDark] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings | null>(null);

  const [notificationSaving, setNotificationSaving] =
    useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/family");

    if (res.ok) {
      setFamily(await res.json());
    }
  };

  const loadNotificationSettings = async () => {
    const res = await fetch("/api/settings");

    if (res.ok) {
      setNotificationSettings(await res.json());
    }
  };

  useEffect(() => {
    load();
    loadNotificationSettings();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";

    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const toggleDark = () => {
    const next = !dark;

    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const updateNotificationSetting = async (
    field: keyof NotificationSettings,
    value: boolean
  ) => {
    if (!notificationSettings) return;

    const previous = notificationSettings;

    setNotificationSettings({
      ...notificationSettings,
      [field]: value,
    });

    setNotificationSaving(field);

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [field]: value,
      }),
    });

    if (!res.ok) {
      setNotificationSettings({
        ...previous,
        [field]: !value,
      });
    }

    setNotificationSaving(null);
  };

  const sendInvite = async () => {
    setMsg("");

    const res = await fetch("/api/family", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        role,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setMsg(
        "Invite link: " +
          window.location.origin +
          "/join/" +
          data.token
      );

      setEmail("");
      load();
    } else {
      setMsg(data.error || "Failed to create invite");
    }
  };

  const renameFamily = async () => {
    if (!family) return;

    const name = prompt("New family name:", family.name);

    if (!name) return;

    const res = await fetch("/api/family", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
      }),
    });

    if (res.ok) {
      load();
    } else {
      setMsg("Rename failed (need OWNER/ADMIN)");
    }
  };

  if (!family) {
    return <p className="p-8">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">⚙️ Settings</h1>

      {msg && (
        <div className="rounded bg-blue-100 p-3 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {msg}
        </div>
      )}

      {/* Family */}
      <section className="overflow-hidden rounded-2xl border border-blue-200/60 bg-white shadow-lg shadow-blue-500/10 dark:border-indigo-500/20 dark:bg-slate-900">
        {/* Premium family header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 left-20 h-40 w-40 rounded-full bg-violet-300/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-3xl shadow-lg backdrop-blur-sm">
                👨‍👩‍👧
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                  Family
                </p>

                <h2 className="mt-1 truncate text-2xl font-bold tracking-tight">
                  {family.name}
                </h2>

                <p className="mt-1 text-sm text-blue-100">
                  {family.members.length}{" "}
                  {family.members.length === 1 ? "member" : "members"}
                </p>
              </div>
            </div>

            <button
              onClick={renameFamily}
              className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/20"
            >
              Rename
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-violet-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
          <div className="border-b border-slate-100 px-6 py-3 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Members
            </p>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {family.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-white/70 dark:hover:bg-slate-800/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-blue-500/20">
                    {m.user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {m.user.name}
                    </p>

                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {m.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {m.role}
                  </span>

                  <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    ⭐ {m.points}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Invite */}
      <section className="rounded-lg border p-4">
        <button
          type="button"
          onClick={() => setInviteOpen((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="text-lg font-semibold text-blue-600">
            Invite a member
          </h2>

          <span
            className={`text-xl text-blue-600 transition-transform duration-200 ${
              inviteOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        {inviteOpen && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 rounded border px-3 py-2 text-sm"
                type="email"
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded border bg-white px-3 py-2 text-sm font-semibold text-blue-600 dark:bg-slate-900 dark:text-blue-400"
              >
                {["MEMBER", "ADMIN", "CHILD"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>

              <button
                onClick={sendInvite}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Invite
              </button>
            </div>

            {family.invitations.length > 0 && (
              <div className="mt-3 text-xs text-gray-500">
                Pending invites:{" "}
                {family.invitations
                  .map((i) => i.email)
                  .join(", ")}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Appearance */}
      <section className="rounded-lg border p-4">
        <button
          type="button"
          onClick={() =>
            setAppearanceOpen((prev) => !prev)
          }
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="text-lg font-semibold text-yellow-500">
            Appearance
          </h2>

          <span
            className={`text-xl text-yellow-500 transition-transform duration-200 ${
              appearanceOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        {appearanceOpen && (
          <div className="mt-4">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={dark}
                onChange={toggleDark}
                className="h-5 w-5"
              />

              🌙 Dark mode
            </label>
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="rounded-lg border p-4">
        <button
          type="button"
          onClick={() =>
            setNotificationsOpen((prev) => !prev)
          }
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Notifications
          </h2>

          <span
            className={`text-xl text-black dark:text-white transition-transform duration-200 ${
              notificationsOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        {notificationsOpen && (
          <div className="mt-4">
            {!notificationSettings ? (
              <p className="text-sm text-gray-500">
                Loading notification settings…
              </p>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium">
                    Delivery
                  </h3>

                  <div className="mt-3 space-y-3">
                    {[
                      [
                        "notificationsInApp",
                        "In-app notifications",
                      ],
                      [
                        "notificationsEmail",
                        "Email notifications",
                      ],
                      [
                        "notificationsPush",
                        "Push notifications",
                      ],
                    ].map(([field, label]) => (
                      <label
                        key={field}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span>{label}</span>

                        <input
                          type="checkbox"
                          checked={
                            notificationSettings[
                              field as keyof NotificationSettings
                            ]
                          }
                          disabled={
                            notificationSaving === field
                          }
                          onChange={(e) =>
                            updateNotificationSetting(
                              field as keyof NotificationSettings,
                              e.target.checked
                            )
                          }
                          className="h-5 w-5"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-5">
                  <h3 className="text-sm font-medium">
                    Reminders & alerts
                  </h3>

                  <div className="mt-3 space-y-3">
                    {[
                      ["eventReminders", "Event reminders"],
                      ["choreReminders", "Chore reminders"],
                      ["mealReminders", "Meal reminders"],
                      [
                        "groceryReminders",
                        "Grocery reminders",
                      ],
                      ["budgetAlerts", "Budget alerts"],
                    ].map(([field, label]) => (
                      <label
                        key={field}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span>{label}</span>

                        <input
                          type="checkbox"
                          checked={
                            notificationSettings[
                              field as keyof NotificationSettings
                            ]
                          }
                          disabled={
                            notificationSaving === field
                          }
                          onChange={(e) =>
                            updateNotificationSetting(
                              field as keyof NotificationSettings,
                              e.target.checked
                            )
                          }
                          className="h-5 w-5"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
