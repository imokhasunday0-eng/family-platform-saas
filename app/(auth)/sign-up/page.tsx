"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Unable to create account");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-primary">Family Platform</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create your family workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">Start with one account. Add family members later.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input className="h-11 w-full rounded-lg border bg-background px-3 outline-none ring-primary focus:ring-2" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="h-11 w-full rounded-lg border bg-background px-3 outline-none ring-primary focus:ring-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="h-11 w-full rounded-lg border bg-background px-3 outline-none ring-primary focus:ring-2" type="password" placeholder="Password (8+ characters)" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button disabled={loading} className="h-11 w-full rounded-lg bg-primary px-4 font-medium text-primary-foreground disabled:opacity-60">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link className="font-medium text-foreground underline" href="/sign-in">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
