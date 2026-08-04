import React, { useState } from 'react';
import { useUserQuota } from '@/hooks/useUserQuota';

interface UserExportToolbarProps {
  totalPages: number;     // e.g., 3266
  subscriptionExpiresAt?: string | null;
  onDownloadPdf: (pageNo: number) => Promise<void>;
}

export const UserExportToolbar: React.FC<UserExportToolbarProps> = ({
  totalPages = 1,
  subscriptionExpiresAt,
  onDownloadPdf,
}) => {
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { downloadsRemaining, resetsAt, refreshQuota } = useUserQuota();

  const isSubscriptionExpired = subscriptionExpiresAt 
    ? new Date(subscriptionExpiresAt) < new Date()
    : false; // Default to FALSE if missing so users aren't locked out prematurely

  // The button is ONLY disabled if 0 downloads remain OR an export is currently building OR subscription is expired
  const isDownloadDisabled = downloadsRemaining <= 0 || isExportingPdf || isSubscriptionExpired;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setSelectedPage(1);
    } else if (val > totalPages) {
      setSelectedPage(totalPages);
    } else {
      setSelectedPage(val);
    }
  };

  const handleDownloadClick = async () => {
    if (isDownloadDisabled) return;
    try {
      setDownloadError(null);
      setIsExportingPdf(true);
      await onDownloadPdf(selectedPage);
      await refreshQuota();
    } catch (err) {
      console.error("Download Error:", err);
      setDownloadError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 my-2">
        {/* Global Shared Quota Badge */}
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
            downloadsRemaining > 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-red-50 text-red-700 border-red-300'
          }`}
        >
          Downloads Remaining Today: {downloadsRemaining} / 10
        </div>

        {/* Page Selector Input */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 bg-white shadow-sm">
          <span className="text-sm font-bold text-gray-800">Page No.</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={selectedPage}
            onChange={handleInputChange}
            disabled={isExportingPdf}
            title="Page Number"
            aria-label="Page Number"
            className="w-16 px-2 py-0.5 text-center font-extrabold text-gray-900 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
          <span className="text-sm font-semibold text-gray-500">of {totalPages}</span>
        </div>

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownloadClick}
          disabled={isDownloadDisabled}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
            isDownloadDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
              : 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95 cursor-pointer'
          }`}
        >
          {isExportingPdf ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* Render Banner ONLY when truly expired */}
      {isSubscriptionExpired && (
        <div className="w-full mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center font-medium">
          Your 30-day plan has expired. Please pay your dues to restore access.
        </div>
      )}

      {downloadError && !isSubscriptionExpired && (
        <div className="w-full mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center font-medium">
          {downloadError}
        </div>
      )}

      {downloadsRemaining <= 0 && !isSubscriptionExpired && resetsAt && (
        <div className="w-full mt-2 p-3 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-lg text-center font-medium">
          Daily limit reached — resets at {new Date(resetsAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};
