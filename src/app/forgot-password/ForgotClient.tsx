"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ForgotClient() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  async function handleSendCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.toLowerCase().endsWith("@gmail.com")) {
      setError("Only Gmail addresses are accepted.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error ?? "Failed to send reset code.");
        return;
      }
      
      setSuccessMsg(data.message);
      setStep(2);
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
              {step === 1 ? "Reset Password" : "Check Your Email"}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              {step === 1 ? "Enter your Gmail to receive a link" : `Reset link sent to ${email}`}
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

        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                placeholder="you@gmail.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="flex w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black shadow-md transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-neutral-400 hover:text-amber-500 hover:underline">
                Back to Sign in
              </Link>
            </div>
          </form>
        )}
        
        {step === 2 && (
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-300">
              We&apos;ve sent a password reset link to <span className="font-semibold text-white">{email}</span>. 
              Click the link in the email to set a new password.
            </p>
            <div className="pt-4">
              <Link href="/login" className="text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors">
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
  );
}
