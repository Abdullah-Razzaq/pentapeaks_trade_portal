"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { generateClientExcel } from "../lib/generateExcel";
import Combobox from "./Combobox";
import { UserExportToolbar } from "./UserExportToolbar";
import { getStandardUserFilename } from "../lib/exportUtils";
import { useUserQuota } from "../hooks/useUserQuota";

type Row = {
  id: number;
  company: string;
  ntn?: string | null;
  country: string | null;
  counterparty?: string;
  pct?: number | string | null;
  qty?: number | string | null;
  unit?: string | null;
  description: string;
  value_pkr: number | string | null;
  shipment_date: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
};

type ProductStatus = {
  chapter: string;
  label: string;
  shipments: number;
  buyers: number;
  suppliers: number;
  countriesServed: number;
  totalValuePkr: number;
  firstShipment: string | null;
  lastShipment: string | null;
  topBuyers: { company: string; shipments: number; total_value_pkr: number }[];
  topSuppliers: { company: string; shipments: number; total_value_pkr: number }[];
  topCountries: { country: string; shipments: number; total_value_pkr: number }[];
};

type Mode = "buyer" | "supplier";
type SortOrder = "value_desc" | "value_asc" | "az" | "za" | "date_asc" | "date_desc";

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-orange-100 bg-orange-50/50 px-2.5 py-2.5 sm:px-4 sm:py-3 print:border-gray-300 print:bg-white overflow-hidden">
      <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-orange-600 print:text-gray-800 truncate">{label}</p>
      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold text-gray-900 truncate">{value}</p>
    </div>
  );
}

export default function CompanyExplorer({ mode, userRole }: { mode: Mode; userRole?: string }) {
  const { subscriptionExpiresAt, refreshQuota, planType } = useUserQuota();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [product, setProduct] = useState(searchParams.get("product") || "");
  const [destinationCountry, setDestinationCountry] = useState(searchParams.get("destinationCountry") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") || "");
  const [sort, setSort] = useState<SortOrder>((searchParams.get("sort") as SortOrder) || "date_asc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const limit = 50;
  const isSortingDisabled = planType === "trial" && userRole !== "admin";
  const isCompanyFilterDisabled = planType === "trial" && userRole !== "admin";
  const isDestinationFilterDisabled = planType === "trial" && userRole !== "admin";
  const isTrial = planType === "trial" && userRole !== "admin";
  const isProductSearchLocked = isTrial;
  
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hsCodeFilter = searchParams.get("hsCodeFilter") || "";
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isScrolledToRight, setIsScrolledToRight] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [showMobileTip, setShowMobileTip] = useState(true);

  const handleScroll = () => {
    if (!tableContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
    // Buffer of 10px to account for decimal scaling
    setIsScrolledToRight(Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 10);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [rows]);

  const [status, setStatus] = useState<ProductStatus | null>(null);
  // Removed unused statusLoading state
  const [statusError, setStatusError] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  const endpoint = mode === "buyer" ? "/api/trade/buyers" : "/api/trade/suppliers";

  const load = useCallback(
    async (companyTerm: string, productTerm: string, countryTerm: string, hsCodeTerm: string, dateFromTerm: string, dateToTerm: string, sortOrder: SortOrder, pageNum: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (companyTerm) params.set("company", companyTerm);
        if (productTerm) params.set("product", productTerm);
        if (countryTerm) params.set("destination_country", countryTerm);
        if (hsCodeTerm) params.set("hs_code", hsCodeTerm);
        if (dateFromTerm) params.set("date_from", dateFromTerm);
        if (dateToTerm) params.set("date_to", dateToTerm);
        params.set("sort", sortOrder);
        params.set("page", pageNum.toString());
        
        const res = await fetch(`${endpoint}?${params.toString()}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          if (res.status === 403 && errorData?.error === "ACCESS_RESTRICTED") {
            setRows([]);
            setTotal(0);
            alert("Access Restricted: You can search only your selected products for this month.");
            return;
          }
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          
          const errorText = errorData?.error || `Server returned ${res.status}: ${res.statusText}`;
          console.error("API Error Response:", errorText);
          throw new Error(errorText);
        }
        const data = await res.json();
        setRows(data.results as Row[]);
        setTotal(data.total as number);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data.");
      } finally {
        setLoading(false);
      }
    },
    [endpoint, router]
  );

  useEffect(() => {
    const handle = setTimeout(() => load(query, product, destinationCountry, hsCodeFilter, dateFrom, dateTo, sort, page), 500);
    return () => clearTimeout(handle);
  }, [query, product, destinationCountry, hsCodeFilter, dateFrom, dateTo, sort, page, load]);

  // Persist to URL on explicit changes
  const updateUrlParams = useCallback((updates: Partial<{
    query: string;
    product: string;
    destinationCountry: string;
    sort: string;
    page: number;
    hsCodeFilter: string;
    date_from: string;
    date_to: string;
  }>) => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    const currentValues = {
      query, product, destinationCountry, sort, page, hsCodeFilter, date_from: dateFrom, date_to: dateTo, ...updates
    };

    const updateParam = (key: string, value: string | number) => {
      const strVal = String(value);
      if (strVal && strVal !== "1" && strVal !== "date_asc") {
        if (params.get(key) !== strVal) {
          params.set(key, strVal);
          changed = true;
        }
      } else {
        if (params.has(key) && (strVal === "" || strVal === "1" || strVal === "date_asc")) {
          params.delete(key);
          changed = true;
        } else if (params.get(key) !== strVal && strVal) {
          params.set(key, strVal);
          changed = true;
        }
      }
    };

    updateParam("query", currentValues.query);
    updateParam("product", currentValues.product);
    updateParam("destinationCountry", currentValues.destinationCountry);
    updateParam("sort", currentValues.sort);
    updateParam("page", currentValues.page);
    updateParam("hsCodeFilter", currentValues.hsCodeFilter);
    updateParam("date_from", currentValues.date_from);
    updateParam("date_to", currentValues.date_to);

    if (changed) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams, query, product, destinationCountry, sort, page, hsCodeFilter, dateFrom, dateTo]);

  // Avoid resetting page in useEffect to prevent cascading renders
  // We'll reset it directly in the input onChange handlers



  useEffect(() => {
    fetch("/api/trade/countries")
      .then((res) => res.json())
      .then((data) => setAvailableCountries(data.countries || []))
      .catch(console.error);
  }, [userRole]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const hsPrefix = product.trim();
      const countryParam = destinationCountry.trim();
      if (hsPrefix) {
        // setStatusLoading(true); // Replaced by general UI loading if needed
        setStatusError(null);
        let url = `/api/trade/product-status?hs_code=${encodeURIComponent(hsPrefix)}`;
        if (countryParam) {
          url += `&country=${encodeURIComponent(countryParam)}`;
        }
        fetch(url)
          .then(async (res) => {
            if (res.status === 401) {
              router.push("/login");
              throw new Error("Unauthorized");
            }
            if (!res.ok) {
              let errorMsg = `Server returned ${res.status}: ${res.statusText}`;
              try {
                const errorData = await res.json();
                if (errorData.error) errorMsg = errorData.error;
              } catch {}
              throw new Error(errorMsg);
            }
            return res.json();
          })
          .then((data) => setStatus(data as ProductStatus))
          .catch((err) => {
            setStatusError(err instanceof Error ? err.message : "Failed to load product status.");
            setStatus(null);
          });
      } else {
        setStatus(null);
        setStatusError(null);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [product, destinationCountry, router]);

  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [exportStartPage, setExportStartPage] = useState<number | "">(1);
  const [exportEndPage, setExportEndPage] = useState<number | "">(1);

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string | number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = async (format: "pdf" | "excel", specificPage?: number) => {
    setDownloadError(null);
    if (format === "pdf") setIsExportingPdf(true);
    else setIsExportingExcel(true);
    try {
      const params = new URLSearchParams({
        company: query,
        product: product,
        destination_country: destinationCountry,
        hs_code: hsCodeFilter,
        date_from: dateFrom,
        date_to: dateTo,
        format: format,
        sort: sort,
      });
      
      let allRows: string[][] = [];
      let headers: string[] = [];
      
      if (userRole === "admin") {
        const start = typeof exportStartPage === "number" ? exportStartPage : 1;
        const end = typeof exportEndPage === "number" ? exportEndPage : 1;

        if (start < 1) {
          throw new Error("Start page must be at least 1.");
        }
        if (end < start) {
          throw new Error("End page must be greater than or equal to start page.");
        }
        if (end - start + 1 > 20) {
          throw new Error("You can download a maximum of 20 pages at a time. Please select a smaller page range (e.g., Page 1 to 20).");
        }
        
        params.set("startPage", start.toString());
        params.set("endPage", end.toString());
        params.set("intent", "download");
        const res = await fetch(`/api/export?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to download ${format.toUpperCase()}`);
        }
        const data = await res.json();
        allRows = data.data;
        headers = data.headers;
      } else {
        const pageToFetch = typeof specificPage === "number" ? specificPage : 1;
        if (pageToFetch < 1 || pageToFetch > (totalPages || 1)) {
          throw new Error(`Please enter a valid page number between 1 and ${totalPages || 1}`);
        }
        params.set("page", pageToFetch.toString());
        params.set("intent", "download");
        const res = await fetch(`/api/export?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          const data = await res.json().catch(() => ({}));
          const errorMsg = data.error || `Failed to download ${format.toUpperCase()}`;
          setDownloadError(errorMsg);
          
          // Re-fetch quota immediately to lock UI toolbar if limit was reached
          if (userRole !== "admin") {
            await refreshQuota();
          }
          return;
        }
        const data = await res.json();
        allRows = data.data;
        headers = data.headers;
      }
      
      // Admin might not have headers from the chunker, so let's default them if empty:
      if (!headers || headers.length === 0) {
        headers = ["Date", "Supplier", "NTN", "Buyer", "Destination", "HS Code", "Quantity", "Unit", "Description", "Value (PKR)"];
      }

      const filenamePrefix = mode === "buyer" ? "buyer_data" : "supplier_data";
      
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${filenamePrefix}_pages_${exportStartPage}_to_${exportEndPage}_${dateStr}`;
      
      let finalFilenameExcel = `${filename}.xlsx`;
      let finalFilenamePdf = `${filename}.pdf`;

      if (userRole !== "admin") {
         const pageToFetch = typeof specificPage === "number" ? specificPage : 1;
         finalFilenameExcel = getStandardUserFilename(mode === "buyer" ? "buyer" : "supplier", pageToFetch, "xlsx");
         finalFilenamePdf = getStandardUserFilename(mode === "buyer" ? "buyer" : "supplier", pageToFetch, "pdf");
      }
      
      if (format === "excel") {
        generateClientExcel(allRows, headers, finalFilenameExcel);
      } else {
        const doc = new jsPDF({ orientation: "landscape" });
        
        doc.text("Pentapeaks Trade Portal - Export", 14, 15);
        
        if (allRows && allRows.length > 0) {
          autoTable(doc, {
            head: [headers],
            body: allRows,
            startY: 20,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [30, 41, 59] },
            didDrawPage: (data) => {
              // Watermark
              doc.saveGraphicsState();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
              doc.setFontSize(35);
              doc.setTextColor(150, 150, 150);
              doc.setFont("helvetica", "bold");
              const pageWidth = doc.internal.pageSize.getWidth();
              const pageHeight = doc.internal.pageSize.getHeight();
              
              [0.25, 0.5, 0.75].forEach(yPos => {
                [0.25, 0.75].forEach(xPos => {
                  doc.text(
                    "PENTAPEAKS INTERNATIONAL",
                    pageWidth * xPos,
                    pageHeight * yPos,
                    { angle: 45, align: "center" }
                  );
                });
              });
              
              doc.restoreGraphicsState();

              // Footer
              doc.setFontSize(8);
              doc.setTextColor(128, 128, 128);
              doc.setFont("helvetica", "normal");
              doc.text(
                "© Pentapeaks International",
                data.settings.margin.left,
                doc.internal.pageSize.getHeight() - 10
              );
            }
          });
        } else {
          // Watermark
          doc.saveGraphicsState();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
          doc.setFontSize(35);
          doc.setTextColor(150, 150, 150);
          doc.setFont("helvetica", "bold");
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          
          [0.25, 0.5, 0.75].forEach(yPos => {
            [0.25, 0.75].forEach(xPos => {
              doc.text(
                "PENTAPEAKS INTERNATIONAL",
                pageWidth * xPos,
                pageHeight * yPos,
                { angle: 45, align: "center" }
              );
            });
          });
          
          doc.restoreGraphicsState();

          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
          doc.text("No shipments found.", 14, 25);
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          doc.text(
            "© Pentapeaks International",
            14,
            doc.internal.pageSize.getHeight() - 10
          );
        }
        
        doc.save(finalFilenamePdf);
      }
      if (userRole !== "admin") {
        await refreshQuota();
      }
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Error connecting to export service");
    } finally {
      setIsExportingPdf(false);
      setIsExportingExcel(false);
    }
  };

  const toggleSortValue = () => {
    setSort(prev => prev === "value_desc" ? "value_asc" : "value_desc");
  };

  const topList = mode === "buyer" ? status?.topBuyers : status?.topSuppliers;
  const topListLabel = mode === "buyer" ? "Top Buyers in This Category" : "Top Suppliers in This Category";
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="print-container">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 20px;
          }
        }
      `}} />

      <div className="hidden print-header print:block text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pentapeaks Trade Portal</h1>
        <p className="text-gray-500">
          {mode === "buyer" ? "Buyer / Importer Report" : "Supplier / Exporter Report"}
        </p>
        <p className="text-sm text-gray-400">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-end no-print">
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">

          
          {userRole === "admin" ? (
            <div className="flex flex-col items-end mt-4 sm:mt-0">
              <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
              <div className="flex items-center justify-between w-full sm:w-auto gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <span className="text-xs font-medium text-gray-700">Total Pages: {totalPages}</span>
                <div className="hidden sm:block h-4 w-px bg-gray-300 mx-1"></div>
                <div className="flex items-center">
                  <label htmlFor="exportStartPage" className="text-xs text-gray-500">From:</label>
                  <input 
                    id="exportStartPage"
                    type="number" 
                    min={1}
                    max={totalPages || 1}
                    value={exportStartPage}
                    onChange={(e) => setExportStartPage(e.target.value === "" ? "" : parseInt(e.target.value) || 1)}
                    onBlur={() => {
                      if (exportStartPage === "") setExportStartPage(1);
                    }}
                    disabled={isExportingPdf || isExportingExcel || totalPages === 0}
                    className="w-12 sm:w-14 text-sm border-gray-300 rounded px-1 py-0.5 ml-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-400 text-gray-900 font-bold bg-white" 
                  />
                  <label htmlFor="exportEndPage" className="text-xs text-gray-500 ml-2">To:</label>
                  <input 
                    id="exportEndPage"
                    type="number" 
                    min={1}
                    max={totalPages || 1}
                    value={exportEndPage}
                    onChange={(e) => setExportEndPage(e.target.value === "" ? "" : parseInt(e.target.value) || 1)}
                    onBlur={() => {
                      if (exportEndPage === "") setExportEndPage(Math.min(20, totalPages || 1));
                    }}
                    disabled={isExportingPdf || isExportingExcel || totalPages === 0}
                    className="w-12 sm:w-14 text-sm border-gray-300 rounded px-1 py-0.5 ml-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-400 text-gray-900 font-bold bg-white" 
                  />
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleExport("pdf")}
                disabled={isExportingPdf || isExportingExcel || totalPages === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-70 disabled:cursor-wait"
              >
                {isExportingPdf ? `PDF...` : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    PDF
                  </>
                )}
              </button>
              <button
                onClick={() => handleExport("excel")}
                disabled={isExportingPdf || isExportingExcel || totalPages === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-wait"
              >
                {isExportingExcel ? `Excel...` : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="17"></line><line x1="16" y1="13" x2="8" y2="17"></line></svg>
                    Excel
                  </>
                )}
              </button>
              </div>
              </div>
              {downloadError && (
                <div className="w-full mt-2 text-red-600 bg-red-50 border border-red-200 text-xs px-2 py-1 rounded text-right">
                  {downloadError}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-end mt-4 sm:mt-0">
              {userRole === 'admin' && (
                <UserExportToolbar 
                  totalPages={totalPages || 1}
                  subscriptionExpiresAt={subscriptionExpiresAt}
                  onDownloadPdf={async (pageNo) => {
                    await handleExport("pdf", pageNo);
                  }}
                />
              )}
              {downloadError && (
                <div className="w-full mt-2 text-red-600 bg-red-50 border border-red-200 text-xs px-2 py-1 rounded text-right">
                  {downloadError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 no-print">
        {/* Mobile Filter Trigger */}
        <button 
          className="w-full sm:hidden flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 py-3 shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50"
          onClick={() => setIsFiltersOpen(true)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {(query || product || destinationCountry || sort !== "date_asc") && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
              {Number(!!query) + Number(!!product) + Number(!!destinationCountry) + Number(sort !== "date_asc")}
            </span>
          )}
        </button>

        {/* Filters Container (Bottom Sheet on Mobile, Inline on Desktop) */}
        <div className={`
          fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out
          sm:relative sm:z-auto sm:transform-none sm:transition-none sm:flex sm:flex-col sm:gap-3
          ${isFiltersOpen ? "translate-y-0" : "translate-y-full sm:translate-y-0"}
        `}>
          {/* Backdrop for Mobile */}
          <div 
            className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity sm:hidden ${isFiltersOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => setIsFiltersOpen(false)}
          />
          
          <div className="relative bg-white rounded-t-2xl sm:rounded-none sm:bg-transparent p-5 pb-8 sm:p-0 flex flex-col gap-3 sm:w-full mt-auto max-h-[85vh] overflow-y-auto sm:overflow-visible sm:max-h-none">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between sm:hidden mb-4">
              <h3 className="text-lg font-bold text-gray-900">Filters</h3>
              <button onClick={() => setIsFiltersOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {userRole === "admin" && (
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex flex-col w-full sm:w-auto">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold mb-1 ml-1">Date From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => {
                      setDateFrom(event.target.value);
                      setPage(1);
                      updateUrlParams({ date_from: event.target.value, page: 1 });
                    }}
                    className="w-full sm:w-40 rounded-xl border border-gray-200 shadow-sm px-3 py-2.5 text-sm outline-none transition hover:border-amber-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 bg-white/90 backdrop-blur-md text-gray-900"
                  />
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold mb-1 ml-1">Date To</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => {
                      setDateTo(event.target.value);
                      setPage(1);
                      updateUrlParams({ date_to: event.target.value, page: 1 });
                    }}
                    className="w-full sm:w-40 rounded-xl border border-gray-200 shadow-sm px-3 py-2.5 text-sm outline-none transition hover:border-amber-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 bg-white/90 backdrop-blur-md text-gray-900"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative group w-full sm:w-64">
          <input
            value={query}
            disabled={isCompanyFilterDisabled}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
              updateUrlParams({ query: event.target.value, page: 1 });
            }}
            placeholder={isCompanyFilterDisabled ? "Filter locked (Upgrade to Pro)" : "Filter by company name..."}
            className={`w-full rounded-xl border border-gray-200 bg-white/90 backdrop-blur-md px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition hover:border-amber-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 ${
              isCompanyFilterDisabled ? "cursor-not-allowed bg-gray-50 text-gray-400" : ""
            }`}
          />
          {isCompanyFilterDisabled && (
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
          )}
          {isCompanyFilterDisabled && (
            <div className="absolute top-full left-0 mt-1 z-50 flex opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                Upgrade to Pro to filter by company
              </div>
            </div>
          )}
        </div>
        <div className="relative group w-full sm:w-72">
          <input
            value={product}
            disabled={isProductSearchLocked}
            onChange={(event) => {
              setProduct(event.target.value);
              setPage(1);
              updateUrlParams({ product: event.target.value, page: 1 });
            }}
            placeholder={isProductSearchLocked ? "Product search locked" : "Filter by product / description..."}
            className={`w-full rounded-xl border border-gray-200 bg-white/90 backdrop-blur-md px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition hover:border-amber-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 ${
              isProductSearchLocked ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70" : ""
            }`}
          />
          {isProductSearchLocked && (
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
          )}
          {isProductSearchLocked && (
            <div className="absolute top-full left-0 mt-1 z-50 flex opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                Upgrade to Pro to search by product
              </div>
            </div>
          )}
        </div>
        <div className="relative group w-full sm:w-64">
          <Combobox
            value={destinationCountry}
            disabled={isDestinationFilterDisabled}
            onChange={(val) => {
              setDestinationCountry(val);
              setPage(1);
              updateUrlParams({ destinationCountry: val, page: 1 });
            }}
            options={availableCountries}
            placeholder={isDestinationFilterDisabled ? "Filter locked (Upgrade to Pro)" : "Filter by destination country..."}
            className="w-full sm:w-64"
          />
          {isDestinationFilterDisabled && (
            <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
          )}
          {isDestinationFilterDisabled && (
            <div className="absolute top-full left-0 mt-1 z-50 flex opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                Upgrade to Pro to filter by destination
              </div>
            </div>
          )}
        </div>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as SortOrder);
            setPage(1);
            updateUrlParams({ sort: event.target.value as SortOrder, page: 1 });
          }}
          disabled={isSortingDisabled}
          title={isSortingDisabled ? "Sorting is available for Pro and Premium users." : "Sort by"}
          className={`w-full rounded-xl border border-gray-200 shadow-sm px-3 py-2.5 text-sm outline-none transition hover:border-amber-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 sm:w-64 ${
            isSortingDisabled 
              ? "bg-gray-50 text-gray-500 cursor-not-allowed opacity-80" 
              : "bg-white/90 backdrop-blur-md text-gray-900"
          }`}
        >
          <option value="date_asc">Sort: Date (Oldest to Newest)</option>
          <option value="date_desc">Sort: Date (Newest to Oldest)</option>
          <option value="value_desc">Sort: Value (Highest)</option>
          <option value="value_asc">Sort: Value (Lowest)</option>
          <option value="az">Sort: Name (A → Z)</option>
          <option value="za">Sort: Name (Z → A)</option>
        </select>
            </div>
            
            <button 
              className="mt-6 sm:hidden w-full rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white shadow-sm"
              onClick={() => setIsFiltersOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {statusError && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100 shadow-sm no-print">
          {statusError}
        </div>
      )}

      {status && !statusError && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm no-print">
          <h3 className="text-base font-semibold text-gray-900">{status.label}</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Shipments" value={status.shipments.toLocaleString()} />
            <StatCard label="Buyers" value={status.buyers.toLocaleString()} />
            <StatCard label="Suppliers" value={status.suppliers.toLocaleString()} />
            <StatCard label="Countries" value={status.countriesServed.toLocaleString()} />
            <StatCard label="Total Value (PKR)" value={currencyFormatter.format(status.totalValuePkr)} />
            <StatCard label="First Shipment" value={formatDate(status.firstShipment)} />
            <StatCard label="Last Shipment" value={formatDate(status.lastShipment)} />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {topListLabel}
            </p>
            {!topList || topList.length === 0 ? (
              <p className="text-sm text-gray-400">No records found for this category.</p>
            ) : (
              <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm scrollbar-thin">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {topList.map((entry) => (
                      <tr key={entry.company}>
                        <td className="px-3 py-2 font-medium text-gray-900">{entry.company}</td>
                        <td className="px-3 py-2 text-gray-500">{entry.shipments} shipments</td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {currencyFormatter.format(entry.total_value_pkr)} PKR
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2 no-print">
        <span className="text-xs text-gray-400 flex items-center gap-1">💡 Click any row to view complete shipment & customs details</span>
        <span className="text-xs text-gray-400 hidden sm:block">↔ Scroll horizontally for full shipment metrics (Value, Qty, etc.)</span>
      </div>

      <div className="relative hidden md:block">
        <div 
          ref={tableContainerRef}
          onScroll={handleScroll}
          className="ledger-table-wrapper w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-orange-400 scrollbar-track-transparent bg-white print:border-gray-300 print:shadow-none"
        >
          <div>
            <table className="ledger-table ledger-table-scroll max-md:!table max-md:!border-separate max-md:!border-spacing-0 text-left text-sm print:text-xs">
            <thead>
              {mode === "buyer" ? (
                <tr className="max-md:!table-row">
                  <th className="px-4 py-3 whitespace-nowrap max-md:!hidden">Date</th>
                  <th className="px-4 py-3 whitespace-nowrap max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] hidden max-md:!table-cell">Supplier (Exporter)</th>
                  <th className="px-4 py-3 whitespace-nowrap hidden max-md:!table-cell">Date</th>
                  <th className="px-4 py-3 min-w-[200px] whitespace-nowrap">Buyer (Importer)</th>
                  <th className="px-4 py-3 whitespace-nowrap">Destination</th>
                  <th className="px-4 py-3 whitespace-nowrap max-md:!hidden">Supplier (Exporter)</th>
                  <th className="px-4 py-3 whitespace-nowrap">HS Code (PCT)</th>
                  <th className="px-4 py-3 min-w-[300px] whitespace-nowrap">Description</th>
                  <th className="px-4 py-3 whitespace-nowrap ledger-col-numeric">Quantity & Unit</th>
                  <th 
                    className={`px-4 py-3 whitespace-nowrap ledger-col-numeric ${isSortingDisabled ? '' : 'cursor-pointer transition-colors group print:hover:bg-transparent'}`}
                    onClick={isSortingDisabled ? undefined : toggleSortValue}
                    title={isSortingDisabled ? "Sorting by value is available for Pro and Premium users." : "Click to sort by Value"}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Value (PKR)
                      {!isSortingDisabled && (
                        <span className="text-orange-400 group-hover:text-orange-600">
                          {sort === "value_desc" ? "↓" : sort === "value_asc" ? "↑" : "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 w-8 text-center print:hidden"></th>
                </tr>
              ) : (
                <tr className="max-md:!table-row">
                  <th className="px-4 py-3 whitespace-nowrap max-md:!hidden">Date</th>
                  <th className="px-4 py-3 min-w-[200px] whitespace-nowrap max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Supplier (Exporter)</th>
                  <th className="px-4 py-3 whitespace-nowrap hidden max-md:!table-cell">Date</th>
                  {userRole === "admin" && <th className="px-4 py-3 whitespace-nowrap">NTN</th>}
                  <th className="px-4 py-3 whitespace-nowrap">Buyer (Importer)</th>
                  <th className="px-4 py-3 whitespace-nowrap">Destination</th>
                  <th className="px-4 py-3 whitespace-nowrap">HS Code (PCT)</th>
                  <th className="px-4 py-3 min-w-[300px] whitespace-nowrap">Description</th>
                  <th className="px-4 py-3 whitespace-nowrap ledger-col-numeric">Quantity & Unit</th>
                  <th 
                    className={`px-4 py-3 whitespace-nowrap ledger-col-numeric ${isSortingDisabled ? '' : 'cursor-pointer transition-colors group print:hover:bg-transparent'}`}
                    onClick={isSortingDisabled ? undefined : toggleSortValue}
                    title={isSortingDisabled ? "Sorting by value is available for Pro and Premium users." : "Click to sort by Value"}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Value (PKR)
                      {!isSortingDisabled && (
                        <span className="text-orange-400 group-hover:text-orange-600">
                          {sort === "value_desc" ? "↓" : sort === "value_asc" ? "↑" : "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 w-8 text-center print:hidden"></th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-red-500 bg-red-50/50">
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                    No matching shipments found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  mode === "buyer" ? (
                    <tr key={row.id} onClick={() => setSelectedRow(row)} title="Click to view full shipment details" className="cursor-pointer hover:bg-orange-50/60 transition-colors group print:hover:bg-white max-md:!table-row">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs max-md:!hidden">{formatDate(row.shipment_date)}</td>
                      <td className="px-4 py-3 ledger-entity-secondary hidden max-md:!table-cell max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{row.counterparty ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs hidden max-md:!table-cell">{formatDate(row.shipment_date)}</td>
                      <td className="px-4 py-3 ledger-entity-primary">{row.company}</td>
                      <td className="px-4 py-3">
                        {row.country ? (
                          <span className="ledger-location !static !block !mt-0 !before:hidden">
                            {row.country}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 max-md:!hidden ledger-entity-secondary">{row.counterparty ?? "—"}</td>
                      <td className="px-4 py-3">
                        {row.pct ? <span className="ledger-id">{row.pct}</span> : <span className="ledger-id-empty">—</span>}
                      </td>
                      <td className="px-4 py-3 ledger-desc">
                        <div className="max-w-xs group relative print:max-w-none">
                          <div title={row.description}>
                            {expandedRows[row.id] 
                              ? row.description 
                              : (row.description && row.description.length > 80 
                                  ? row.description.slice(0, 80) + "..." 
                                  : row.description)}
                          </div>
                          {row.description && row.description.length > 80 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleExpand(row.id); }}
                              className="ledger-desc-readmore no-print"
                            >
                              {expandedRows[row.id] ? "Read Less" : "Read More"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap ledger-col-numeric">
                        {row.qty === "••••••••" ? (
                          <div className="relative group inline-block">
                            <span className="text-sm text-gray-400 blur-[3px] select-none cursor-not-allowed">123,456</span>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                Upgrade to Pro
                              </div>
                            </div>
                          </div>
                        ) : row.qty ? `${numberFormatter.format(row.qty as number)} ${row.unit ?? ""}`.trim() : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 text-right whitespace-nowrap">
                        {row.value_pkr === "••••••••" ? (
                          <div className="relative group inline-block">
                            <span className="text-sm text-gray-400 blur-[3px] select-none cursor-not-allowed">PKR 123,456</span>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                Upgrade to Pro
                              </div>
                            </div>
                          </div>
                        ) : row.value_pkr === null ? "—" : (
                          <span className="ledger-numeric">
                            PKR {currencyFormatter.format(row.value_pkr as number)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center print:hidden text-gray-400 group-hover:text-orange-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id} onClick={() => setSelectedRow(row)} title="Click to view full shipment details" className="cursor-pointer hover:bg-orange-50/60 transition-colors group print:hover:bg-white max-md:!table-row">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs max-md:!hidden">{formatDate(row.shipment_date)}</td>
                      <td className="px-4 py-3 ledger-entity-primary max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{row.company}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs hidden max-md:!table-cell">{formatDate(row.shipment_date)}</td>
                      {userRole === "admin" && (
                        <td className="px-4 py-3">
                          {row.ntn ? <span className="ledger-id">{row.ntn}</span> : <span className="ledger-id-empty">—</span>}
                        </td>
                      )}
                      <td className="px-4 py-3 ledger-entity-secondary">{row.counterparty ?? "—"}</td>
                      <td className="px-4 py-3">
                        {row.country ? (
                          <span className="ledger-location !static !block !mt-0 !before:hidden">
                            {row.country}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {row.pct ? <span className="ledger-id">{row.pct}</span> : <span className="ledger-id-empty">—</span>}
                      </td>
                      <td className="px-4 py-3 ledger-desc">
                        <div className="max-w-xs group relative print:max-w-none">
                          <div title={row.description}>
                            {expandedRows[row.id] 
                              ? row.description 
                              : (row.description && row.description.length > 80 
                                  ? row.description.slice(0, 80) + "..." 
                                  : row.description)}
                          </div>
                          {row.description && row.description.length > 80 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleExpand(row.id); }}
                              className="ledger-desc-readmore no-print"
                            >
                              {expandedRows[row.id] ? "Read Less" : "Read More"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap ledger-col-numeric">
                        {row.qty === "••••••••" ? (
                          <div className="relative group inline-block">
                            <span className="text-sm text-gray-400 blur-[3px] select-none cursor-not-allowed">123,456</span>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                Upgrade to Pro
                              </div>
                            </div>
                          </div>
                        ) : row.qty ? (
                          <span className="ledger-numeric">
                            {numberFormatter.format(row.qty as number)}
                            {row.unit && <span className="ledger-numeric-unit">{row.unit}</span>}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 text-right whitespace-nowrap">
                        {row.value_pkr === "••••••••" ? (
                          <div className="relative group inline-block">
                            <span className="text-sm text-gray-400 blur-[3px] select-none cursor-not-allowed">PKR 123,456</span>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                Upgrade to Pro
                              </div>
                            </div>
                          </div>
                        ) : row.value_pkr === null ? "—" : (
                          <span className="ledger-numeric">
                            PKR {currencyFormatter.format(row.value_pkr as number)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center print:hidden text-gray-400 group-hover:text-orange-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent transition-opacity duration-300 rounded-r-xl print:hidden ${isScrolledToRight ? "opacity-0" : "opacity-100"}`} />
      </div>

      <div className="block md:hidden">
        {showMobileTip && (
          <div className="block sm:hidden bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 flex items-start justify-between gap-2 text-[11px] text-amber-900 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">💻</span>
              <p className="leading-tight">
                <strong className="font-semibold">Best viewed on Desktop:</strong> For full tabular comparisons, enable <em>&quot;Desktop Site&quot;</em> in your mobile browser or use a PC/laptop.
              </p>
            </div>
            <button 
              onClick={() => setShowMobileTip(false)}
              className="text-amber-600 hover:text-amber-800 font-bold px-1.5 py-0.5 text-xs rounded hover:bg-amber-100 transition"
              aria-label="Close tip"
            >
              ✕
            </button>
          </div>
        )}
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 bg-red-50/50 rounded-lg">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No matching shipments found.</div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 py-2">
            {rows.map((row) => {
              const buyerName = mode === "buyer" ? row.company : (row.counterparty || "—");
              const supplierName = mode === "supplier" ? row.company : (row.counterparty || "—");
              const displayValue = row.value_pkr === "••••••••" ? "PKR ••••••••" : row.value_pkr ? `PKR ${currencyFormatter.format(row.value_pkr as number)}` : (row.qty === "••••••••" ? "Qty ••••••••" : (row.qty ? `${numberFormatter.format(row.qty as number)} ${row.unit || ""}`.trim() : "—"));
              
              return (
                <div 
                  key={row.id} 
                  onClick={() => setSelectedRow(row)}
                  className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm hover:border-orange-400 active:scale-[0.98] transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center gap-1 mb-1.5">
                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 truncate max-w-[65%]">
                      {row.country || 'N/A'}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono bg-gray-100 px-1 py-0.5 rounded">
                      {row.pct || '—'}
                    </span>
                  </div>

                  <div className="space-y-1 my-1">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Buyer</p>
                      <p className="text-[11px] font-bold text-gray-800 line-clamp-1 leading-tight" title={buyerName}>
                        {buyerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Supplier</p>
                      <p className="text-[10px] text-gray-600 line-clamp-1 leading-tight" title={supplierName}>
                        {supplierName}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight my-1 italic">
                    {row.description || 'No description available'}
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-gray-100 flex justify-between items-center text-[10px]">
                    <span className="text-gray-400 text-[9px]">{formatDate(row.shipment_date)}</span>
                    <span className={`font-bold text-[11px] ${row.value_pkr === "••••••••" || row.qty === "••••••••" ? "text-gray-400 blur-[2px]" : "text-orange-600"}`}>
                      {displayValue}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {isTrial && product && rows.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center shadow-sm">
          <p className="text-sm font-semibold text-amber-800">
            Showing limited results. Upgrade to Pro to unlock full search results and unlimited records.
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 no-print">
          <p>
            Showing {rows.length} of {total.toLocaleString()} total shipments
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPage((p) => {
                  const newPage = Math.max(1, p - 1);
                  updateUrlParams({ page: newPage });
                  return newPage;
                });
              }}
              disabled={page === 1 || loading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-medium text-gray-900">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => {
                if (isTrial && page >= 20) {
                  setShowUpgradeBanner(true);
                  return;
                }
                setPage((p) => {
                  const newPage = Math.min(totalPages, p + 1);
                  updateUrlParams({ page: newPage });
                  return newPage;
                });
              }}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Description Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Shipment Details</h3>
              <button onClick={() => setSelectedRow(null)} className="text-gray-400 hover:text-gray-600 p-1" title="Close" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  {mode === "buyer" ? "Buyer (Importer)" : "Supplier (Exporter)"}
                </h4>
                <p className="text-sm font-medium text-gray-900">{selectedRow.company}</p>
                {selectedRow.ntn && (
                  <p className="text-xs text-gray-500 mt-0.5">NTN: {selectedRow.ntn}</p>
                )}
              </div>
              
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Date</h4>
                  <p className="text-sm text-gray-900">{formatDate(selectedRow.shipment_date)}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">HS Code</h4>
                  <p className="text-sm text-gray-900">{selectedRow.pct || "—"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Destination</h4>
                  <p className="text-sm text-gray-900">{selectedRow.country || "—"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                    {mode === "buyer" ? "Supplier (Exporter)" : "Buyer (Importer)"}
                  </h4>
                  <p className="text-sm text-gray-900">{selectedRow.counterparty || "—"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Value (PKR)</h4>
                  {selectedRow.value_pkr === "••••••••" ? (
                    <div className="relative group inline-block">
                      <span className="text-sm text-gray-400 blur-[3px] select-none cursor-not-allowed">PKR 123,456</span>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          Upgrade to Pro
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {selectedRow.value_pkr === null ? "—" : `PKR ${currencyFormatter.format(selectedRow.value_pkr as number)}`}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Quantity</h4>
                  {selectedRow.qty === "••••••••" ? (
                    <div className="relative group inline-block">
                      <span className="text-sm text-gray-400 blur-[3px] select-none cursor-not-allowed">123,456</span>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          Upgrade to Pro
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">{selectedRow.qty ? `${numberFormatter.format(selectedRow.qty as number)} ${selectedRow.unit ?? ""}`.trim() : "—"}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 border-b border-gray-100 pb-1">Contact Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Email</span>
                    {selectedRow.email === "••••••••" ? (
                      <div className="relative group inline-block">
                        <span className="text-sm text-gray-400 blur-[3px] select-none cursor-not-allowed">contact@example.com</span>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Upgrade to Premium
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{selectedRow.email || "—"}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Phone</span>
                    {selectedRow.phone === "••••••••" ? (
                      <div className="relative group inline-block">
                        <span className="text-sm text-gray-400 blur-[3px] select-none cursor-not-allowed">+92-XXX-XXXXXXX</span>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Upgrade to Premium
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{selectedRow.phone || "—"}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Website</span>
                    {selectedRow.website === "••••••••" ? (
                      <div className="relative group inline-block">
                        <span className="text-sm text-gray-400 blur-[3px] select-none cursor-not-allowed">https://example.com</span>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Upgrade to Premium
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{selectedRow.website || "—"}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Address</span>
                    {selectedRow.address === "••••••••" ? (
                      <div className="relative group inline-block">
                        <span className="text-sm text-gray-400 blur-[3px] select-none cursor-not-allowed">Address not yet verified</span>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Upgrade to Premium
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{selectedRow.address || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Full Description</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                  {selectedRow.description}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Banner Modal */}
      {showUpgradeBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Page Limit Reached</h3>
            <p className="text-gray-600 mb-6">Trial users can only view up to 20 pages. Upgrade to Pro to unlock unlimited data exploration.</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowUpgradeBanner(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Close
              </button>
              <a href="/dashboard#pro-card" className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition shadow-sm">
                Upgrade Now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
