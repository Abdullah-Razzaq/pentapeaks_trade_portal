"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChangePasswordModal from "./ChangePasswordModal";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AccountActions({
  user,
}: {
  user: { name: string; role: "admin" | "user" };
}) {
  const router = useRouter();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="fixed bottom-5 left-5 z-40 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-lg">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-600">
            {getInitials(user.name) || "U"}
          </div>
          <div className="min-w-0">
            <p className="whitespace-nowrap text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-orange-500">{user.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="whitespace-nowrap rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-semibold text-orange-600 transition hover:border-orange-300 hover:bg-orange-100"
          >
            Change Password
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100"
          >
            Sign Out
          </button>
        </div>
      </div>

      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </>
  );
}
