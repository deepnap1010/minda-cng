import { useState, useMemo, useRef } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DowntimeCharts from "./PlcDoughnutCharts";
import { ArrowUp, ArrowDown, Loader2, History, Download } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { usePlcDataListing, usePlcTimeDistribution, useMachineStoppage } from "../hooks/usePlcData";
import { usePlcProduct } from "../hooks/usePlcProduct";
import { useNavigate } from "react-router-dom";
import DonutChart from "../Components/DonutChart/donutChart";

function SummaryCard({ card }) {
  const isUpTrend = card.trend === "up";
  const trendColor = isUpTrend ? "text-emerald-600" : "text-rose-600";
  const trendBg = isUpTrend ? "bg-emerald-100" : "bg-rose-100";

  return (
    <div
      className={`rounded-xl border ${card.border} ${card.bg} px-4 py-3 shadow-sm`}
    >
      <p className="text-xs font-medium text-gray-600">{card.label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className={`text-2xl font-semibold ${card.accent}`}>{card.value}</p>
        <div
          className={`flex items-center justify-center rounded-full ${trendBg} p-0.5`}
        >
          {isUpTrend ? (
            <ArrowUp size={14} className={trendColor} />
          ) : (
            <ArrowDown size={14} className={trendColor} />
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-600">{card.subtitle}</p>
    </div>
  );
}

function PlcMachineCard({ machine, products = [] }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const statusVal = getStatusValue(machine) || "—";
  const navigate = useNavigate();
  const statusLower = statusVal.toLowerCase();
  const isRunning = statusLower === "running";
  const isStopped = statusLower === "stopped";
  const isIdle = statusLower === "idle" || statusLower === "—";
  const statusStyles = isRunning
    ? "bg-emerald-500/12 text-emerald-700 border-emerald-200"
    : isStopped
      ? "bg-rose-500/12 text-rose-700 border-rose-200"
      : isIdle
        ? "bg-slate-500/10 text-slate-600 border-slate-200"
        : "bg-amber-500/12 text-amber-700 border-amber-200";
  const dotColor = isRunning
    ? "bg-emerald-500"
    : isStopped
      ? "bg-rose-500"
      : "bg-slate-400";

  const statusColor = isRunning
    ? "bg-emerald-400/40 border-emerald-200 "
    : isStopped
      ? "bg-rose-400/40 border-rose-200"
      : "bg-slate-400/40 border-slate-200";

  return (
    <div
      className={`rounded-2xl border ${statusColor}
       bg-gradient-to-b from-blue-50/60 via-white to-white
        p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3 relative`}
    >
      <div className="flex items-start justify-between pb-2 border-b border-blue-100/60 gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-800">
            {machine.device_id || "N/A"}
          </h3>
          {/* {console.log("this ois my machine======>>>>>", machine.machine.model)} */}
          <p className="text-xs text-gray-500 mt-0.5">
            Company: {machine.companyname || "N/A"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Plant: {machine.plantname || "N/A"}
          </p>

          <p className="text-xs text-gray-500 mt-0.5">
            Assembly Line: {machine.linenumber || "N/A"}
          </p>
          {machine.alarm && (
            <p className="text-xs text-rose-600 mt-1 font-semibold">
              Alarm: {machine.alarm}
            </p>
          )}
        </div>
        <span
          onClick={() =>
            navigate(
              `/plc/history?device_id=${encodeURIComponent(machine.device_id || "")}`,
            )
          }
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide cursor-pointer hover:opacity-80 ${statusStyles}`}
        >
          <History size={14} />
          History
        </span>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusStyles}`}
        >
          {isRunning && (
            <span
              className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-pulse`}
            />
          )}
          {statusVal}
        </span>
      </div>

      {/* Product fields (MATERIAL_CODE, PART_NO, MODEL_CODE) for this machine */}
      {products.length > 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Products on this machine
          </p>
          {products.map((p, i) => (
            <div
              key={p._id || i}
              className="text-xs space-y-0.5 border-b border-slate-200 last:border-0 last:pb-0 pb-1.5 last:pb-0"
            >
              <p className="text-gray-700">
                <span className="text-gray-500">Material Code:</span>{" "}
                <span className="font-medium">{p.material_code || "—"}</span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">Part No:</span>{" "}
                <span className="font-medium">{p.part_no || "—"}</span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">Model Code:</span>{" "}
                <span className="font-medium">{p.model_code || "—"}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs mt-1">
        {/* Model, Material Code, Part No - upar (parameters se alag) */}
        <div className="space-y-1">
          <p className="text-gray-500">Model</p>
          <p className="font-medium text-gray-800">
            {(typeof machine.product === "object"
              ? machine.product?.model
              : null) ||
              machine?.parameters?.model ||
              machine?.machine?.model ||
              "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500">Material Code</p>
          <p className="font-medium text-gray-800">
            {(typeof machine.product === "object"
              ? machine.product?.material_code
              : null) ||
              machine?.parameters?.material_code ||
              "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500">Part No.</p>
          <p className="font-medium text-gray-800">
            {(typeof machine.product === "object"
              ? machine.product?.part_no
              : null) ||
              machine?.parameters?.part_no ||
              "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500">Last Updated</p>
          <p className="font-medium text-gray-800">
            {formatDate(machine.timestamp || machine.created_at)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500">Start Time</p>
          <p className="font-medium text-gray-800">
            {formatDate(machine.start_time || machine.Start_time)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500">Stop Time</p>
          {machine?.Stop_time === null ? (
            <p className="text-green-600">Running</p>
          ) : (
            <p className="font-medium text-gray-800">
              {machine.stop_time
                ? formatDate(machine.stop_time)
                : machine.Stop_time
                  ? formatDate(machine.Stop_time)
                  : "—"}
            </p>
          )}
        </div>
        {/* {machine.latch_force === null ? (
          ""
        ) : (
          <div className="space-y-1">
            <p className="text-gray-500">Latch Force</p>
            <p className="font-semibold text-blue-700">
              {machine.latch_force || 0}
            </p>
          </div>
        )}

        {machine.claw_force === null ? (
          ""
        ) : (
          <div className="space-y-1">
            <p className="text-gray-500">Claw Force</p>
            <p className="font-semibold text-indigo-700">
              {machine.claw_force || 0}
            </p>
          </div>
        )}
        {machine.safety_lever === null ? (
          ""
        ) : (
          <div className="space-y-1">
            <p className="text-gray-500">Safety Lever</p>
            <p className="font-semibold text-emerald-700">
              {machine.safety_lever || 0}
            </p>
          </div>
        )}
        {machine.claw_lever === null ? (
          ""
        ) : (
          <div className="space-y-1">
            <p className="text-gray-500">Claw Lever</p>
            <p className="font-semibold text-purple-700">
              {machine.claw_lever || 0}
            </p>
          </div>
        )}
        {machine.stroke === null ? (
          ""
        ) : (
          <div className="space-y-1 col-span-2">
            <p className="text-gray-500">Stroke</p>
            <p className="font-semibold text-orange-700">
              {machine.stroke || 0}
            </p>
          </div>
        )} */}
        {/* Product - string (object wale upar Model/Material/Part No me dikh rahe) */}
        {machine.product && typeof machine.product !== "object" && (
          <div className="space-y-1">
            <p className="text-gray-500">Product</p>
            <p className="font-semibold text-gray-800">{machine.product}</p>
          </div>
        )}

        {/* Production Count */}
        {machine.production_count !== null &&
          machine.production_count !== undefined && (
            <div className="space-y-1">
              <p className="text-gray-500">Production Count</p>
              <p className="font-semibold text-gray-800">
                {machine.production_count}
              </p>
            </div>
          )}

        {/* Live Data Parameters - scrollable */}
        <div className="col-span-2 mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Live Data
          </p>
          <div className="max-h-44 overflow-y-auto overflow-x-hidden pr-3 custom-scrollbar rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
              {machine?.parameters &&
                Object.keys(machine.parameters).length > 0 &&
                Object.entries(machine.parameters)
                  .filter(
                    ([key]) =>
                      ![
                        "model",
                        "material_code",
                        "part_no",
                        "MODEL",
                        "MATERIAL_CODE",
                        "PART_NO",
                      ].includes(key),
                  )
                  .map(([key, value]) => (
                    <div key={key} className="space-y-0.5 min-w-0">
                      <p
                        className="text-gray-500 "
                        title={key.replaceAll("_", " ")}
                      >
                        {key.replaceAll("_", " ")}
                      </p>
                      <p className="font-semibold text-gray-800 break-words">
                        {typeof value === "object" && value !== null
                          ? JSON.stringify(value)
                          : value}
                      </p>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

function getStatusValue(record) {
  return String(record?.Status ?? record?.status ?? record?.STATUS ?? "").trim();
}

export default function PlcLiveData() {
  const navigate = useNavigate();
  const pdfRef = useRef(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("");

  // Default to "Today" so the live dashboard loads instantly (today's window is
  // bounded + indexed). "All Time" is still available in the dropdown on demand —
  // it runs the full barcode dedup, which is heavier even with the index.
  const [dateRangePreset, setDateRangePreset] = useState("Today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filters = useMemo(() => {
    const f = {};

    if (selectedDevice && selectedDevice !== "All")
      f.device_id = selectedDevice;
    // Status filter applied locally for live data, not sent to API
    if (selectedCompany && selectedCompany !== "All")
      f.company_name = selectedCompany;
    if (selectedPlant && selectedPlant !== "All") f.plant_name = selectedPlant;

    // Date range: use startDate/endDate for API (filters by created_at)
    let computedStart = "";
    let computedEnd = "";

    if (dateRangePreset && dateRangePreset !== "Custom") {
      const now = new Date();
      let fromDate;

      if (dateRangePreset === "Today") {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        computedStart = fromDate.toISOString();
        const endOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
        computedEnd = endOfDay.toISOString();
      } else if (dateRangePreset === "This Week") {
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - now.getDay());
        fromDate.setHours(0, 0, 0, 0);
        computedStart = fromDate.toISOString();
        computedEnd = new Date().toISOString();
      } else if (dateRangePreset === "This Month") {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        computedStart = fromDate.toISOString();
        computedEnd = new Date().toISOString();
      }

      if (computedStart && computedEnd) {
        f.startDate = computedStart;
        f.endDate = computedEnd;
      }
    } else if (startDate || endDate) {
      if (startDate) {
        const d = new Date(startDate);
        d.setHours(0, 0, 0, 0);
        f.startDate = d.toISOString();
      }
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        f.endDate = d.toISOString();
      }
    }

    return f;
  }, [
    selectedDevice,
    selectedCompany,
    selectedPlant,
    dateRangePreset,
    startDate,
    endDate,
  ]);

  const getAllPlcDatalisting = usePlcDataListing(filters, { includeSummary: true });
  const getPlcTimeDistribution = usePlcTimeDistribution(filters);
  // Pull the FULL per-machine list (not just the default 20) so Best-vs-Worst can
  // rank every machine by runtime. The backend already computes all machines and
  // only slices for pagination, so a high limit costs nothing extra. The fleet
  // counts and the 4-row preview table read from the same response unaffected.
  const getMachineStoppage = useMachineStoppage({ ...filters, page: 1, limit: 1000 });
  const { data: timeDistribution = { runTime: 0, stopTime: 0, idleTime: 0 } } =
    getPlcTimeDistribution || {};
  const getAllForOptions = usePlcDataListing({}, { live: true });
  const { getAllPlcProducts } = usePlcProduct({});
  const { data: listingPayload, isLoading, isFetching } = getAllPlcDatalisting;
  const plcDataList = listingPayload?.rows || [];
  const listingSummary = listingPayload?.summary || {
    total_production_barcodes: 0,
    total_error_barcodes: 0,
  };

  const stoppageData = getMachineStoppage.data || { data: [] };
  const stoppageList = stoppageData.data || [];

  // Full-fleet machine counts come from the stoppage endpoint (all-time latest
  // status per device), NOT from the page-limited live listing. The live listing
  // only sees the ~7-day active devices, which is why Total Machines / Stopped
  // read low (9 / 0) instead of the true fleet (e.g. 23 / 12).
  const stoppageFleet = getMachineStoppage.data || {};

  const allDataForOptions = Array.isArray(getAllForOptions.data)
    ? getAllForOptions.data
    : getAllForOptions.data?.rows || [];
  const productsList = getAllPlcProducts.data || [];

  // Dynamic options for Company & Plant dropdowns
  const companyOptions = useMemo(() => {
    const set = new Set(
      allDataForOptions.map((item) => item.companyname).filter(Boolean),
    );
    return Array.from(set).sort();
  }, [allDataForOptions]);

  const plantOptions = useMemo(() => {
    const set = new Set(
      allDataForOptions.map((item) => item.plantname).filter(Boolean),
    );
    return Array.from(set).sort();
  }, [allDataForOptions]);

  // Use all records for general lists, but we need latest state per device for summary cards
  const latestPerDevice = useMemo(() => {
    if (!plcDataList || plcDataList.length === 0) return [];

    const deviceMap = new Map();
    plcDataList.forEach((item) => {
      const deviceId = item.device_id || "Unknown";
      const existing = deviceMap.get(deviceId);
      // Prefer `timestamp` for PLC state freshness; some rows may have inconsistent `created_at`.
      const itemTime = new Date(
        item.timestamp || item.created_at || item.start_time || item.stop_time || 0,
      ).getTime();
      const existingTime = existing ? new Date(existing.created_at || existing.timestamp || 0).getTime() : -1;

      if (!existing || itemTime > existingTime) {
        deviceMap.set(deviceId, item);
      }
    });

    let latestRecords = Array.from(deviceMap.values());
    
    // Apply status filter locally for live data
    if (selectedStatus && selectedStatus !== "") {
      const selLower = selectedStatus.toLowerCase();
      latestRecords = latestRecords.filter((item) =>
        getStatusValue(item).toLowerCase() === selLower
      );
    }
   
    return latestRecords;
  }, [plcDataList, selectedStatus]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!latestPerDevice || latestPerDevice.length === 0) {
      return {
        totalProduction: 0,
        totalDevices: 0,
        totalParameterValues: 0,
      };
    }

    const totalProduction = Number(listingSummary.total_production_barcodes || 0);

    // Get unique device IDs
    const totalDevices = latestPerDevice.length;

    let totalParameterValues = 0;
    latestPerDevice.forEach((item) => {
      if (item.parameters && typeof item.parameters === "object") {
        totalParameterValues += Object.keys(item.parameters).length;
      }
    });

    return {
      totalProduction,
      totalDevices,
      totalParameterValues,
    };
  }, [latestPerDevice, listingSummary]);

  const stoppages = useMemo(() => {
    // 1. Prepare valid records with raw timestamps
    const validRecords = plcDataList
      .filter((row) => row.Start_time || row.stop_time || row.Stop_time)
      .map((row) => {
        const startStr = row.Start_time || row.timestamp;
        const stopStr = row.stop_time || row.Stop_time;

        return {
          ...row,
          _rawStart: startStr ? new Date(startStr).getTime() : 0,
          _rawStop: stopStr ? new Date(stopStr).getTime() : null,
          _ts: startStr ? new Date(startStr).getTime() : 0,
        };
      });

    // 2. Group by device
    const groupedByDevice = {};
    validRecords.forEach((record) => {
      const devId = record.device_id || "unknown";
      if (!groupedByDevice[devId]) groupedByDevice[devId] = [];
      groupedByDevice[devId].push(record);
    });

    const processed = [];

    // 3. Process each device group
    Object.values(groupedByDevice).forEach((group) => {
      // Sort by start time (ascending)
      group.sort((a, b) => a._rawStart - b._rawStart);

      group.forEach((row, index) => {
        // 4. Calculate stopped gap minutes
        let stoppedGapMinutes = null;

        if (index > 0) {
          const prev = group[index - 1];
          if (prev._rawStop && row._rawStart) {
            const diff = row._rawStart - prev._rawStop;
            if (diff > 0) {
              stoppedGapMinutes = Math.round(diff / 60000);
            }
          }
        }

        const start = row.Start_time || row.timestamp;
        const stop = row.Stop_time ?? null;
        const isRunning = !stop && start;
        const mins = isRunning ? null : durationMinutes(start, stop);

        processed.push({
          id: row._id,
          machine: row.model || row.device_id || "—",
          company: row.companyname,
          code: row.device_id || "—",
          startTime: formatDateTime(start),
          stopTime: isRunning ? "—" : formatDateTime(stop),
          durationMinutes: mins,
          stoppedGapMinutes, // ✅ NEW FIELD
          reason: row.reason || "—",
          status: isRunning ? "Running" : "Stopped",
          _sortTime: row._rawStart,
          type: "session",
          parameters:row?.parameters,
          Barcode_details:row?.Barcode_details,
        });
      });

      // Idle detection based on production_count stability (30s threshold)
      let lastProdCount = -1;
      let lastProdChangeTime = 0;
      let isIdling = false;
      let idleStartTs = 0;

      group.forEach((r) => {
        const currentTs = r._ts;
        const currentProd = r.production_count;
        if (!currentTs || currentProd === undefined || currentProd === null)
          return;

        if (lastProdCount === -1) {
          lastProdCount = currentProd;
          lastProdChangeTime = currentTs;
          return;
        }

        if (currentProd !== lastProdCount) {
          if (isIdling) {
            const durationMins = Math.round((currentTs - idleStartTs) / 60000);
            if (durationMins > 0) {
              processed.push({
                id: `idle-${r._id}-${idleStartTs}`,
                machine: r.model || r.device_id || "—",
                company: r.companyname,
                code: r.device_id || "—",
                startTime: formatDateTime(new Date(idleStartTs).toISOString()),
                stopTime: formatDateTime(new Date(currentTs).toISOString()),
                durationMinutes: durationMins,
                stoppedGapMinutes: null,
                reason: "No Production",
                status: "Idle",
                _sortTime: idleStartTs,
                type: "idle",
              });
            }
            isIdling = false;
          }
          lastProdCount = currentProd;
          lastProdChangeTime = currentTs;
        } else {
          const diffMs = currentTs - lastProdChangeTime;
          if (!isIdling && diffMs > 30000) {
            isIdling = true;
            idleStartTs = lastProdChangeTime + 30000;
          }
        }
      });

      if (isIdling && group.length > 0) {
        const lastRecord = group[group.length - 1];
        const endTs = lastRecord._ts;
        if (endTs > idleStartTs) {
          const durationMins = Math.round((endTs - idleStartTs) / 60000);
          processed.push({
            id: `idle-open-${lastRecord.device_id}`,
            machine: lastRecord.model || lastRecord.device_id || "—",
            company: lastRecord.companyname,
            code: lastRecord.device_id || "—",
            startTime: formatDateTime(new Date(idleStartTs).toISOString()),
            stopTime: "—",
            durationMinutes: durationMins,
            stoppedGapMinutes: null,
            reason: "No Production (Current)",
            status: "Idle",
            _sortTime: idleStartTs,
            type: "idle",
          });
        }
      }
    });

    // 5. Sort latest first (dashboard-friendly)
    return processed.sort((a, b) => b._sortTime - a._sortTime);
  }, [plcDataList]);

  const stoppagesForTable = useMemo(() => {
    let filtered = stoppageList.slice(0, 4).map((row) => {
      // The stoppage endpoint returns the per-machine overview shape:
      // { device_id, machine, company, status, downtimeMinutes, runtimeMinutes, lastSeen }
      // — NOT raw start/stop rows. Map those fields directly (the old code read
      // companyname / stopped_duration / Start_time which don't exist here, so
      // every row showed "—" and "0 min").
      const downMins = Number(row.downtimeMinutes) || 0;
      return {
        id: row.device_id || row._id,
        machine: row.machine || row.device_id || "—",
        company: row.company || row.companyname || "—",
        code: row.device_id || "—",
        startTime: row.lastSeen ? formatDateTime(row.lastSeen) : "—",
        stopTime: "—",
        durationMinutes: downMins,
        stoppedGapMinutes: downMins,
        status: getStatusValue(row) || row.status || "Stopped",
      };
    });

    // Filter by selected status if specified
    if (selectedStatus && selectedStatus !== "") {
      const selLower = selectedStatus.toLowerCase();
      filtered = filtered.filter((item) =>
        String(item.status || "").toLowerCase() === selLower
      );
    }

    return filtered;
  }, [stoppageList, selectedStatus]);

  // Active = Running, Inactive = Stopped/Idle/other
  const machineStatusCounts = useMemo(() => {
    const active = latestPerDevice.filter((m) => {
      const status = getStatusValue(m).toLowerCase()
      return status === "running"
    }).length
    const inactive = latestPerDevice.length - active;
    return { activeMachines: active, inactiveMachines: inactive };
  }, [latestPerDevice]);

//   const totalErrors = useMemo(() => {
//     return stoppages.filter((s) => s?.parameters?.ERROR_STATUS
//  !== "OK").length;
//   }, [stoppages]);
// const totalErrors = useMemo(() => {
//   const idMap = new Map();

//   // 🔥 STEP 1: Sort by timestamp ASC (oldest first)
//   const sorted = [...(stoppages || [])].sort((a, b) => {
//     const t1 = new Date(a?.timestamp).getTime() || 0;
//     const t2 = new Date(b?.timestamp).getTime() || 0;
//     return t1 - t2;
//   });

//   // 🔥 STEP 2: Freeze first occurrence per unique BarcodeID
//   sorted.forEach((row) => {
//     const id = row?.Barcode_details?.BarcodeID;
//     if (!id) return;

//     // ✅ Only first occurrence is added
//     if (!idMap.has(id)) {
//       idMap.set(id, row);
//     }
//   });

//   // 🔥 STEP 3: Count errors from frozen data
//   let errorCount = 0;
//   idMap.forEach((row) => {
//     const status = String(row?.parameters?.ERROR_STATUS ?? "").trim().toUpperCase();
//     if (status !== "OK") errorCount++;
//   });

//   return errorCount;

// }, [stoppages]);

const totalErrors = useMemo(
  () => Number(listingSummary.total_error_barcodes || 0),
  [listingSummary],
);

  // Products grouped by machine_name (device_id) for machine cards
  const productsByMachine = useMemo(() => {
    const map = {};
    productsList.forEach((p) => {
      const key = (p.machine_name || "").trim();
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [productsList]);

  // Get unique devices and models for filters
  const uniqueDevices = useMemo(() => {
    const devices = new Set(
      plcDataList.map((item) => item.device_id).filter(Boolean),
    );
    return Array.from(devices).sort();
  }, [plcDataList]);

  const uniqueModels = useMemo(() => {
    const models = new Set(
      plcDataList.map((item) => item.model).filter(Boolean),
    );
    return Array.from(models).sort();
  }, [plcDataList]);

  // Prepare chart data
  // Prepare chart data - updated to include more fields
  const forceChartData = useMemo(() => {
    return latestPerDevice.slice(0, 10).map((item) => {
      const base = {
        name: item.device_id || "Unknown",
      };

      // Add all numeric parameters
      if (item.parameters && typeof item.parameters === "object") {
        Object.entries(item.parameters).forEach(([key, value]) => {
          // Only include numeric values (skip strings like "ALARM")
          if (typeof value === "number") {
            base[key] = value;
          }
        });
      }

      return base;
    });
  }, [latestPerDevice]);

  const allParameterKeys = useMemo(() => {
    const keys = new Set();
    latestPerDevice.forEach((item) => {
      if (item.parameters && typeof item.parameters === "object") {
        Object.keys(item.parameters).forEach((key) => {
          // Only numeric ones
          if (typeof item.parameters[key] === "number") {
            keys.add(key);
          }
        });
      }
    });
    return Array.from(keys);
  }, [latestPerDevice]);

  const strokeProductionData = useMemo(() => {
    return latestPerDevice.slice(0, 10).map((item) => {
      let paramCount = 0;
      if (item.parameters && typeof item.parameters === "object") {
        paramCount = Object.keys(item.parameters).length;
      }

      return {
        name: item.device_id || "Unknown",
        stroke: item.stroke || 0,
        productionCount: item.production_count || 0,
        parametersCount: paramCount,
      };
    });
  }, [latestPerDevice]);

  const summaryCards = [
    {
      label: "Total Machines",
      value: stoppageFleet.totalMachines ?? summaryStats.totalDevices,
      subtitle: "All Devices",
      accent: "text-purple-600",
      border: "border-purple-100",
      bg: "bg-purple-50",
      trend: "up",
    },
    {
      label: "Total Production",
      value: summaryStats.totalProduction,
      subtitle: "All Records",
      accent: "text-blue-600",
      border: "border-blue-100",
      bg: "bg-blue-50",
      trend: "up",
    },
    {
      label: "Total Parameters",
      value: summaryStats.totalParameterValues,
      subtitle: "All readings",
      accent: "text-purple-600",
      border: "border-purple-100",
      bg: "bg-purple-50",
      trend: "up",
    },
    // {
    //   label: "Avg Production Count",
    //   value: summaryStats.avgProductionCount,
    //   subtitle: "Per Record",
    //   accent: "text-rose-500",
    //   border: "border-rose-100",
    //   bg: "bg-rose-50",
    //   trend: "up",
    // },
    // {
    //   label: "Total Unique Parameters",
    //   value: summaryStats.totalUniqueParameters,
    //   subtitle: "Different types",
    //   accent: "text-indigo-600",
    //   border: "border-indigo-100",
    //   bg: "bg-indigo-50",
    //   trend: "up",
    // },

    // Option B - Total parameter readings collected

    // Option C - Average per record
    // {
    //   label: "Avg Parameters",
    //   value: summaryStats.avgParametersPerRecord,
    //   subtitle: "Per record",
    //   accent: "text-cyan-600",
    //   border: "border-cyan-100",
    //   bg: "bg-cyan-50",
    //   trend: "up",
    // },
    // {
    //   label: "Avg Latch Force",
    //   value: summaryStats.avgLatchForce,
    //   subtitle: "Overall Average",
    //   accent: "text-emerald-600",
    //   border: "border-emerald-100",
    //   bg: "bg-emerald-50",
    //   trend: "up",
    // },
    {
      label: "Total Running Machines",
      value: stoppageFleet.totalRunningMachines ?? machineStatusCounts.activeMachines,
      subtitle: "Currently Running",
      accent: "text-emerald-600",
      border: "border-emerald-100",
      bg: "bg-emerald-50",
      trend: "up",
    },
    {
      label: "Total Stopped Machines",
      value: stoppageFleet.totalStoppedMachines ?? machineStatusCounts.inactiveMachines,
      subtitle: "Currently Stopped",
      accent: "text-rose-500",
      border: "border-rose-100",
      bg: "bg-rose-50",
      trend: "up",
    },
    {
      label: "Total Errors",
      value: totalErrors,
      subtitle: "Recorded Errors",
      accent: "text-red-600",
      border: "border-red-200",
      bg: "bg-red-100",
      trend: "up",
    },
    // {
    //   label: "Avg Claw Force",
    //   value: summaryStats.avgClawForce,
    //   subtitle: "Overall Average",
    //   accent: "text-cyan-600",
    //   border: "border-cyan-100",
    //   bg: "bg-cyan-50",
    //   trend: "up",
    // },

    // {
    //   label: "Avg Safety Lever",
    //   value: summaryStats.avgSafetyLever,
    //   subtitle: "Overall Average",
    //   accent: "text-orange-500",
    //   border: "border-orange-100",
    //   bg: "bg-orange-50",
    //   trend: "up",
    // },
    // {
    //   label: "Avg Claw Lever",
    //   value: summaryStats.avgClawLever,
    //   subtitle: "Overall Average",
    //   accent: "text-indigo-600",
    //   border: "border-indigo-100",
    //   bg: "bg-indigo-50",
    //   trend: "up",
    // },
    // {
    //   label: "Total Stroke",
    //   value: summaryStats.totalStroke,
    //   subtitle: "Total Stroke Count",
    //   accent: "text-amber-500",
    //   border: "border-amber-100",
    //   bg: "bg-amber-50",
    //   trend: "up",
    // },
  ];

  const lastUpdated = useMemo(() => {
    if (!plcDataList || plcDataList.length === 0)
      return "No data";
    const latest = plcDataList[0];
    const date = new Date(latest.created_at || latest.timestamp || Date.now());
    return date.toLocaleTimeString("en-GB");
  }, [plcDataList]);

  // Calculate best and worst machine data
  const bestWorstMachineData = useMemo(() => {
    // Operating duration (runtime) per machine comes from the stoppage endpoint,
    // which derives it reliably from the status+timestamp sequence (LEAD over
    // device_id). The previous version read single-row Start_time/Stop_time, which
    // are frequently missing or backwards in this data — so the chart was almost
    // always empty ("No records with start/stop times").
    const machineData = (stoppageList || [])
      .map((m) => {
        const runMin = Number(m.runtimeMinutes) || 0;
        const downMin = Number(m.downtimeMinutes) || 0;
        return {
          device_id: m.machine || m.device_id || "Unknown",
          company: m.company || "N/A",
          durationMinutes: runMin,
          durationHours: (runMin / 60).toFixed(2),
          downtimeHours: (downMin / 60).toFixed(2),
          status: m.status || "—",
        };
      })
      // Keep every real machine and rank by runtime. (Don't drop machines with
      // 0 runtime — otherwise a fleet that is mostly idle/stopped shows nothing.)
      .filter((m) => m.device_id && m.device_id !== "Unknown");

    if (machineData.length === 0) return { chart: [], cards: null };

    const bestMachine = machineData.reduce((prev, current) =>
      current.durationMinutes > prev.durationMinutes ? current : prev,
    );
    const worstMachine = machineData.reduce((prev, current) =>
      current.durationMinutes < prev.durationMinutes ? current : prev,
    );

    return {
      chart: [
        {
          name: `${bestMachine.device_id} (Best)`,
          duration: parseFloat(bestMachine.durationHours),
          company: bestMachine.company,
          type: "best",
        },
        {
          name: `${worstMachine.device_id} (Worst)`,
          duration: parseFloat(worstMachine.durationHours),
          company: worstMachine.company,
          type: "worst",
        },
      ],
      cards: { bestMachine, worstMachine },
    };
  }, [stoppageList]);

  const loadLogoAsDataUrl = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        try {
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleDownloadPdf = async () => {
    if (!pdfRef.current || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      let logoDataUrl = null;
      const logoUrl = `${window.location.origin}/logo.svg`;
      try {
        logoDataUrl = await loadLogoAsDataUrl(logoUrl);
      } catch {
        try {
          logoDataUrl = await loadLogoAsDataUrl(
            "https://jpmgroup.co.in/assets/svg/logo-color.svg",
          );
        } catch {
          logoDataUrl = null;
        }
      }

      const sections = pdfRef.current.querySelectorAll("[data-pdf-page]");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const margin = 10;
      const logoHeight = 10;
      const logoGap = 4;
      const chartTop = margin + (logoDataUrl ? logoHeight + logoGap : 0);
      const contentWidth = imgWidth - margin * 2;
      let isFirstPage = true;

      const addLogo = () => {
        if (logoDataUrl) {
          const logoW = 45;
          pdf.addImage(logoDataUrl, "PNG", margin, 5, logoW, logoHeight);
        }
      };

      const opts = {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f9fafb",
        onclone: (clonedDoc) => {
          const btn = clonedDoc.querySelector("[data-pdf-exclude]");
          if (btn) btn.style.display = "none";
        },
      };

      const pageHeight = 297;
      const contentHeight = pageHeight - chartTop - margin;
      const gap = 4;
      // First page: 3 charts; rest: 2 charts each
      const getChartHeight = (i) => {
        if (i < 3) return (contentHeight - 2 * gap) / 3;
        if (i < 5) return (contentHeight - gap) / 2;
        return contentHeight; // last page: 1 chart, full height
      };
      const getSlot = (i) => {
        if (i < 3) return { page: 0, slot: i };
        if (i < 5) return { page: 1, slot: i - 3 };
        return { page: 2, slot: 0 };
      };

      let lastPage = -1;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const canvas = await html2canvas(section, opts);
        const imgData = canvas.toDataURL("image/png");
        const imgHeightMm = (canvas.height * contentWidth) / canvas.width;

        const chartHeight = getChartHeight(i);
        const { page, slot } = getSlot(i);

        if (page > lastPage && lastPage >= 0) {
          pdf.addPage();
          addLogo();
        }
        lastPage = page;
        if (i === 0) {
          addLogo();
          isFirstPage = false;
        }

        let finalWidth, finalHeight;
        if (imgHeightMm > chartHeight) {
          finalHeight = chartHeight;
          finalWidth = contentWidth * (chartHeight / imgHeightMm);
        } else {
          finalHeight = imgHeightMm;
          finalWidth = contentWidth;
        }
        const x = (imgWidth - finalWidth) / 2;
        const y = chartTop + slot * (chartHeight + gap);

        pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
      }

      const fileName = `PLC-Live-Data-Dashboard-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div
        ref={pdfRef}
        className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              PLC Live Data Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor real-time PLC machine performance and status
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Last updated: {lastUpdated}
              {isFetching && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  Updating...
                </span>
              )}
            </p>
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
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Download PDF
            </button>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              LIVE
            </span>
          </div>
        </div>

        {/* Filters */}
        <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur mt-2">
          {/* Company - dynamic from API */}
          <div className="flex  flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="h-9 w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
              {companyOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Plant - dynamic from API */}
          <div className="flex  flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">
              Plant
            </label>
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="h-9 w-36  rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Plants</option>
              {plantOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex  flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">
              Date Range
            </label>
            <select
              value={dateRangePreset}
              onChange={(e) => {
                setDateRangePreset(e.target.value);
                // Optional: clear custom dates when preset changes
                if (e.target.value !== "Custom") {
                  setStartDate("");
                  setEndDate("");
                }
              }}
              className="h-9 w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Range</option>
            </select>

            {/* Show date inputs only when Custom is selected */}
            {dateRangePreset === "Custom" && (
              <div className="mt-1 flex gap-2">
                <div className="flex-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 w-36 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-blue-500 focus:outline-none "
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Machine Name */}
          <div className="flex  flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">
              Machine Name
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Machines</option>
              {uniqueDevices.map((device) => (
                <option key={device} value={device}>
                  {device}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex  flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Running">Running</option>
              <option value="Stopped">Stopped</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="ml-auto flex items-center">
            <button
              onClick={() => {
                setSelectedCompany("");
                setSelectedPlant("");
                setDateRangePreset("");
                setStartDate("");
                setEndDate("");
                setSelectedDevice("");
                setSelectedStatus("");
              }}
              className="h-9 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 hover:cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </section>

        {/* Summary cards */}
        <div
          data-pdf-page
          className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} card={card} />
          ))}
        </div>

        <div data-pdf-page>
          <DowntimeCharts filters={filters} />
        </div>

        <div data-pdf-page>
          <DonutChart
            runTime={timeDistribution.runTime}
            stopTime={timeDistribution.stopTime}
            idleTime={timeDistribution.idleTime}
          />
        </div>

        {/* Machine Performance - Best vs Worst */}
        <div className="mt-6">
          <div
            data-pdf-page
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-l font-semibold text-gray-800">
                Machine Performance (Best vs Worst)
              </h2>
              <span className="text-xs text-gray-500">
                Operating Duration Comparison
              </span>
            </div>

            {/* 👇 NEW FLEX WRAPPER */}
            <div className="flex flex-col lg:flex-row gap-8 mx-4">
              {/* LEFT SIDE - GRAPH */}
              <div className="lg:w-1/2 h-90">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : plcDataList.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No data available
                  </div>
                ) : bestWorstMachineData.chart.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No records with start/stop times
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bestWorstMachineData.chart} barSize={80}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        label={{
                          value: "Duration (Hours)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="duration"
                        name="Operating Duration"
                        radius={[8, 8, 0, 0]}
                        shape={(props) => {
                          const { x, y, width, height, payload } = props;
                          const fillColor =
                            payload.type === "best" ? "#10b981" : "#ef4444";
                          return (
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              fill={fillColor}
                              rx={8}
                              ry={8}
                            />
                          );
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* RIGHT SIDE - CARDS */}
              {bestWorstMachineData.cards && (
                <div className="lg:w-1/2 flex flex-col gap-4 ">
                  {/* Best Machine */}
                  <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUp size={18} className="text-emerald-600" />
                      <h3 className="text-sm font-semibold text-emerald-700">
                        Best Machine
                      </h3>
                    </div>

                    <p className="text-lg font-bold text-emerald-900">
                      {bestWorstMachineData.cards.bestMachine.device_id}
                    </p>

                    <p className="text-xs text-emerald-600 mt-1">
                      {bestWorstMachineData.cards.bestMachine.company}
                    </p>

                    <p className="text-sm font-semibold text-emerald-700 mt-2">
                      {bestWorstMachineData.cards.bestMachine.durationHours}{" "}
                      hours
                    </p>

                    <p className="text-[10px] text-emerald-600 mt-1">
                      Downtime {bestWorstMachineData.cards.bestMachine.downtimeHours}h
                      {" · "}
                      {bestWorstMachineData.cards.bestMachine.status}
                    </p>
                  </div>

                  {/* Worst Machine */}
                  <div className="rounded-lg border-2 border-rose-200 bg-rose-50 px-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowDown size={18} className="text-rose-600" />
                      <h3 className="text-sm font-semibold text-rose-700">
                        Worst Machine
                      </h3>
                    </div>

                    <p className="text-lg font-bold text-rose-900">
                      {bestWorstMachineData.cards.worstMachine.device_id}
                    </p>

                    <p className="text-xs text-rose-600 mt-1">
                      {bestWorstMachineData.cards.worstMachine.company}
                    </p>

                    <p className="text-sm font-semibold text-rose-700 mt-2">
                      {bestWorstMachineData.cards.worstMachine.durationHours}{" "}
                      hours
                    </p>

                    <p className="text-[10px] text-rose-600 mt-1">
                      Downtime {bestWorstMachineData.cards.worstMachine.downtimeHours}h
                      {" · "}
                      {bestWorstMachineData.cards.worstMachine.status}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stoppages Data */}
        <div
          data-pdf-page
          className="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Stoppage Details
              </h2>
              <p className="text-xs text-gray-500">
                Machine name, start / stop time and stoppage duration.
              </p>
            </div>
            <button
              onClick={() => navigate("/plc-data/stoppage")}
              className="h-8 rounded-xl bg-blue-600 px-4 hover:cursor-pointer text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm whitespace-nowrap">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                    Machine
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                    Start Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                    Stopped Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                    Stopped Duration
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {stoppagesForTable.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-800">
                      <div className="font-semibold">{s.company}</div>
                      <div className="text-[11px] text-gray-500">{s.code}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-700">
                      {s.startTime}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-700">
                      {s.stopTime}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs font-semibold text-gray-900">
                      {formatDurationHoursMinutes(s.stoppedGapMinutes)}
                    </td>
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
        {stoppages.length === 0 && (
          <div className="mt-6 rounded-xl border border-gray-100 bg-white py-10 text-center text-sm text-gray-500">
            No stoppage records yet. PLC data with start/stop time will appear
            here.
          </div>
        )}
      </div>
    </div>
  );
}