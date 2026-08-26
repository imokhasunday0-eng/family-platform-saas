"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const [info, setInfo] = useState<string>("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/join?token=" + token).then(async (r) => {
      if (r.ok) setInfo((await r.json()).familyName);
      else setErr("This invite link is invalid or has been used.");
    });
  }, [token]);

  const accept = async () => {
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) { setDone(true); setTimeout(() => router.push("/dashboard"), 1500); }
    else setErr((await res.json()).error || "Failed to join");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-indigo-50 p-6 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg dark:border-white/10 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">✉️ Family Invite</h1>
        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
        {!err && !done && (
          <>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              You&apos;ve been invited to join <strong>{info}</strong>
            </p>
            <button onClick={accept}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700">
              Accept invitation
            </button>
          </>
        )}
        {done && <p className="mt-4 text-green-600">🎉 Joined! Taking you to your family…</p>}
      </div>
    </main>
  );
}
