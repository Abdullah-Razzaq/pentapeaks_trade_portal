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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">HS Code Search</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search and filter the harmonized system directory by code or description.
        </p>
      </div>

      <div className="mb-6 flex gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by HS code or description..."
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 max-w-lg"
        />
        <button
          onClick={() => { setQuery(""); setDebouncedQuery(""); setPage(1); }}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          disabled={!query}
        >
          Clear Search
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
