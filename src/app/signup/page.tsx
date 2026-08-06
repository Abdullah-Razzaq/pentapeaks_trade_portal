import LandingPage from "@/components/LandingPage";
import SignupClient from "./SignupClient";

export default function SignupPage() {
  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
         <LandingPage />
      </div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4 overflow-y-auto py-12">
         <SignupClient />
      </div>
    </>
  );
}
