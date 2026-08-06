"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ResetClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token, email]);

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!token || !email) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: token, newPassword }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error ?? "Failed to reset password.");
        return;
      }
      
      router.push("/login?reset=success");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900/90 my-8">
      <Link href="/" className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Link>
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 min-w-16 items-center justify-center overflow-hidden rounded-full border border-gray-100 shadow-sm">
            <Image 
              alt="Pentapeaks Trade Portal Logo" 
              className="scale-110 object-cover" 
              fill 
              priority 
              src="/logo.jpeg" 
              sizes="64px"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Set New Password
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Enter a new secure password for your account.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm text-red-400 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-neutral-300">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={!token || !email}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-neutral-300">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={!token || !email}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || !token || !email}
            className="flex w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black shadow-md transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-neutral-400 hover:text-amber-500 hover:underline">
              Back to Sign in
            </Link>
          </div>
        </form>
      </div>
  );
}
