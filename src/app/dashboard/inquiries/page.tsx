"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Inquiry = {
  id: number;
  description: string;
  country_name: string;
  country_code: string;
  created_at: string;
};

const COUNTRIES = [
  { code: "AE", name: "United Arab Emirates" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "CN", name: "China" },
  { code: "TR", name: "Turkey" },
  { code: "PK", name: "Pakistan" },
  { code: "IN", name: "India" },
  { code: "BD", name: "Bangladesh" },
  { code: "LK", name: "Sri Lanka" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "SG", name: "Singapore" },
  { code: "VN", name: "Vietnam" },
  { code: "PH", name: "Philippines" },
  { code: "TH", name: "Thailand" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Peru" },
  { code: "CO", name: "Colombia" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "PL", name: "Poland" },
  { code: "RU", name: "Russia" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
];

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiries = () => {
    fetch("/api/inquiries")
      .then((res) => res.json())
      .then((data) => {
        if (data.inquiries) {
          setInquiries(data.inquiries);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data?.user?.role === "admin");
        fetchInquiries();
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !countryCode) {
      setError("Please fill out all fields.");
      return;
    }

    const countryObj = COUNTRIES.find((c) => c.code === countryCode);
    if (!countryObj) {
      setError("Invalid country selected.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          description, 
          country_name: countryObj.name, 
          country_code: countryObj.code 
        }),
      });
      if (!res.ok) throw new Error("Failed to create inquiry");
      
      setIsModalOpen(false);
      setDescription("");
      setCountryCode("");
      fetchInquiries(); // Refresh grid
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      const res = await fetch(`/api/inquiries?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchInquiries();
      } else {
        alert("Failed to delete inquiry.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting inquiry.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading inquiries...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trade Inquiries</h1>
          <p className="mt-1 text-sm text-gray-500">
            View active inquiries from global buyers.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-400 hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Inquiry
          </button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {inquiries.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">No active inquiries</h3>
            <p className="mt-1 text-gray-500">Check back later for new trade opportunities.</p>
          </div>
        ) : (
          inquiries.map((inq) => (
            <div key={inq.id} className="group relative flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-6 w-8 overflow-hidden rounded shadow-sm border border-gray-100">
                      <Image
                        src={"https://flagcdn.com/w40/" + inq.country_code.toLowerCase() + ".png"}
                        alt={inq.country_name}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <span className="font-semibold text-gray-900">{inq.country_name}</span>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(inq.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Inquiry"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  )}
                </div>
                <p className="text-gray-700 mb-4 text-sm leading-relaxed whitespace-pre-wrap">{inq.description}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Posted {new Date(inq.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Add New Trade Inquiry</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Country</label>
                <div className="relative">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-10 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                    required
                  >
                    <option value="">Select a country...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    {countryCode ? (
                      <div className="relative h-5 w-6 overflow-hidden rounded shadow-sm">
                        <Image src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </div>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., Seeking suppliers for Grade A basmati rice. Order volume: 2 containers per month."
                  className="h-32 w-full rounded-xl border border-gray-300 bg-white p-4 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 resize-none"
                  required
                />
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-400 disabled:opacity-70"
                >
                  {submitting ? "Posting..." : "Post Inquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
