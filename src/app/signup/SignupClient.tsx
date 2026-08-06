"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function SignupClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batch, setBatch] = useState("Not a Student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [maxBatch, setMaxBatch] = useState(15);
  
  // Step 2 state
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

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
      setStep(2);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid verification code.");
        return;
      }
      // Verification successful, show message briefly then redirect
      setSuccessMsg("Email verified successfully! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500); // 1.5s delay to let them see the message
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  const batchOptions = [
    "Not a Student",
    ...Array.from({ length: maxBatch }, (_, i) => `Batch ${i + 1}`)
  ];

  return (
    <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-gray-200 dark:bg-white my-8">
      <Link href="/" className="absolute right-6 top-6 text-gray-600 hover:text-slate-600 dark:hover:text-gray-700 transition-colors">
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {step === 1 ? "Create an Account" : "Verify Your Email"}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              {step === 1 ? "Sign up for your free trial" : `We sent a 6-digit code to ${email}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm text-red-400 font-medium">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 p-4 transition-all duration-300">
            <p className="text-sm text-green-400 font-medium">{successMsg}</p>
          </div>
        )}

        {step === 1 ? (
        <>
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
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-gray-400"
              placeholder="Ali"
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
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-gray-400"
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
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 [&>option]:bg-white"
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
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-gray-400"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-neutral-500">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black shadow-md transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-amber-500 transition-colors hover:text-amber-400">
            Sign in
          </Link>
        </p>
        </>
        ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium text-gray-700">
              6-Digit Verification Code
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-center text-2xl tracking-widest text-gray-900 outline-none transition focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-gray-400"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="flex w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black shadow-md transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {verifying ? (
              <svg className="h-5 w-5 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : "Verify Email"}
          </button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setStep(1); setError(null); }}
              className="text-sm text-neutral-400 hover:text-amber-500 hover:underline"
            >
              Back to Sign up
            </button>
          </div>
        </form>
        )}
      </div>
  );
}
