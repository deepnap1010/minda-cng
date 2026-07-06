import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Download, X } from "lucide-react";
import { useMachineStoppage } from "../hooks/usePlcData";
import { usePlcProduct } from "../hooks/usePlcProduct";
import { useQueryClient } from "@tanstack/react-query";
import Pagination from "../Components/Pagination/Pagination";
import { axiosHandler } from "../config/axiosconfig";

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return "—";
    // Show the time exactly as UTC (jo PLC se aa raha hai),
    // browser ka local timezone shift ignore karne ke liye UTC getters use kiye hain.
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    const h = String(d.getUTCHours()).padStart(2, "0");
    const m = String(d.getUTCMinutes()).padStart(2, "0");
    const s = String(d.getUTCSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${h}:${m}:${s}`;
  } catch {
    return "—";
  }
}

function durationMinutes(startTime, stopTime) {
  if (!startTime || !stopTime) return 0;
  const start = new Date(startTime).getTime();
  const stop = new Date(stopTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(stop)) return 0;
  return Math.max(0, Math.round((stop - start) / 60000));
}

function formatDurationHoursMinutes(totalMinutes) {
  const m = totalMinutes != null ? Number(totalMinutes) : NaN;
  if (Number.isNaN(m) || m < 0) return "—";
  const hours = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins} min`;
}

export default function PlcStoppage() {
  const queryClient = useQueryClient();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [showRefresh, setShowRefresh] = useState(false);

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const params = new URLSearchParams();
      if (selectedDevice && selectedDevice !== "All") params.append("machine_name", selectedDevice);
      if (fromDate) params.append("from_date", fromDate);
      if (toDate) params.append("to_date", toDate);

      const response = await axiosHandler.get(`/plc-data/download-pdf?${params.toString()}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Machine-Stoppage-Summary-${new Date().toISOString().slice(0, 10)}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };
  
  const filters = useMemo(() => {
    const f = {};
    if (selectedDevice && selectedDevice !== "All") {
      f.device_id = selectedDevice;
    }
    if (fromDate) f.startDate = fromDate;
    if (toDate) f.endDate = toDate;
    return f;
  }, [selectedDevice, fromDate, toDate]);
  
  // Build query params for the current page
  const queryParams = useMemo(() => ({
    page,
    limit,
    ...filters,
  }), [page, limit, filters]);
  
  // console.log("filters",filters)
  const getMachineStoppage = useMachineStoppage(
    { ...filters, page, limit }
  );
  const { getAllPlcProducts } = usePlcProduct({}, { enabled: false });
  const apiResponse = getMachineStoppage.data || { data: [], pagination: {}, totalMachines: 0, totalStoppedMachines: 0, allDevices: [] };
  const plcList = apiResponse.data || [];
  const pagination = apiResponse.pagination || {};
  const totalMachines = apiResponse.totalMachines || 0;
  const totalStoppedMachines = apiResponse.totalStoppedMachines || 0;
  const totalDowntime = apiResponse.totalDowntime || 0;

  // Human label for the period the downtime/table covers, from the backend's
  // window info (so it always matches the real query window).
  const periodLabel = useMemo(() => {
    const w = apiResponse.window || {};
    if (w.isDefault) {
      const d = w.days || 1;
      return d === 1 ? "Last 24 hours" : `Last ${d} days`;
    }
    const fmtDate = (v) => {
      if (!v) return "";
      const d = new Date(v);
      return isNaN(d) ? String(v) : d.toLocaleDateString();
    };
    if (w.from && w.to) return `${fmtDate(w.from)} → ${fmtDate(w.to)}`;
    return "Last 24 hours";
  }, [apiResponse.window]);

  const isLoading = getMachineStoppage.isLoading;
  const isError = getMachineStoppage.isError;
  const refetch = getMachineStoppage.refetch;

  const uniqueDevices = useMemo(() => {
    // Prefer allDevices from stoppage API if available, otherwise fallback to products
    if (apiResponse.allDevices && apiResponse.allDevices.length > 0) {
      return apiResponse.allDevices;
    }
    const products = getAllPlcProducts.data || [];
    return [...new Set(products.map((p) => p.machine_name).filter(Boolean))];
  }, [apiResponse.allDevices, getAllPlcProducts.data]);

  // Backend now returns one row PER MACHINE, already sorted by downtime DESC
  // (highest-downtime machine first). Each row carries downtime/runtime minutes,
  // the machine's current status and when it was last seen.
  const stoppages = useMemo(() => {
    return plcList.map((row) => {
      const st = String(row.status || "").toLowerCase();
      const statusLabel =
        st === "running" ? "Running" : st === "stopped" ? "Stopped" : (row.status || "—");
      return {
        id: row.device_id,
        machine: row.machine || row.device_id || "—",
        company: row.company || "—",
        code: row.device_id || "—",
        downtimeMinutes: row.downtimeMinutes ?? 0,
        runtimeMinutes: row.runtimeMinutes ?? 0,
        lastSeen: row.lastSeen ? formatDateTime(row.lastSeen) : "—",
        status: statusLabel,
      };
    });
  }, [plcList]);

  // Prefetch the next page in the background for faster navigation
  useEffect(() => {
    if (!getMachineStoppage.data?.pagination?.totalPages || page >= getMachineStoppage.data.pagination.totalPages) return;

    const nextPage = page + 1;
    const nextQueryKey = {
      device_id: filters.device_id,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: nextPage,
      limit,
    };

    queryClient.prefetchQuery({
      queryKey: ["machine-stoppage", nextQueryKey],
      queryFn: async () => {
        const params = { page: nextPage, limit };
        if (filters.device_id) params.machine_name = filters.device_id;
        if (filters.startDate) params.from_date = filters.startDate;
        if (filters.endDate) params.to_date = filters.endDate;

        const res = await axiosHandler.get("/plc-data/stoppage", { params });
        return res?.data || { data: [], pagination: {}, totalMachines: 0, totalStoppedMachines: 0, allDevices: [] };
      },
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh in cache
    });
  }, [page, getMachineStoppage.data?.pagination?.totalPages, limit, queryClient, filters]);

  const handleRefresh = useCallback(async () => {
    setShowRefresh(true);
    try { await refetch(); }
    finally { setTimeout(() => setShowRefresh(false), 500); }
  }, [refetch]);

  const totalMinutes = useMemo(
    () => stoppages.reduce((sum, s) => sum + (s.downtimeMinutes ?? 0), 0),
    [stoppages]
  );

  const totalFinalMinutes = totalDowntime;
  


  return (
      <div className="min-h-full bg-gray-50">
        <div className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Machine Stoppage Summary
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Per-machine downtime over the selected period — highest downtime first.
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Showing: {periodLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-pdf-exclude
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isDownloadingPdf ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Download PDF
              </button>
              <button
                type="button"
                data-pdf-exclude
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={16} className={showRefresh ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
          {showRefresh && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-8 text-gray-500">
              <Loader2 size={24} className="animate-spin" />
              <span>Refreshing stoppage data…</span>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-8 text-gray-500">
              <Loader2 size={24} className="animate-spin" />
              <span>Loading stoppage data…</span>
            </div>
          )}
          {isError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {getMachineStoppage.error?.response?.data?.message || getMachineStoppage.error?.message || "Failed to load stoppage data."}
            </div>
          )}
          {!isLoading && !isError && (
          <>
          <div data-pdf-page>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-gray-600">Total Machines</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">
                {totalMachines}
              </p>
              <p className="mt-1 text-[11px] text-emerald-700">All Machines</p>
            </div>

            <div className="rounded-xl border border-blue-100  px-4 py-3 shadow-sm bg-blue-50/60">
              <p className="text-xs font-medium text-gray-500">Total Stopped Machines</p>
              
              <p className="mt-1 text-2xl font-semibold text-blue-600">
                {totalStoppedMachines}
              </p>
              <p className="mt-1 text-[11px] text-blue-700"> Stopped Machines</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">
                Total Downtime
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-600">
                {(formatDurationHoursMinutes(totalFinalMinutes))}
              </p>
              <p className="mt-1 text-[11px] text-amber-600">{periodLabel}</p>
            </div>
            {/* <div className="rounded-xl border border-emerald-100 bg-emerald-100/30  px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">
                Average Duration Time
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">
                {stoppages.length ? formatDurationHoursMinutes(Math.round(totalMinutes / stoppages.length)) : "—"}
              </p>
              <p className="mt-1 text-[11px] text-emerald-700">Duration Time</p>
            </div> */}

           
          </div>

          <div className="flex flex-wrap items-end gap-3 mt-3" data-pdf-exclude>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                Machine Name
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => {
                  setSelectedDevice(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-48 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Machines</option>
                {uniqueDevices.map((device) => (
                  <option key={device} value={device}>
                    {device}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {(selectedDevice || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDevice("");
                  setFromDate("");
                  setToDate("");
                  setPage(1);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-800"
              >
                <X size={14} />
                Reset filters
              </button>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Machine Downtime
                </h2>
                <p className="text-xs text-gray-500">
                  One row per machine, sorted by total downtime (highest first).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Machine
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Downtime
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Runtime
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Last Seen
                    </th>
                    {/* <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Idle Duration
                    </th> */}
                    {/* <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Reason
                    </th> */}
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white" value={limit}>
                  {stoppages.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-800">
                        <div className="font-semibold">{s.company}</div>
                        <div className="text-[11px] text-gray-500">{s.code}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-xs font-semibold text-rose-600">
                        {s.downtimeMinutes > 0 ? formatDurationHoursMinutes(s.downtimeMinutes) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-700">
                        {s.runtimeMinutes > 0 ? formatDurationHoursMinutes(s.runtimeMinutes) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-700">
                        {s.lastSeen}
                      </td>
                      {/* <td className="whitespace-nowrap px-4 py-2 text-xs font-semibold text-purple-600">
                        {s.type === 'idle' ? formatDurationHoursMinutes(s.durationMinutes) : "—"}
                      </td> */}
                      {/* <td className="px-4 py-2 text-xs text-gray-700 max-w-xs">
                        {s.reason}
                      </td>  */}
                      <td className="whitespace-nowrap px-4 py-2 text-xs">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 font-semibold text-[11px] ${
                            s.status === "Running"
                              ? "bg-emerald-50 text-emerald-600"
                              : s.status === "Stopped"
                              ? "bg-rose-50 text-rose-600"
                              : s.status === "Idle"
                              ? "bg-purple-50 text-purple-600"
                              : s.status === "Resolved"
                              ? "bg-emerald-50 text-emerald-600"
                              : s.status === "Recorded"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
          {stoppages.length === 0 && (
            <div className="mt-6 rounded-xl border border-gray-100 bg-white py-10 text-center text-sm text-gray-500">
              No machine data for this period.
            </div>
          )}
          <Pagination
        page={page}
        setPage={setPage}
        hasNextpage={page < (pagination?.totalPages || 1)}
      /> 
          </>
          )}
        </div>
      </div>
  );
}