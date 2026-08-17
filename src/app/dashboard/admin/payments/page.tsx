"use client";

import { useState, useEffect } from "react";

type MonthlyRevenue = {
  month: string;
  paying_users: string;
  transactions_count: string;
  total_revenue: string;
};

type RecentPayment = {
  id: number;
  user_name: string;
  user_email: string;
  paid_at: string;
  amount: string | number;
  currency: string;
};

type PaymentDashboardData = {
  monthlyRevenue: MonthlyRevenue[];
  summary: {
    thisMonth: string | number;
    lastMonth: string | number;
    lifetime: string | number;
  };
  recentPayments: RecentPayment[];
};

export default function PaymentsDashboardPage() {
  const [data, setData] = useState<PaymentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/payments");
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading revenue dashboard...</div>;
  }

  const { monthlyRevenue, summary, recentPayments } = data || {};

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Revenue Dashboard</h1>
      <p className="text-sm text-gray-600 mb-8">Track monthly revenue, payments, and lump-sum metrics.</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">This Month Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">PKR {Number(summary?.thisMonth || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Last Month Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">PKR {Number(summary?.lastMonth || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide relative z-10">Total Lifetime Revenue</p>
          <p className="text-3xl font-bold text-emerald-900 mt-2 relative z-10">PKR {Number(summary?.lifetime || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Breakdown */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue Breakdown</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-600">Month</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">Users</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">Txns</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-right">Lump-Sum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(!monthlyRevenue || monthlyRevenue.length === 0) ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-500">No revenue data available.</td></tr>
                ) : (
                  monthlyRevenue.map((row: MonthlyRevenue, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {new Date(row.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-center text-gray-600">{row.paying_users}</td>
                      <td className="px-5 py-4 text-center text-gray-600">{row.transactions_count}</td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900">
                        PKR {Number(row.total_revenue).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-600">User</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Date</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(!recentPayments || recentPayments.length === 0) ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-500">No recent transactions.</td></tr>
                ) : (
                  recentPayments.slice(0, 10).map((row: RecentPayment) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 truncate max-w-[150px]">{row.user_name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{row.user_email}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(row.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-emerald-600">
                        + {row.currency} {Number(row.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
