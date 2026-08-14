"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

export default function DataUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previewData, setPreviewData] = useState<{ fileName: string, totalRows: number, columns: string[] }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean, totalProcessed: number, inserted: number, updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      await generatePreview(selectedFiles);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx')
      );
      if (droppedFiles.length === 0) {
        setError("Only .csv and .xlsx files are supported.");
        return;
      }
      setFiles(droppedFiles);
      await generatePreview(droppedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const generatePreview = async (selectedFiles: File[]) => {
    setError(null);
    setUploadResult(null);
    try {
      const previews = await Promise.all(selectedFiles.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Read top row for headers and total length for rows
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        
        return {
          fileName: file.name,
          totalRows: rows.length,
          columns: headers,
        };
      }));
      setPreviewData(previews);
    } catch (err) {
      console.error(err);
      setError("Failed to parse one or more files. Ensure they are valid CSV or XLSX formats.");
      setFiles([]);
      setPreviewData([]);
    }
  };

  const clearSelection = () => {
    setFiles([]);
    setPreviewData([]);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);
    setUploadResult(null);
    
    const formData = new FormData();
    files.forEach(f => formData.append("file", f));

    try {
      const res = await fetch("/api/admin/data/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      setUploadResult({
        success: true,
        totalProcessed: data.totalProcessed,
        inserted: data.inserted,
        updated: data.updated
      });
      setFiles([]);
      setPreviewData([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Upload Trade Data</h1>
      <p className="mt-1 text-sm text-gray-600 mb-8">
        Import CSV or XLSX files into the central trade database.
      </p>

      {/* Upload Zone */}
      <div 
        className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center">
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          <p className="text-lg font-medium text-gray-900 mb-1">Click to select or drag and drop files here</p>
          <p className="text-sm text-gray-500">Supports .csv and .xlsx (Max 50MB total)</p>
          <input 
            type="file" 
            multiple 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden" 
          />
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <p className="font-bold">Error Processing Request</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {uploadResult && uploadResult.success && (
        <div className="mt-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <p className="font-bold">Upload Successful</p>
            <p className="text-sm">
              Successfully processed {uploadResult.totalProcessed.toLocaleString()} rows 
              ({uploadResult.inserted.toLocaleString()} new, {uploadResult.updated.toLocaleString()} updated/overwritten).
            </p>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewData.length > 0 && (
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Upload Summary</h2>
              <p className="text-sm text-gray-500">Review the detected data before importing.</p>
            </div>
            <button onClick={clearSelection} disabled={isUploading} className="text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50">
              Clear All
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {previewData.map((data, idx) => (
              <div key={idx} className="border border-gray-100 bg-gray-50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{data.fileName}</h3>
                  <p className="text-xs text-gray-500 mt-1">{data.totalRows.toLocaleString()} rows detected</p>
                </div>
                <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-2 max-w-sm md:max-w-md break-words">
                  <span className="font-semibold text-gray-800 block mb-1">Columns detected:</span>
                  {data.columns.join(", ") || "No columns found"}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <button 
              onClick={clearSelection} 
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Importing Data...
                </>
              ) : (
                "Finalize Upload"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
