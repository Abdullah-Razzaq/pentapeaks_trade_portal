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
  subscription_start_date: string | null;
  subscription_expires_at: string | null;
  batch: string | null;
  business_role: string | null;
  is_suspended: boolean;
};

const getAvatarStyles = (name: string, role: string) => {
  if (role === "admin") return "bg-amber-500 text-slate-950";
  const palettes = [
    "bg-amber-100 text-amber-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-purple-100 text-purple-700",
  ];
  const charCode = name.charCodeAt(0) || 0;
  return palettes[charCode % palettes.length];
};

export default function AdminUsersPanel({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  /* ── Search & Filter State ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "inactive" | "pro">("all");

  /* ── Batch Limit State ── */
  const [maxBatch, setMaxBatch] = useState<number>(15);
  const [newMaxBatch, setNewMaxBatch] = useState<string>("15");
  const [updatingBatch, setUpdatingBatch] = useState(false);


  /* ── Delete feature state ── */
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /* ── Assign Product feature state ── */
  const [assignProductUser, setAssignProductUser] = useState<User | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [assigningProduct, setAssigningProduct] = useState(false);

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

  async function toggleSuspend(user: User) {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: !user.is_suspended }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update user suspension status.");
      await loadUsers();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to update user suspension status.");
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

  const handleAssignProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignProductUser || !newProductName) return;
    setAssigningProduct(true);
    try {
      const res = await fetch("/api/admin/users/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: assignProductUser.id, productName: newProductName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign product");
      }
      setAssignProductUser(null);
      setNewProductName("");
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error assigning product");
    } finally {
      setAssigningProduct(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    // Search match
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);

    // Filter match
    let matchesFilter = true;
    if (filterType === "active") matchesFilter = u.is_active;
    if (filterType === "inactive") matchesFilter = !u.is_active;
    if (filterType === "pro") matchesFilter = u.plan_type === "pro" || u.plan_type === "premium";

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-gray-900">Manage Users</h1>
      <p className="mt-1 text-sm text-gray-600">
        View all registered users and control who can access the portal.
      </p>

      <div className="mt-6 flex flex-col md:flex-row gap-6">
        {/* Global Batch Limit Settings Card */}
        <div className="flex-1 rounded-2xl border border-gray-200 bg-white backdrop-blur-md p-5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Current Batch Limit</h2>
              <p className="text-xs text-gray-600 mt-1">Maximum batch number available for new signups.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="100"
                value={newMaxBatch}
                onChange={(e) => setNewMaxBatch(e.target.value)}
                className="w-20 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900 placeholder:text-gray-500 disabled:text-gray-500 opacity-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                onClick={handleUpdateBatchLimit}
                disabled={updatingBatch || parseInt(newMaxBatch, 10) === maxBatch}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingBatch ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex-[2] rounded-2xl border border-gray-200 bg-white backdrop-blur-md p-5 shadow-sm flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-sm placeholder:text-gray-500"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFilterType("all")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filterType === "all" ? "bg-amber-500 text-slate-950 border border-amber-500" : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"}`}>All Users</button>
            <button onClick={() => setFilterType("active")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filterType === "active" ? "bg-amber-500 text-slate-950 border border-amber-500" : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"}`}>Active</button>
            <button onClick={() => setFilterType("inactive")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filterType === "inactive" ? "bg-amber-500 text-slate-950 border border-amber-500" : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"}`}>Inactive</button>
            <button onClick={() => setFilterType("pro")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filterType === "pro" ? "bg-amber-500 text-slate-950 border border-amber-500" : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"}`}>Pro / Premium</button>
          </div>
        </div>
      </div>


      <div className="mt-6 w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm scrollbar-thin bg-white/50">
        <div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100/60 text-xs font-semibold uppercase tracking-wide text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">User</th>
                <th className="px-4 py-3 whitespace-nowrap">Role</th>
                <th className="px-4 py-3 whitespace-nowrap">Business Role</th>
                <th className="px-4 py-3 whitespace-nowrap">Batch</th>
                <th className="px-4 py-3 whitespace-nowrap">Plan</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Joined</th>
                <th className="px-4 py-3 whitespace-nowrap">Start Date</th>
                <th className="px-4 py-3 whitespace-nowrap">End Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Days Left</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : listError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-rose-500">
                    {listError}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100/50 transition text-gray-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold shrink-0 ${getAvatarStyles(user.name, user.role)}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-gray-900 truncate">{user.name}</span>
                          <span className="text-xs text-gray-500 truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{user.role}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{user.business_role || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{user.batch || "Not a Student"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide border ${user.plan_type === "premium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            user.plan_type === "pro" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-gray-100 text-gray-700 border-gray-300"
                          }`}
                      >
                        {user.plan_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_suspended ? (
                        <span className="rounded-full px-2.5 py-1 text-xs font-bold border bg-red-500/10 text-red-500 border-red-500/20">
                          SUSPENDED
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold border ${user.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                        >
                          {user.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {(() => {
                        if (!user.subscription_start_date) return "—";
                        return new Date(user.subscription_start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        });
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {(() => {
                        if (!user.subscription_expires_at) return "—";
                        return new Date(user.subscription_expires_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        });
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm font-medium">
                      {(() => {
                        if (!user.subscription_expires_at) return "—";
                        const daysLeft = Math.ceil((new Date(user.subscription_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysLeft > 0 ? `${daysLeft} days` : <span className="text-rose-500">Expired</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role === "admin" ? (
                        <div className="flex items-center justify-end">
                          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-400 border border-gray-200">
                            Protected (Admin)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {user.is_suspended && (
                            <button
                              onClick={() => toggleSuspend(user)}
                              disabled={togglingId === user.id}
                              title="Unsuspend User"
                              className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center h-8 whitespace-nowrap"
                            >
                              Unsuspend
                            </button>
                          )}
                          {user.plan_type !== "pro" && (
                            <button
                              onClick={() => togglePlan(user, "pro")}
                              disabled={togglingId === user.id || user.id === currentUserId}
                              title={user.id === currentUserId ? "You cannot change your own plan." : "Switch to Pro"}
                              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-400 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center h-8 whitespace-nowrap"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                              Pro
                            </button>
                          )}
                          <button
                            onClick={() => toggleActive(user)}
                            disabled={togglingId === user.id || user.id === currentUserId}
                            title={user.id === currentUserId ? "You cannot change your own status." : (user.is_active ? "Deactivate" : "Activate")}
                            className={`rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center h-8 whitespace-nowrap ${user.is_active
                                ? "hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400"
                                : "hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
                              }`}
                          >
                            {togglingId === user.id ? (
                               <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : user.is_active ? (
                              <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Lock</>
                            ) : (
                              <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg> Unlock</>
                            )}
                          </button>
                          <button
                            onClick={() => renew30Days(user)}
                            disabled={togglingId === user.id || user.id === currentUserId}
                            title={user.id === currentUserId ? "You cannot change your own status." : "Renew 30 Days"}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 border border-gray-300 text-gray-600 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400 whitespace-nowrap flex items-center justify-center h-8`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                            Renew
                          </button>
                          <button
                            onClick={() => setAssignProductUser(user)}
                            disabled={user.id === currentUserId}
                            title="Assign a product"
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 border border-gray-300 text-gray-600 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-400 whitespace-nowrap flex items-center justify-center h-8"
                          >
                            + Add Product
                          </button>
                          <button
                            onClick={() => setDeleteConfirmUser(user)}
                            disabled={user.id === currentUserId || deletingId === user.id}
                            title={user.id === currentUserId ? "You cannot delete your own account." : "Delete user permanently"}
                            className="rounded-lg border border-gray-300 text-gray-500 transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center w-8 h-8 shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M3 6h18" />
                              <path d="M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6" />
                              <path d="M10 11v5" />
                              <path d="M14 11v5" />
                            </svg>
                          </button>
                        </div>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm px-4 transition-all">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                Delete User
              </h2>
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="text-gray-500 transition hover:text-gray-700 rounded-full hover:bg-gray-100 p-1"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to permanently delete <span className="font-bold text-gray-900">{deleteConfirmUser.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === deleteConfirmUser.id}
                onClick={() => handleDelete(deleteConfirmUser.id)}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-rose-700 shadow-sm shadow-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center"
              >
                {deletingId === deleteConfirmUser.id ? (
                  <svg className="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  "Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Product Modal ── */}
      {assignProductUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm px-4 transition-all">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Assign Product
              </h2>
              <button
                onClick={() => setAssignProductUser(null)}
                className="text-gray-500 transition hover:text-gray-700 rounded-full hover:bg-gray-100 p-1"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleAssignProduct}>
              <p className="text-sm text-gray-600 mb-4">
                Assign a product to <span className="font-bold text-gray-900">{assignProductUser.name}</span>.
              </p>
              <input
                type="text"
                placeholder="Product Name (e.g. Rice, Cement)"
                required
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-purple-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAssignProductUser(null)}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningProduct}
                  className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center"
                >
                  {assigningProduct ? "Assigning..." : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
