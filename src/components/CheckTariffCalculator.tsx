"use client";

import { useState } from "react";

type TariffDetails = {
  customsDuty: number;
  salesTax: number;
  additionalDuty: number;
  totalDuty: number;
  tradeAgreement: string;
};

type TariffResult = {
  exportCountry: string;
  importCountry: string;
  hsCode: string;
  details: TariffDetails;
};

import Combobox from "./Combobox";
import { ALL_COUNTRIES } from "@/lib/countryCodes";




export default function CheckTariffCalculator() {
  const [exportCountry, setExportCountry] = useState("");
  const [importCountry, setImportCountry] = useState("");
  const [hsCode, setHsCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TariffResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hsOptions, setHsOptions] = useState<string[]>([]);
  


  const fetchHsCodes = async (query: string) => {
    if (!query || query.length < 2) {
      setHsOptions([]);
      return;
    }
    try {
      const res = await fetch(`/api/hs-codes/search?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // data.hsCodes contains {code, description}
        // we'll format them as "1001.99 - Wheat description" for the combobox
        const formatted = data.hsCodes.map((item: { code: string; description: string }) => `${item.code} - ${item.description}`);
        setHsOptions(formatted);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isValidCountry = (countryName: string) => {
    return ALL_COUNTRIES.some(c => c.name.toLowerCase() === countryName.trim().toLowerCase());
  };

  const isExportValid = exportCountry === "" || isValidCountry(exportCountry);
  const isImportValid = importCountry === "" || isValidCountry(importCountry);
  
  const sanitizedHs = hsCode.replace(/\./g, "");
  const isHsValid = hsCode === "" || /^\d{4,10}$/.test(sanitizedHs);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportCountry || !importCountry || !hsCode) {
      setError("Please fill in all fields.");
      return;
    }
    
    if (!isValidCountry(exportCountry) || !isValidCountry(importCountry)) {
      setError("Please enter a valid country name.");
      return;
    }

    if (!isHsValid) {
      setError("Please enter a valid 4 to 10 digit HS/PCT Code (e.g., 1001.99 or 1001.9900).");
      return;
    }

    if (exportCountry.trim().toLowerCase() === importCountry.trim().toLowerCase()) {
      setError("Exporting and Importing countries cannot be the same. Please select two different trade partners.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const tariffRes = await fetch(`/api/tariff?export_country=${exportCountry}&import_country=${importCountry}&hs_code=${encodeURIComponent(hsCode)}`);
      const tariffData = await tariffRes.json();
      if (!tariffRes.ok) throw new Error(tariffData.error || "Failed to fetch tariff data.");
      setResult(tariffData as TariffResult);


    } catch (err) {
      setError(err instanceof Error ? err.message : "Error calculating tariff.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Calculate Tariff & Duty Rates</h2>
      
      <form onSubmit={handleCalculate} className="grid gap-6 sm:grid-cols-4 items-end mb-8">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">Exporting Country</label>
          <Combobox
            value={exportCountry}
            onChange={setExportCountry}
            options={ALL_COUNTRIES.map(c => c.name)}
            placeholder="Type exporting country..."
            className={!isExportValid ? "[&>input]:border-red-400 [&>input]:focus:ring-red-100" : ""}
          />
          {!isExportValid && <span className="mt-1 text-xs text-red-500">Please enter a valid country name.</span>}
        </div>

        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">Importing Country</label>
          <Combobox
            value={importCountry}
            onChange={setImportCountry}
            options={ALL_COUNTRIES.map(c => c.name)}
            placeholder="Type importing country..."
            className={!isImportValid ? "[&>input]:border-red-400 [&>input]:focus:ring-red-100" : ""}
          />
          {!isImportValid && <span className="mt-1 text-xs text-red-500">Please enter a valid country name.</span>}
        </div>

        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">HS Code (e.g. 1001.99)</label>
          <Combobox
            value={hsCode}
            onChange={(val) => {
              // Extract just the code part if they selected from dropdown (e.g. "1001.9900 - Wheat" -> "1001.9900")
              const codeMatch = val.split(" - ")[0];
              setHsCode(codeMatch);
            }}
            onInputChange={fetchHsCodes}
            options={hsOptions}
            placeholder="Enter HS code"
            className={!isHsValid ? "[&>input]:border-red-400 [&>input]:focus:ring-red-100" : ""}
          />
          {!isHsValid && <span className="mt-1 text-xs text-red-500">Please enter a valid 4 to 10 digit HS/PCT Code (e.g., 1001.99 or 1001.9900).</span>}
        </div>

        <button
          type="submit"
          disabled={loading || !exportCountry || !importCountry || !hsCode || !isExportValid || !isImportValid || !isHsValid || (exportCountry.trim().toLowerCase() === importCountry.trim().toLowerCase())}
          className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Calculating..." : "Calculate Tariff"}
        </button>
      </form>
      
      {exportCountry.trim() !== "" && importCountry.trim() !== "" && exportCountry.trim().toLowerCase() === importCountry.trim().toLowerCase() && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          Exporting and importing countries cannot be the same.
        </div>
      )}



      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm mb-6 border border-red-200">
          <div className="font-semibold mb-1 text-red-800">No Verified Customs Record Found</div>
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Tariff Breakdown</h3>
            <p className="text-sm text-gray-500 mt-1">
              Corridor: {result.exportCountry} ➔ {result.importCountry} | HS Code: {result.hsCode}
            </p>
          </div>
          
          <div className="p-6">
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              {result.details.tradeAgreement}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 text-center">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Customs Duty</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{result.details.customsDuty}%</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 text-center">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Sales Tax / VAT</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{result.details.salesTax}%</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 text-center">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Additional Duty</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{result.details.additionalDuty}%</p>
              </div>
              <div className="p-4 rounded-xl border border-orange-200 bg-orange-50 text-center shadow-sm">
                <p className="text-xs uppercase tracking-wider text-orange-700 font-medium">Total Est. Protection</p>
                <p className="mt-2 text-2xl font-bold text-orange-600">{result.details.totalDuty}%</p>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
