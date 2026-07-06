import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { usePlcReport, usePlcReportOptions } from "../hooks/usePlcData";
import { useQueryClient } from "@tanstack/react-query";
import { axiosHandler } from "../config/axiosconfig";
import {
  Loader2, RefreshCw, Download, ChevronLeft, ChevronRight,
  X, FileText, ChevronDown, BarChart2, Clock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// ─── helpers ─────────────────────────────────────────────────────────────────
const COLORS = ["#3b82f6", "#10b981", "#ef4444"];

const getQrPayloadForRow = (row) => ({
  Company: row?.Company ?? "—", Plant: row?.Plant ?? "—",
  Product: row?.Product ?? "—", Model: row?.Model ?? "—",
  LineNumber: row?.LineNumber ?? "—", LineName: row?.LineName ?? "—",
  BarcodeTag: row?.BarcodeTag ?? "—", BarcodeStatus: row?.BarcodeStatus ?? "—",
  BarcodeDateTime: row?.BarcodeDateTime ?? null,
  ProductionCount: row?.ProductionCount ?? null,
});

const getQrUrlForRow = (row) => {
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(getQrPayloadForRow(row)))));
    return `https://digitization.jpmgroup.co.in/plc-data/report/qr-view?d=${encodeURIComponent(encoded)}`;
  } catch { return ""; }
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? "—" : date.toLocaleString("en-GB");
  } catch { return "—"; }
};

// ─── SummaryCard ─────────────────────────────────────────────────────────────
const SummaryCard = React.memo(({ card }) => {
  return (
    <div className={`rounded-xl border ${card.border} ${card.bg} px-4 py-3 shadow-sm`}>
      <p className="text-xs font-medium text-gray-600">{card.label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className={`text-2xl font-semibold ${card.accent}`}>{card.value}</p>
      </div>
      <p className="mt-1 text-xs text-gray-600">{card.subtitle}</p>
    </div>
  );
});

// ─── TableRow ─────────────────────────────────────────────────────────────
const TableRow = React.memo(({ row, onQrClick, onParamsClick }) => {
  return (
    <tr className="transition odd:bg-white even:bg-slate-50/60 hover:bg-blue-50">
      <td className="whitespace-nowrap px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">{row.Company ?? "—"}</td>
      <td className="whitespace-nowrap px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">{row.Plant ?? "—"}</td>
      <td className="whitespace-nowrap px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">{row.Product ?? "—"}</td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">
        {row.CalculatedProduction}
        {row.CalculatedProduction === 0 && " (Machine Error)"}
      </td>
      <td className="whitespace-nowrap px-4 py-2 text-[12px] font-medium text-gray-900 border-b border-r border-gray-200">{row.Model ?? "—"}</td>
      <td className="whitespace-nowrap px-4 py-2 text-[12px] font-medium text-gray-900 border-b border-r border-gray-200">{row.Shift ?? "—"}</td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">{row.Operator ?? "—"}</td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">{row.Date ? new Date(row.Date).toLocaleString("en-GB") : "—"}</td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">{row.LineNumber ?? "—"}</td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">{row.LineName ?? "—"}</td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">{row.BarcodeTag ?? "—"}</td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">
        <span className={`${String(row.BarcodeStatus ?? "").trim().toLowerCase() === "printed"
          ? "text-blue-600 bg-blue-50" : "text-rose-600 bg-rose-50"} px-1 py-0.5 rounded`}>
          {row.BarcodeStatus ?? "—"}
        </span>
      </td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">{row.BarcodeDateTime ? new Date(row.BarcodeDateTime).toLocaleString("en-GB") : "—"}</td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">
        <span className={`${String(row.Error ?? "").trim().toLowerCase() === "ok"
          ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"} px-1 py-0.5 rounded`}>
          {row.Error ?? "—"}
        </span>
      </td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-r border-gray-200">
        <button type="button" onClick={() => onQrClick(row)}
          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition">
          See QR
        </button>
      </td>
      <td className="px-4 py-2 text-[13px] text-gray-900 border-b border-gray-200">
        {row.parameters && Object.keys(row.parameters).length > 0 ? (
          <button type="button" onClick={() => onParamsClick(row)}
            className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
            View all ({Object.keys(row.parameters).length})
          </button>
        ) : <span className="text-gray-400">—</span>}
      </td>
    </tr>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const Report = () => {
  const queryClient = useQueryClient();
  const tableRef   = useRef(null);
  const pdfRef     = useRef(null);
  const downloadMenuRef = useRef(null);

  // ── UI state ──
  const [showRefresh,           setShowRefresh]           = useState(false);
  const [isDownloadingPdf,      setIsDownloadingPdf]      = useState(false);
  const [isDownloadingExcel,    setIsDownloadingExcel]    = useState(false);
  const [showDownloadMenu,      setShowDownloadMenu]      = useState(false);
  const [showProductSummaryModal, setShowProductSummaryModal] = useState(false);
  const [qrRow,       setQrRow]       = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // ── filter state (drives API call) ──
  const [selectedProduct,  setSelectedProduct]  = useState("all");
  const [selectedStatus,   setSelectedStatus]   = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [selectedCompany,  setSelectedCompany]  = useState("all");
  const [selectedPlant,    setSelectedPlant]    = useState("all");
  const [startDate,  setStartDate]  = useState("");
  const [endDate,    setEndDate]    = useState("");
  const [startTime,  setStartTime]  = useState("");
  const [endTime,    setEndTime]    = useState("");

  // ── pagination state ──
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ── Build query params object passed to the hook ──
  // Every time a filter/page changes, the hook re-fetches with these params.
  // Build queryParams as before
const queryParams = useMemo(() => ({
  page:  currentPage,
  limit: itemsPerPage,
  ...(selectedCompany  !== "all" && { company_name: selectedCompany }),
  ...(selectedPlant    !== "all" && { plant_name:   selectedPlant }),
  ...(selectedProduct  !== "all" && { model:        selectedProduct }), // ← product ki jagah model
  ...(selectedStatus   !== "all" && { status:       selectedStatus }),
  ...(selectedDuration !== "all" && {
    duration:  selectedDuration,
    startDate, endDate, startTime, endTime,
  }),
}), [
  currentPage, selectedCompany, selectedPlant, selectedProduct,
  selectedStatus, selectedDuration, startDate, endDate, startTime, endTime,
]);

// ── Human-readable label of the active time window ──
// NOTE: "All Time" actually returns only the last 1 day (backend safety-net
// DEFAULT_QUERY_WINDOW_DAYS = 1), so we label it "Last 24 hours" — not literally
// all-time — so the user knows the real window the data covers.
const periodLabel = useMemo(() => {
  const fmt = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString();
  };
  switch (selectedDuration) {
    case "today": return "Today";
    case "week":  return "This Week";
    case "month": return "This Month";
    case "custom":
      if (startDate && endDate) return `${fmt(startDate)} → ${fmt(endDate)}`;
      if (startDate)            return `From ${fmt(startDate)}`;
      if (endDate)              return `Until ${fmt(endDate)}`;
      return "Custom range";
    case "all":
    default:      return "Last 24 hours";
  }
}, [selectedDuration, startDate, endDate]);

// ✅ Pass queryParams as first argument to the hook
const getPlcReport = usePlcReport(queryParams, { live: false });
const getPlcReportOptions = usePlcReportOptions();

  // ── API response shape (backend now returns all of these) ──
const apiData         = getPlcReport.data || {};   // now this is the full object
const rows            = apiData.rows            || [];
const total           = apiData.total           || 0;
const totalPages      = apiData.totalPages      || 1;
const summary         = apiData.summary         || {};
const productSummaries = apiData.productSummaries || [];
  // ── Filter option lists: fetch once without filters for dropdown population ──
  // You can either derive these from a separate lightweight "options" endpoint,
  // or keep a one-time fetch of all distinct values.  Here we re-use the full
  // ✅ sirf yeh teen lines chahiye
const companyOptions = getPlcReportOptions?.data?.companies || [];
const plantOptions   = getPlcReportOptions?.data?.plants   || [];
const modelOptions   = getPlcReportOptions?.data?.models   || [];

    // * Add a lightweight GET /plc-data/report/options endpoint that returns
    //   { products: [], companies: [], plants: [] } from DB DISTINCT queries.
  //   That way dropdowns never slow down the main report call.

  // NOTE: The next-page prefetch was removed. The backend now caches the heavy,
  // page-independent report core by filter (5-min), so paging is already instant
  // (every page slices the same cached result). Prefetching here only hurt — on
  // first load it fired page 2 concurrently with page 1, so the expensive query
  // ran twice at once on the 1 GB SQL Express box instead of once.

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [
    selectedCompany, selectedPlant, selectedProduct,
    selectedStatus, selectedDuration, startDate, endDate, startTime, endTime,
  ]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target))
        setShowDownloadMenu(false);
    };
    if (showDownloadMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDownloadMenu]);

  // ── Summary cards (values come directly from API now) ──
  const summaryCards = useMemo(() => [
    {
      label: "Total Products", value: summary.uniqueProducts ?? 0,
      subtitle: "Active Products", accent: "text-purple-600",
      border: "border-purple-100", bg: "bg-purple-50",
    },
    {
      label: "OK Count", value: summary.barcodeOkCount ?? 0,
      subtitle: "Successful Scans", accent: "text-emerald-500",
      border: "border-emerald-100", bg: "bg-emerald-50",
    },
    {
      label: "Error Count", value: summary.barcodeNgCount ?? 0,
      subtitle: "Error Scans", accent: "text-rose-500",
      border: "border-rose-100", bg: "bg-rose-50",
    },
  ], [summary]);

  // ── Refresh ──
  const handleRefresh = useCallback(async () => {
    setShowRefresh(true);
    try { await getPlcReport.refetch(); }
    finally { setTimeout(() => setShowRefresh(false), 500); }
  }, [getPlcReport]);

  // ── Reset filters ──
  const handleResetFilters = useCallback(() => {
    setSelectedCompany("all"); setSelectedPlant("all"); setSelectedProduct("all");
    setSelectedDuration("all"); setStartDate(""); setEndDate("");
    setStartTime(""); setEndTime(""); setSelectedStatus("all");
    setCurrentPage(1);
  }, []);

  // ── Handlers for TableRow ──
  const handleQrClick = useCallback((row) => setQrRow(row), []);
  const handleParamsClick = useCallback((row) => setSelectedRow(row), []);

  // ── Logo loader for PDF ──
  const loadLogoAsDataUrl = useCallback((url) => new Promise((resolve, reject) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      try { resolve(c.toDataURL("image/png")); } catch (e) { reject(e); }
    };
    img.onerror = reject; img.src = url;
  }), []);

  
const handleDownloadPdf = useCallback(async () => {
  if (isDownloadingPdf) return;
  setIsDownloadingPdf(true);

  try {
    const params = new URLSearchParams(queryParams);

    const response = await axiosHandler.get(
      `/plc-data/report/download-pdf?${params.toString()}`, // ✅ FIXED ROUTE
      {
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `PLC-Report-${new Date().toISOString().slice(0, 10)}.pdf`
    );

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error("PDF download failed:", err);
  } finally {
    setIsDownloadingPdf(false);
  }
}, [isDownloadingPdf, queryParams]);

const handleDownloadExcel = useCallback(async () => {
  const response = await axiosHandler.get(
    `/plc-data/report/download-excel`,
    {
      params: queryParams,
      responseType: "blob",
    }
  );

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "PLC-Report.xlsx";
  link.click();
}, [queryParams]);
  // ── Pagination handlers ──
  const handleNextPage = useCallback(() => { if (currentPage < totalPages) setCurrentPage((p) => p + 1); }, [currentPage, totalPages]);
  const handlePrevPage = useCallback(() => { if (currentPage > 1)          setCurrentPage((p) => p - 1); }, [currentPage]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-full bg-gray-50">
        <div ref={pdfRef} className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">

          {/* ── Header bar ── */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Report - Summary</h1>
              <p className="mt-1 text-sm text-gray-500">Summary of the machine Data</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Download dropdown */}
              <div className="relative" ref={downloadMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={isDownloadingPdf || isDownloadingExcel}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isDownloadingPdf || isDownloadingExcel
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Download size={16} />}
                  Download <ChevronDown size={14} />
                </button>
                {showDownloadMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                    <button type="button" onClick={handleDownloadPdf} disabled={isDownloadingPdf}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
                      {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                      Download as PDF
                    </button>
                    <button type="button" onClick={handleDownloadExcel} disabled={isDownloadingExcel}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 border-t border-gray-100">
                      {isDownloadingExcel ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                      Download as Excel
                    </button>
                  </div>
                )}
              </div>
              <button type="button" onClick={handleRefresh} disabled={getPlcReport.isLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50">
                <RefreshCw size={16} className={showRefresh ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* Loading / error states */}
          {showRefresh && (
            <div className="mt-4 mb-4 flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-8 text-gray-500">
              <Loader2 size={24} className="animate-spin" /><span>Refreshing Report data…</span>
            </div>
          )}

          {getPlcReport.isLoading ? (
            <div className="mt-4 mb-4 flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-8 text-gray-500">
              <Loader2 size={24} className="animate-spin" /><span>Loading report data…</span>
            </div>
          ) : getPlcReport.isError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load report data.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-6">

                  {/* Report title + View Summary button */}
                  <div className="mb-6 border-b border-gray-300 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <h1 className="text-2xl font-semibold text-gray-800">Barcode Production Report</h1>
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                        <Clock className="h-3.5 w-3.5" />
                        Showing: {periodLabel}
                      </span>
                    </div>
                    <button onClick={() => setShowProductSummaryModal(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-blue-700 transition-all sm:max-w-[20vw]">
                      <BarChart2 className="h-4 w-4" /><span>View Summary</span>
                    </button>
                  </div>

                  {/* ── Filter bar ── */}
                  <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur mt-2 mb-6">
                    {/* Company */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500">Company</label>
                      <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}
                        className="h-9 w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[10vw]">
                        <option value="all">All Companies</option>
                        {companyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Plant */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500">Plant</label>
                      <select value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)}
                        className="h-9 w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[10vw]">
                        <option value="all">All Plants</option>
                        {plantOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    {/* Product */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500">Models</label>
                      <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                        className="h-9 w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[10vw]">
                        <option value="all">All Models</option>
                        {modelOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    {/* Duration */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500">Duration</label>
                      <select value={selectedDuration}
                        onChange={(e) => {
                          setSelectedDuration(e.target.value);
                          if (e.target.value !== "custom") {
                            setStartDate(""); setEndDate(""); setStartTime(""); setEndTime("");
                          }
                        }}
                        className="h-9 w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[10vw]">
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="custom">Custom Range</option>
                      </select>
                      {selectedDuration === "custom" && (
                        <div className="mt-1 flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                              className="h-8 w-36 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-blue-500 focus:outline-none" />
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                              className="h-8 w-36 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-blue-500 focus:outline-none" />
                          </div>
                          <div className="flex gap-2">
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                              className="h-8 w-36 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-blue-500 focus:outline-none" />
                            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                              className="h-8 w-36 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-blue-500 focus:outline-none" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Barcode Status */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500">Barcode Status</label>
                      <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
                        className="h-9 w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="all">All Status</option>
                        <option value="ok">OK</option>
                        <option value="error">Error</option>
                      </select>
                    </div>

                    <div className="ml-auto flex items-center">
                      <button onClick={handleResetFilters}
                        className="h-9 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
                        Reset Filters
                      </button>
                    </div>
                  </section>

                  {/* ── Summary cards ── */}
                  <div className="mt-5 mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {summaryCards.map((card) => <SummaryCard key={card.label} card={card} />)}
                  </div>

                  {/* ── Table ── */}
                  <div className="overflow-x-auto scrollbar-custom rounded-md border border-gray-200 bg-white" ref={tableRef}>
                    <table className="min-w-full text-sm border-collapse">
                      <thead className="sticky top-0 z-10 bg-gradient-to-r whitespace-nowrap from-indigo-600 via-blue-600 to-indigo-700">
                        <tr>
                          {[
                            "Company","Plant","Product","Production Count","Model","Shift",
                            "Operator","Date","Line Number","Line Name","Barcode Tag",
                            "Barcode Status","Barcode Date & Time","Error","QR details","Parameters",
                          ].map((h, i, arr) => (
                            <th key={h}
                              className={`px-4 py-3 text-left text-[11px] font-semibold text-white tracking-wide ${i < arr.length - 1 ? "border-r border-white/20" : ""}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white whitespace-nowrap">
                        {rows.length > 0 ? rows.map((row, idx) => (
                          <TableRow
                            key={idx}
                            row={row}
                            onQrClick={handleQrClick}
                            onParamsClick={handleParamsClick}
                          />
                        )) : (
                          <tr>
                            <td colSpan={16} className="px-4 py-4 text-center text-sm text-gray-500">
                              No report data available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Pagination ── (server-driven) */}
                  {total > 0 && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                          {" "}to{" "}
                          <span className="font-medium">{Math.min(currentPage * itemsPerPage, total)}</span>
                          {" "}of <span className="font-medium">{total}</span> results
                        </p>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button onClick={handlePrevPage} disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button onClick={handleNextPage} disabled={currentPage >= totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Product Summary Modal ── */}
              {showProductSummaryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="relative w-full max-w-4xl rounded-xl bg-white p-6 shadow-lg overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">Filtered Products Summary</h2>
                      <button onClick={() => setShowProductSummaryModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                    </div>
                    <div className="mb-4 text-sm text-gray-700 flex flex-wrap gap-4">
                      <div><span className="font-medium text-gray-500">Total Products:</span>{" "}<span className="font-semibold text-blue-600">{summary.uniqueProducts}</span></div>
                      <div><span className="font-medium text-gray-500">Overall Production:</span>{" "}<span className="font-semibold text-purple-600">{summary.barcodeOkCount}</span></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {productSummaries.map((s) => {
                        const data = [
                          { name: "Total Production", value: s.barcodeOk },
                          { name: "Barcode OK",        value: s.barcodeOk },
                          { name: "Barcode NG",        value: s.barcodeNg },
                        ];
                        return (
                          <div key={s.product} className="rounded-lg border border-gray-100 bg-gray-50 p-4 shadow-sm flex flex-col items-center">
                            <div className="mb-1">
                              <span className="text-xs font-semibold text-gray-500">Product: </span>
                              <span className="text-xs font-semibold text-gray-700">{s.product}</span>
                            </div>
                            <div className="w-full h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={data} dataKey="value" nameKey="name" innerRadius={30} outerRadius={50} paddingAngle={2} label>
                                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="mt-3 text-sm flex flex-col gap-1 w-full">
                              <span>Total Production: <strong className="text-blue-600">{s.barcodeOk}</strong></span>
                              <span>Barcode OK: <strong className="text-emerald-500">{s.barcodeOk}</strong></span>
                              <span>Barcode NG: <strong className="text-rose-500">{s.barcodeNg}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Parameters Modal ── */}
              {selectedRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                  onClick={() => setSelectedRow(null)} role="dialog" aria-modal="true">
                  <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          All Parameters — {formatDate(selectedRow.timestamp || selectedRow.Date)}
                        </h3>
                      </div>
                      <button onClick={() => setSelectedRow(null)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600">Total params: {Object.keys(selectedRow.parameters || {}).length}</p>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Live snapshot</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(selectedRow.parameters || {}).map(([k, v]) => (
                          <div key={k} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{k.replaceAll("_", " ")}</div>
                            <div className="mt-2 break-words text-sm font-semibold text-gray-900">{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                      <button onClick={() => setSelectedRow(null)}
                        className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── QR Modal ── */}
              {qrRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
                  <div className="absolute inset-0 bg-black/50" onClick={() => setQrRow(null)} />
                  <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-xl max-w-sm w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">QR details</h3>
                      <button type="button" onClick={() => setQrRow(null)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
                    </div>
                    <div className="flex flex-col items-center">
                      <QRCodeSVG value={getQrUrlForRow(qrRow)} size={200} level="M" className="border border-gray-100" />
                      <p className="mt-3 text-xs text-gray-500 text-center">Scan to Open & See Details</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Report;