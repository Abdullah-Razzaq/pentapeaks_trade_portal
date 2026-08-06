import LandingPage from "@/components/LandingPage";
import ForgotClient from "./ForgotClient";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
         <LandingPage />
      </div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-md px-4 overflow-y-auto py-12">
         <ForgotClient />
      </div>
    </>
  );
}
