"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batch, setBatch] = useState("Not a Student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [maxBatch, setMaxBatch] = useState(15);

  useEffect(() => {
    fetch("/api/admin/settings/batch-limit")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.current_max_batch) {
          setMaxBatch(data.current_max_batch);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, batch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/login?signup=success");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const batchOptions = [
    "Not a Student",
    ...Array.from({ length: maxBatch }, (_, i) => `Batch ${i + 1}`)
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-orange-100 bg-white p-8 shadow-sm my-8">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 min-w-16 items-center justify-center overflow-hidden rounded-full border-2 border-gray-900 shadow-sm">
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Create an Account
            </h1>
            <p className="mt-1 text-sm text-gray-500">Sign up for your free trial</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              placeholder="John Doe"
            />
          </div>

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
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              placeholder="you@gmail.com"
            />
          </div>

          <div>
            <label htmlFor="batch" className="mb-1 block text-sm font-medium text-gray-700">
              Student Batch
            </label>
            <select
              id="batch"
              value={batch}
              onChange={(event) => setBatch(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
            >
              {batchOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
          </div>

          {error && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-orange-800 leading-relaxed font-medium">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
