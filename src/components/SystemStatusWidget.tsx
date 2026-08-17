"use client";

import { useEffect, useState } from "react";

type HealthStatus = {
  database: "operational" | "degraded";
  api: "operational" | "degraded";
  dataPipeline: "operational" | "degraded";
};

export default function SystemStatusWidget() {
  const [status, setStatus] = useState<HealthStatus>({
    database: "operational",
    api: "operational",
    dataPipeline: "operational"
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        } else {
          // If the API itself fails, mark everything degraded
          setStatus({
            database: "degraded",
            api: "degraded",
            dataPipeline: "degraded"
          });
        }
      } catch {
        setStatus({
          database: "degraded",
          api: "degraded",
          dataPipeline: "degraded"
        });
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
    
    // Poll every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getBadge = (state: "operational" | "degraded") => {
    if (loading) {
      return <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">Checking</span>;
    }
    
    if (state === "operational") {
      return <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Operational</span>;
    }
    
    return <span className="text-rose-600 font-bold text-[10px] uppercase tracking-wider bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">Degraded</span>;
  };

  const getDot = (state: "operational" | "degraded") => {
    if (loading) return "bg-gray-300 animate-pulse";
    return state === "operational" ? "bg-emerald-500" : "bg-rose-500 animate-pulse";
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#17233D] mb-4">System Status</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[#64748B] font-medium text-sm flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getDot(status.database)}`}></span> 
            Database
          </span>
          {getBadge(status.database)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#64748B] font-medium text-sm flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getDot(status.api)}`}></span> 
            API Services
          </span>
          {getBadge(status.api)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#64748B] font-medium text-sm flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getDot(status.dataPipeline)}`}></span> 
            Data Pipeline
          </span>
          {getBadge(status.dataPipeline)}
        </div>
      </div>
    </div>
  );
}
