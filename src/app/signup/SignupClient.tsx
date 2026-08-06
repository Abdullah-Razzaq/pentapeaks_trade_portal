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
  const [showPassword, setShowPassword] = useState(false);
  const [maxBatch, setMaxBatch] = useState(15);
  const [verificationCode, setVerificationCode] = useState("");
  
  // Step 2 state
  const [step, setStep] = useState<1 | 2>(1);
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

  async function handleVerifySubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid verification code.");
        return;
      }
      setSuccessMsg("Email verified successfully! Your 1-day free trial has officially begun.");
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 1500);
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-3 pr-12 text-sm text-gray-900 outline-none transition focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-gray-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">Minimum 6 characters</p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
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
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Check Your Email</h3>
          <p className="text-sm text-gray-600">
            Enter the 6-digit verification code sent to your email address.
          </p>
          <div className="pt-2">
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="mb-1 block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-center tracking-widest text-lg font-mono text-gray-900 outline-none transition focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-gray-300"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              <button
                type="button"
                onClick={handleVerifySubmit}
                disabled={loading || verificationCode.length !== 6}
                className="flex w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black shadow-md transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <Link href="/login" className="text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors">
              Return to Login
            </Link>
          </div>
        </div>
        )}
      </div>
  );
}
