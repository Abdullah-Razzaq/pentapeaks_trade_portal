"use client";

import { useCallback, useEffect, useState } from "react";

type HsCodeRecord = {
  id: number;
  section: string;
  hs_code: string;
  description: string;
  parent: string | null;
  level: number | null;
};

export default function HsCodeExplorer() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [rows, setRows] = useState<HsCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 50;

  // Debounce the query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset to first page on new query
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const loadData = useCallback(async (searchQuery: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      params.set("page", pageNum.toString());
      params.set("limit", limit.toString());
      
      const res = await fetch(`/api/hs-codes?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load HS codes.");
      
      setRows(data.results as HsCodeRecord[]);
      setTotal(data.total as number);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load HS codes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => { await loadData(debouncedQuery, page); };
    init();
  }, [debouncedQuery, page, loadData]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>


      <div className="mb-6 flex gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by HS code or description..."
          className="w-full rounded-xl border border-gray-200 bg-white/90 backdrop-blur-md px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition hover:border-amber-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 max-w-lg"
        />
        <button
          onClick={() => { setQuery(""); setDebouncedQuery(""); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:border-amber-500 focus:ring-4 focus:ring-amber-500/20 disabled:opacity-50"
          disabled={!query}
        >
          Clear Search
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-md shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-xs font-semibold uppercase tracking-wide text-orange-700">
              <tr>
                <th className="px-4 py-3">HS Code</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    No matching HS codes found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-orange-50/40">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.hs_code}</td>
                    <td className="px-4 py-3 text-gray-600">{row.section}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xl">{row.description}</td>
                    <td className="px-4 py-3 text-gray-600">{row.level || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!error && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing {rows.length} of {total} total records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-medium text-gray-900">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
