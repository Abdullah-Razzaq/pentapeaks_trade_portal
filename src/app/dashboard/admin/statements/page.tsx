"use client";

import { useState, useEffect } from "react";

type StatementTransaction = {
  id: number;
  paid_at: string;
  amount: string | number;
  currency: string;
  payment_method: string;
  transaction_ref: string | null;
  notes: string | null;
  user_name: string;
  user_email: string;
  plan_type: string;
  running_total: number;
};

type StatementSummary = {
  totalEarned: number;
  transactionsCount: number;
  averageValue: number;
};

export default function StatementsPage() {
  const [transactions, setTransactions] = useState<StatementTransaction[]>([]);
  const [summary, setSummary] = useState<StatementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Date selection state
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchStatement = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/statements?month=${selectedMonth}-01`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch statement", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [selectedMonth]);

  const handleDeletePayment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment record? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/admin/payments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStatement();
      } else {
        alert("Failed to delete payment.");
      }
    } catch (err) {
      console.error("Delete payment error:", err);
      alert("An error occurred while deleting.");
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Date & Time", "Transaction ID", "User", "Plan", "Payment Method", "Amount", "Running Total"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => [
        `"${new Date(t.paid_at).toLocaleString()}"`,
        `"${t.transaction_ref || '-'}"`,
        `"${t.user_name} (${t.user_email})"`,
        `"${t.plan_type.toUpperCase()}"`,
        `"${t.payment_method.replace('_', ' ')}"`,
        t.amount,
        t.running_total
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Statement_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl print:max-w-none print:m-0 print:p-0">
      
      {/* Print Header (Only visible when printing) */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold uppercase text-gray-900 tracking-wide">
          PENTAPEAKS TRADE PORTAL REVENUE LEDGER
        </h1>
        <div className="flex justify-between items-center text-xs text-gray-600 mt-2">
          <p><span className="font-semibold">Statement Period:</span> {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          <p><span className="font-semibold">Generated On:</span> {new Date().toLocaleString()}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-gray-50 border rounded text-xs">
          <div><span className="text-gray-500">Total Revenue:</span> <strong className="text-gray-900">PKR {summary?.totalEarned.toLocaleString() || 0}</strong></div>
          <div><span className="text-gray-500">Transactions:</span> <strong className="text-gray-900">{summary?.transactionsCount || 0}</strong></div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Statement & Revenue Ledger</h1>
          <p className="text-sm text-gray-600 mt-1">View itemized monthly transactions and running balances.</p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            onClick={handleExportCSV}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            onClick={handlePrintPDF}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-gray-800"
          >
            Print PDF
          </button>
        </div>
      </div>

      {/* Metrics Accumulator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 print:border-gray-300">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Month Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">PKR {summary?.totalEarned.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 print:border-gray-300">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.transactionsCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 print:border-gray-300">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Transaction</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">PKR {Math.round(summary?.averageValue || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-0 print:overflow-visible">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-sm print:text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 print:bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">Date & Time</th>
                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">Reference</th>
                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">User / Company</th>
                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs">Description</th>
                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs text-center">Method</th>
                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs text-right">Amount (PKR)</th>
                <th className="px-4 py-3 font-semibold text-gray-900 uppercase tracking-wider text-xs text-right bg-gray-100/50 print:bg-transparent">Running Total</th>
                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider text-xs text-center print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading statement...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No transactions found for this month.</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition print:hover:bg-transparent">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(t.paid_at).toLocaleString('en-US', { 
                        day: '2-digit', month: 'short', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {t.transaction_ref ? (
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                          {t.transaction_ref}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{t.user_name}</div>
                      <div className="text-xs text-gray-500">{t.user_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${
                        t.plan_type === 'premium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                        t.plan_type === 'pro' ? 'bg-purple-50 text-purple-600 border-purple-200' : 
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {t.plan_type}
                      </span>
                      {t.notes && <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={t.notes}>{t.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                        {t.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600 whitespace-nowrap">
                      + {Number(t.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 bg-gray-50/50 print:bg-transparent whitespace-nowrap">
                      {t.running_total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center print:hidden">
                      <button onClick={() => handleDeletePayment(t.id)} className="text-rose-500 hover:text-rose-700 transition p-1" title="Delete Payment">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {transactions.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 print:bg-gray-100">
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-right font-bold text-gray-700 uppercase tracking-wider text-xs">
                    Closing Balance for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                    + PKR {summary?.totalEarned.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-gray-900 text-lg whitespace-nowrap">
                    PKR {summary?.totalEarned.toLocaleString()}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
}
