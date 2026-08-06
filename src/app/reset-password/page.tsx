import ResetClient from "./ResetClient";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reset Password | Pentapeaks Trade Portal",
  description: "Set a new secure password for your Pentapeaks account.",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-black px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('/images/img2.jfif')] bg-cover bg-center bg-no-repeat opacity-20 mix-blend-overlay"></div>
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <ResetClient />
      </Suspense>
    </div>
  );
}
