import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  useMachineHistory,
  useMachineSummary,
  useMachineLatestStatus,
  useMachineModelOptions,
} from "../hooks/usePlcData";
import {
  ArrowLeft,
  Loader2,
  History,
  X,
  FileText,
  ArrowUp,
  RefreshCw,
} from "lucide-react";

export default function PlcHistory() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const deviceId = searchParams.get("device_id") || "";

  // ─── Filter State ───────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [modelSearch, setModelSearch] = useState("");
  const [debouncedModelSearch, setDebouncedModelSearch] = useState("");

  // ─── UI State ───────────────────────────────────────────
  const [showRefresh, setShowRefresh] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const loadMoreRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // ✅ Debounce model search — 500ms baad hi API call hogi
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedModelSearch(modelSearch), 500);
    return () => clearTimeout(timer);
  }, [modelSearch]);

  // ─── API Filters ────────────────────────────────────────
  // ✅ duration ko lowercase mein bhejo taaki service match kare
  const filters = {
    device_id: deviceId || undefined,
    limit: 50,
    status: selectedStatus === "all" ? undefined : selectedStatus,
    model: debouncedModelSearch
      ? debouncedModelSearch
      : selectedModel === "all"
        ? undefined
        : selectedModel,
    duration:
      selectedDuration === "all" ? undefined : selectedDuration.toLowerCase(),
    startDate:
      selectedDuration.toLowerCase() === "custom" ? startDate : undefined,
    endDate: selectedDuration.toLowerCase() === "custom" ? endDate : undefined,
  };

  // ─── Hooks ──────────────────────────────────────────────
  const getMachineHistory = useMachineHistory(filters);
  const getMachineSummary = useMachineSummary(filters);
  const getMachineLatestStatus = useMachineLatestStatus(
    { device_id: deviceId },
    { live: true },
  );
  const getMachineModels = useMachineModelOptions(deviceId);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = getMachineHistory;

  // Flatten pages → single list
  const historyList = data?.pages.flatMap((page) => page.data) || [];
  const totalRecords = data?.pages[0]?.total || 0;

  const summaryData = getMachineSummary.data || {
    total_products: 0,
    total_production: 0,
    total_downtime_seconds: 0,
  };
  const latestStatus = getMachineLatestStatus.data || null;
  const modelOptions = getMachineModels.data?.models || [];

  const isLoading = isHistoryLoading || getMachineSummary.isLoading;
  const isError = isHistoryError;

  // ─── Refetch all ────────────────────────────────────────
  const refetch = () => {
    refetchHistory();
    getMachineSummary.refetch();
    getMachineLatestStatus.refetch();
  };

  // ─── Infinite Scroll ────────────────────────────────────
  useEffect(() => {
    // We only want to set up the observer if we are NOT loading,
    // so that the refs (scrollContainerRef, loadMoreRef) are attached to DOM elements.
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.01,
        rootMargin: "200px", // Trigger load 200px before reaching bottom
      },
    );

    const currentLoadMore = loadMoreRef.current;
    if (currentLoadMore) {
      observer.observe(currentLoadMore);
    }

    return () => {
      if (currentLoadMore) {
        observer.unobserve(currentLoadMore);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isLoading]);

  // ─── Helpers ────────────────────────────────────────────
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDowntime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleRefresh = async () => {
    setShowRefresh(true);
    const minDelay = new Promise((r) => setTimeout(r, 1000));
    await Promise.all([refetch(), minDelay]);
    setShowRefresh(false);
  };

  const handleResetFilters = () => {
    setSelectedModel("all");
    setSelectedDuration("all");
    setStartDate("");
    setEndDate("");
    setSelectedStatus("all");
    setModelSearch("");
    setDebouncedModelSearch("");
  };

  // ─── Summary Cards ──────────────────────────────────────
  const summaryCards = [
    {
      label: "Total Products",
      value: summaryData.total_products,
      subtitle: "Unique Models",
      accent: "text-purple-600",
      border: "border-purple-100",
      bg: "bg-purple-50",
      icon: <FileText size={22} />,
    },
    {
      label: "Total Production",
      value: `${summaryData.total_production} pcs`,
      subtitle: "Cumulative Count",
      accent: "text-blue-600",
      border: "border-blue-100",
      bg: "bg-blue-50",
      icon: <ArrowUp size={22} />,
    },
    {
      label: "DownTime",
      value: formatDowntime(summaryData.total_downtime_seconds),
      subtitle: "Total Stopped Duration",
      accent: "text-rose-500",
      border: "border-rose-100",
      bg: "bg-rose-50",
      icon: <History size={22} />,
    },
  ];

  // ─── Sub-components ─────────────────────────────────────
  function SummaryCard({ card }) {
    return (
      <div
        className={`rounded-2xl border ${card.border} ${card.bg} p-5 shadow-sm transition-all hover:shadow-md`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <h3 className={`mt-1 text-2xl font-bold ${card.accent}`}>
              {card.value}
            </h3>
            <p className="mt-1 text-xs text-gray-400">{card.subtitle}</p>
          </div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ${card.accent}`}
          >
            {card.icon}
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Header ───────────────────────────────────── */}
        <div className="mb-8 flex w-full items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Machine History
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
              <span className="font-medium text-indigo-700">{deviceId}</span>
              <span>•</span>
              <span>{totalRecords} records</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={showRefresh ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              onClick={() => navigate("/plc-data/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:shadow"
            >
              <ArrowLeft size={17} />
              Back
            </button>
          </div>
        </div>

        {/* ── Refresh Overlay ──────────────────────────── */}
        {showRefresh && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-8 text-gray-500">
            <Loader2 size={22} className="animate-spin" />
            <span>Refreshing Machine History…</span>
          </div>
        )}

        {/* ── Filters ──────────────────────────────────── */}
        <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur mt-2">
          {/* Model Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-semibold text-slate-500">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="h-9 w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Models</option>
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-semibold text-slate-500">
              Duration
            </label>
            <select
              value={selectedDuration}
              onChange={(e) => {
                setSelectedDuration(e.target.value);
                if (e.target.value !== "Custom") {
                  setStartDate("");
                  setEndDate("");
                }
              }}
              className="h-9 w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {selectedDuration === "Custom" && (
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-slate-400">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-36 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-slate-400">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-36 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-semibold text-slate-500">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>

          {/* Model Search */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-semibold text-slate-500">
              Search Model
            </label>
            <input
              type="text"
              placeholder="Type model…"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              className="h-9 w-40 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Reset */}
          <div className="ml-auto">
            <button
              onClick={handleResetFilters}
              className="h-9 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        </section>

        {/* ── Latest Status Card ───────────────────────── */}
        {latestStatus && (
          <div className="mt-4 rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-indigo-800 mb-3">
              Latest Machine Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Current Status</p>
                <p
                  className={`font-semibold capitalize ${
                    latestStatus.current_status?.toLowerCase() === "running"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {latestStatus.current_status || "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Machine Started At</p>
                <p className="font-semibold text-gray-800">
                  {formatDate(latestStatus.start_time)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Machine Stopped At</p>
                <p className="font-semibold text-gray-800">
                  {formatDate(latestStatus.stop_time)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Production Count</p>
                <p className="font-semibold text-gray-800">
                  {latestStatus.production_count} pcs
                </p>
              </div>
              <div>
                <p className="text-gray-500">Part No.</p>
                <p className="font-semibold text-gray-800">
                  {latestStatus.part_no || "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Summary Cards ────────────────────────────── */}
        <div className="mt-5 mb-5 grid gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} card={card} />
          ))}
        </div>

        {/* ── Table / States ───────────────────────────── */}
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={48} className="animate-spin text-indigo-500" />
              <p className="text-gray-600">Loading history…</p>
            </div>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-100 bg-white p-10 text-center shadow-xl">
            <p className="text-lg font-medium text-rose-700">
              Failed to load machine history. Please try again.
            </p>
          </div>
        ) : historyList.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-xl">
            <History size={56} className="mx-auto mb-6 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-800">
              No history records yet
            </h3>
            <p className="mt-2 text-gray-600">
              This machine hasn't produced any logged events.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto max-h-[60vh] overflow-y-auto"
            >
              <table className="min-w-full divide-y divide-gray-200 whitespace-nowrap">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {[
                      "Timestamp",
                      "Start Time",
                      "Stop Time",
                      "Status",
                      "Product Details",
                      "Production Count",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {historyList.map((row) => {
                    const status = (row.status || "").toLowerCase();
                    const isRunning = status === "running";
                    const isStopped = status === "stopped";

                    return (
                      <tr
                        key={row._id || row.id}
                        className="hover:bg-indigo-50/40 transition-colors"
                      >
                        <td className="px-5 py-4 text-sm text-gray-900">
                          {formatDate(row.timestamp)}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-800">
                          {formatDate(row.start_time)}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-800">
                          {row.stop_time ? formatDate(row.stop_time) : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${
                              isRunning
                                ? "bg-emerald-100 text-emerald-800"
                                : isStopped
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {isRunning && (
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {isStopped && (
                              <span className="h-2 w-2 rounded-full bg-rose-500" />
                            )}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-800">
                          <div className="space-y-0.5">
                            <p>
                              <span className="text-gray-500">Part No:</span>{" "}
                              {row.part_no || "—"}
                            </p>
                            <p>
                              <span className="text-gray-500">Model:</span>{" "}
                              {row.model || "—"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-900">
                          {row.production_count ?? "0"}
                          <span className="ml-1.5 text-xs font-normal text-gray-500">
                            pcs
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Infinite Scroll Trigger */}
              <div
                ref={loadMoreRef}
                className="flex justify-center p-5 bg-white border-t border-gray-100"
              >
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                    <Loader2 size={18} className="animate-spin" />
                    Loading more records…
                  </div>
                ) : hasNextPage ? (
                  <span className="text-gray-400 text-sm">Scroll for more</span>
                ) : (
                  <span className="text-gray-400 text-sm">
                    All {totalRecords} records loaded
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Parameters Modal ─────────────────────────────── */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Parameters — {formatDate(selectedRow.timestamp)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {selectedRow.parameters &&
              Object.keys(selectedRow.parameters).length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(selectedRow.parameters).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          {key}
                        </div>
                        <div className="mt-1 break-words text-sm font-medium text-gray-900">
                          {String(value)}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  No parameters available
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setSelectedRow(null)}
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
