"use client";

import { useEffect, useState } from "react";

type ActivityLog = {
  id: string;
  dataset_name: string;
  file_size: string;
  records_processed: number;
  status: string;
  created_at: string;
};

export default function RecentDataActivity() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 5;

  useEffect(() => {
    async function fetchLogs() {
      try {
        const offset = (page - 1) * limit;
        const res = await fetch(`/api/admin/recent-activity?limit=${limit}&offset=${offset}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          setTotalLogs(data.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch recent activity logs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [page, limit]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return;
    try {
      const res = await fetch(`/api/admin/recent-activity?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Optimistically remove from state or trigger re-fetch.
        // For simplicity, just triggering a re-fetch of current page:
        setLoading(true);
        const offset = (page - 1) * limit;
        const fetchRes = await fetch(`/api/admin/recent-activity?limit=${limit}&offset=${offset}`);
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          setLogs(data.logs || []);
          setTotalLogs(data.total || 0);
        }
        setLoading(false);
      } else {
        alert("Failed to delete log");
      }
    } catch (error) {
      console.error("Failed to delete log:", error);
      alert("Error deleting log");
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    
    return `${diffInDays} days ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">Completed</span>;
      case "Processing":
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-bold">Processing</span>;
      case "Failed":
        return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-xs font-bold">Failed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-[#17233D] mb-4">Recent Data Activity</h2>
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#F7F9FC] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-6 py-3 font-semibold text-[#64748B]">Dataset</th>
              <th className="px-6 py-3 font-semibold text-[#64748B]">Status</th>
              <th className="px-6 py-3 font-semibold text-[#64748B]">Time</th>
              <th className="px-6 py-3 font-semibold text-[#64748B] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[#64748B]">Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[#64748B]">No recent activity found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-[#17233D] font-medium truncate max-w-[200px]" title={log.dataset_name}>
                      {log.dataset_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {log.file_size} • {log.records_processed.toLocaleString()} records
                    </p>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                  <td className="px-6 py-4 text-[#64748B]">{getRelativeTime(log.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(log.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                      title="Delete log"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Slider */}
        {totalLogs > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[#E5E7EB] bg-white gap-4">
            <span className="text-sm text-[#64748B]">
              Showing {Math.min((page - 1) * limit + 1, totalLogs)} to {Math.min(page * limit, totalLogs)} of {totalLogs} records
            </span>
            {Math.ceil(totalLogs / limit) > 1 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Page {page} of {Math.ceil(totalLogs / limit)}
                </span>
                <input 
                  type="range" 
                  min="1" 
                  max={Math.ceil(totalLogs / limit)} 
                  value={page} 
                  onChange={(e) => setPage(parseInt(e.target.value))} 
                  className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
