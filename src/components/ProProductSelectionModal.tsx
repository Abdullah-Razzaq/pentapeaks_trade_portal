"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ProProductSelectionModal() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<{label: string, value: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2 && !isFocused) {
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.categories || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isFocused]);

  const addProduct = (product: string) => {
    if (selectedProducts.length < 5 && !selectedProducts.includes(product)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    setQuery("");
    setSuggestions([]);
  };

  const removeProduct = (product: string) => {
    setSelectedProducts(selectedProducts.filter(p => p !== product));
  };

  const saveProducts = async () => {
    if (selectedProducts.length !== 5) {
      setError("Please select exactly 5 products.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/pro-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: selectedProducts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save products.");
      
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-visible flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-2">
          <h3 className="text-xl font-bold text-gray-900">Welcome to Pentapeaks Pro</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            As a Pro member, you have access to full verified data for <strong className="text-purple-600">5 products</strong>. 
            Please search and select the 5 product categories you want to focus on. 
            <br/><span className="text-rose-500 font-medium">Note: Once saved, this cannot be changed without contacting support.</span>
          </p>
        </div>

        <div className="px-6 py-6 flex flex-col gap-5">
          <div className="relative" ref={searchRef}>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Search Products (HS Categories)</label>
            <input
              type="text"
              value={query}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length < 2) {
                  // We let the effect fetch top 10 since isFocused is true
                }
              }}
              placeholder="Search by name or HS code..."
              disabled={selectedProducts.length >= 5}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
            {loading && (
              <div className="absolute right-3 top-[38px] text-gray-400">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-xl">
                {suggestions.slice(0, 10).map((suggestion) => (
                  <button
                    key={suggestion.value}
                    onClick={() => addProduct(suggestion.value)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition border-b border-gray-50 last:border-0"
                  >
                    {suggestion.label}
                  </button>
                ))}
                {query.length < 2 && (
                  <div className="w-full text-left px-4 py-3 text-sm text-gray-400 italic bg-gray-50 rounded-b-xl border-t border-gray-100">
                    Type to search more commodities...
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">Selected Products</label>
              <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded-lg">
                {selectedProducts.length} / 5
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 min-h-[140px] flex flex-col gap-2">
              {selectedProducts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400 italic">
                  No products selected yet.
                </div>
              ) : (
                selectedProducts.map((p) => (
                  <div key={p} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <span className="text-sm text-gray-800 font-medium truncate pr-4">
                      {p}
                    </span>
                    <button 
                      onClick={() => removeProduct(p)}
                      className="text-gray-400 hover:text-rose-500 transition p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex justify-end">
          <button
            onClick={saveProducts}
            disabled={selectedProducts.length !== 5 || saving}
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? "Saving..." : "Confirm & Unlock Dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
