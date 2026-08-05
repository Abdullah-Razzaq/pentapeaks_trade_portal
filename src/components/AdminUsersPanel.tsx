"use client";

import { useEffect, useState } from "react";

type Role = "admin" | "user";

type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  plan_type: "trial" | "pro" | "premium";
  subscription_expires_at: string | null;
  batch: string | null;
};


export default function AdminUsersPanel({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  /* ── Batch Limit State ── */
  const [maxBatch, setMaxBatch] = useState<number>(15);
  const [newMaxBatch, setNewMaxBatch] = useState<string>("15");
  const [updatingBatch, setUpdatingBatch] = useState(false);


  /* ── Delete feature state ── */
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadUsers(isInitialLoad = false) {
    if (!isInitialLoad) {
      setLoading(true);
      setListError(null);
    }
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load users.");
      setUsers(data.users as User[]);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const init = async () => {
      await loadUsers(true);
      try {
        const res = await fetch("/api/admin/settings/batch-limit");
        if (res.ok) {
          const data = await res.json();
          setMaxBatch(data.current_max_batch);
          setNewMaxBatch(data.current_max_batch.toString());
        }
      } catch { }
    };
    init();
  }, []);

  async function handleUpdateBatchLimit() {
    setUpdatingBatch(true);
    try {
      const res = await fetch("/api/admin/settings/batch-limit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_max_batch: parseInt(newMaxBatch, 10) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update limit.");
      setMaxBatch(data.current_max_batch);
      alert("Batch limit updated successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating batch limit.");
    } finally {
      setUpdatingBatch(false);
    }
  }


  async function toggleActive(user: User) {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update user.");
      await loadUsers();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setTogglingId(null);
    }
  }

  async function togglePlan(user: User, newPlan: "trial" | "pro" | "premium") {
    setTogglingId(user.id);
    if (!window.confirm(`Are you sure you want to switch ${user.name} to the ${newPlan.toUpperCase()} plan?`)) {
      setTogglingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: newPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update user plan.");
      await loadUsers();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to update user plan.");
    } finally {
      setTogglingId(null);
    }
  }

  /* ── Delete handler ── */
  async function handleDelete(userId: number) {
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete user.");
      setDeleteConfirmUser(null);
      await loadUsers();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to delete user.");
      setDeleteConfirmUser(null);
    } finally {
      setDeletingId(null);
    }
  }

  async function renew30Days(user: User) {
    if (!window.confirm(`Are you sure you want to renew ${user.name}'s subscription for 30 days?`)) return;
    try {
      setTogglingId(user.id);
      const res = await fetch(`/api/admin/users/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to renew user.");
      await loadUsers();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to renew user.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-gray-900">Manage Users</h1>
      <p className="mt-1 text-sm text-gray-500">
        View all registered users and control who can access the portal.
      </p>

      {/* Global Batch Limit Settings Card */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-black">Current Batch Limit</h2>
          <p className="text-xs text-gray-500">Maximum batch number available for new signups.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="100"
            value={newMaxBatch}
            onChange={(e) => setNewMaxBatch(e.target.value)}
            className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-black placeholder:text-black disabled:text-black opacity-100 outline-none transition focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          />
          <button
            onClick={handleUpdateBatchLimit}
            disabled={updatingBatch || parseInt(newMaxBatch, 10) === maxBatch}
            className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updatingBatch ? "Saving..." : "Update"}
          </button>
        </div>
      </div>


      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-xs font-semibold uppercase tracking-wide text-orange-700">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Days Left</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : listError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-red-500">
                    {listError}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-orange-50/40">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{user.role}</td>
                    <td className="px-4 py-3 text-gray-600">{user.batch || "Not a Student"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${user.plan_type === "premium" ? "bg-amber-100 text-amber-700" :
                            user.plan_type === "pro" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {user.plan_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {(() => {
                        if (!user.subscription_expires_at) return "—";
                        const daysLeft = Math.ceil((new Date(user.subscription_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysLeft > 0 ? `${daysLeft} days` : "Expired";
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(user.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {(() => {
                        if (!user.subscription_expires_at) return "—";
                        return new Date(user.subscription_expires_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        });
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">

                        {user.plan_type !== "pro" && (
                          <button
                            onClick={() => togglePlan(user, "pro")}
                            disabled={togglingId === user.id || user.id === currentUserId}
                            title={user.id === currentUserId ? "You cannot change your own plan." : undefined}
                            className="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-semibold text-purple-600 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
                          >
                            Switch to Pro
                          </button>
                        )}
                        {user.plan_type !== "premium" && (
                          <button
                            onClick={() => alert("Premium is coming soon and not yet available.")}
                            disabled={togglingId === user.id || user.id === currentUserId}
                            title={user.id === currentUserId ? "You cannot change your own plan." : undefined}
                            className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
                          >
                            Switch to Premium
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={togglingId === user.id || user.id === currentUserId}
                          title={user.id === currentUserId ? "You cannot change your own status." : undefined}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${user.is_active
                              ? "border border-red-200 text-red-600 hover:bg-red-50"
                              : "border border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                        >
                          {togglingId === user.id ? "..." : user.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => renew30Days(user)}
                          disabled={togglingId === user.id || user.id === currentUserId}
                          title={user.id === currentUserId ? "You cannot change your own status." : "Renew 30 Days"}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 border border-blue-200 text-blue-600 hover:bg-blue-50 whitespace-nowrap`}
                        >
                          Renew 30 Days
                        </button>
                        <button
                          onClick={() => setDeleteConfirmUser(user)}
                          disabled={user.id === currentUserId || deletingId === user.id}
                          title={user.id === currentUserId ? "You cannot delete your own account." : "Delete user permanently"}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6" />
                            <path d="M10 11v5" />
                            <path d="M14 11v5" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Delete User</h2>
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="text-gray-400 transition hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-gray-900">{deleteConfirmUser.name}</span>? This
              action cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === deleteConfirmUser.id}
                onClick={() => handleDelete(deleteConfirmUser.id)}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === deleteConfirmUser.id ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
