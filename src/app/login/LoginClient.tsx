"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("verified") === "true") {
        setTimeout(() => {
          setSuccessMsg("Email verified successfully! Your 1-day free trial has officially begun.");
        }, 0);
      } else if (searchParams.get("reset") === "success") {
        setTimeout(() => {
          setSuccessMsg("Password reset successfully! Please sign in with your new password.");
        }, 0);
      } else if (searchParams.get("reason") === "timeout") {
        setTimeout(() => {
          setError("Your session expired due to inactivity. Please sign in again.");
        }, 0);
      }
    }
  }, []);

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Unable to reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md mx-4 p-6 sm:p-8 rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 bg-white dark:border-gray-200 dark:bg-white my-8">
      <Link href="/" className="absolute right-6 top-6 text-gray-600 hover:text-slate-600 dark:hover:text-gray-700 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Link>
      <div className="mb-8 flex flex-col items-center gap-4">
        <Logo />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Pentapeaks Trade Portal
            </h1>
            <p className="mt-1 text-sm text-neutral-400">Import &amp; Export Intelligence</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 px-4 text-base text-gray-900 outline-none transition focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-gray-400"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-amber-500 hover:text-amber-400 hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-4 pr-12 text-base text-gray-900 outline-none transition focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-gray-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                )}
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-400 leading-relaxed font-medium">{successMsg}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-400 leading-relaxed font-medium">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 py-3 px-4 text-base font-semibold text-black shadow-md transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-amber-500 transition-colors hover:text-amber-400">
            Sign up
          </Link>
        </p>
      </div>
  );
}
