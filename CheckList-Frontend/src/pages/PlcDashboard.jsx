import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Loader2, History } from "lucide-react";
import { usePlcDashboard, usePlcTimeDistribution, usePlcDashboardOptions } from "../hooks/usePlcData";
import { usePlcProduct } from "../hooks/usePlcProduct";
import DowntimeCharts from "./PlcDoughnutCharts";
import DonutChart from "../Components/DonutChart/donutChart";

function getStatusValue(record) {
  return String(record?.Status ?? record?.status ?? record?.STATUS ?? "").trim();
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
  const isIdle = statusLower === "idle" || statusLower === "—" || statusLower === "";

  const statusStyles = isRunning
    ? "bg-emerald-500/12 text-emerald-700 border-emerald-200"
    : isStopped
      ? "bg-rose-500/12 text-rose-700 border-rose-200"
      : isIdle
        ? "bg-white text-slate-600 border-slate-200"
        : "bg-amber-500/12 text-amber-700 border-amber-200";

  const dotColor = isRunning
    ? "bg-emerald-500"
    : isStopped
      ? "bg-rose-500"
      : "bg-slate-400";

  const statusColor = isRunning
    ? "bg-emerald-50/90 border-emerald-200"
    : isStopped
      ? "bg-rose-50/90 border-rose-200"
      : "bg-white border-slate-200";

  // Check if parameters have ONLY the 5 required fields
  const requiredFields = [
    "OPERATOR",
    "Operatorname",
    "ERROR_STATUS",
    "line_name",
    "Shift",
  ];
  const paramKeys = machine?.parameters ? Object.keys(machine.parameters) : [];

  // Check if parameters have exactly these 5 fields and nothing else
  const hasExactly5Fields =
    paramKeys.length === 5 &&
    requiredFields.every((field) => machine?.parameters?.[field]) &&
    requiredFields.every((field) => paramKeys.includes(field));

  const showHmiError = isRunning && hasExactly5Fields;

  return (
    <div
      className={`rounded-2xl border ${statusColor}
       bg-gradient-to-b from-blue-50/60 via-white to-white
        p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3 relative`}
    >
      <div className="flex items-start justify-between pb-2 border-b border-blue-100/60 gap-3">
        <div className="min-w-0 flex-wrap">
          <h3 className="text-[14px] font-semibold text-gray-800">
            {machine.device_id || "N/A"}
          </h3>
        </div>
        <div className=" flex align-center justify-center gap-2"> 
          <span
            onClick={() =>
              navigate(
                `/plc/history?device_id=${encodeURIComponent(machine.device_id || "")}`,
              )
            }
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px]  font-semibold uppercase tracking-wide cursor-pointer hover:opacity-80 ${statusStyles}`}
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
      </div>
      <div className="space-y-1 flex justify-between gap-3">
        {/* {console.log("this ois my machine======>>>>>", machine.machine.model)} */}
        <div className="">
          <div className="text-xs text-gray-500 mt-0.5">
            Company: {machine.companyname || "N/A"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Plant: {machine.plantname || "N/A"}
          </div>

          <div className="text-xs text-gray-500 mt-0.5">
            Assembly Line: {machine.linenumber || "N/A"}
          </div>
          {machine.alarm && (
            <p className="text-xs text-rose-600 mt-1 font-semibold">
              Alarm: {machine.alarm}
            </p>
          )}
        </div>

        {showHmiError && (
          <div className="">
            <p
              className={`${showHmiError ? "text-rose-600" : "text-green-600"} text-[12px] bg-red-100 border border-red-300 rounded-xl px-2`}
            >
              {showHmiError ? "HMI Connection Error" : "Connected"}
            </p>
          </div>
        )}
      </div>

      {/* "Products on this machine" list removed — the per-record Model /
          Material Code / Part No below already shows the current product. */}


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

        {machine?.Stop_time === null ? (
          ""
        ) : (
          <div className="space-y-1">
            <p className="text-gray-500">Stop Time</p>
            {machine?.Stop_time === null ? (
              <p className="text-green-600">Running</p>
            ) : (
              <p className="font-medium text-gray-800">
                {machine?.Stop_time
                  ? formatDate(machine?.Stop_time)
                  : machine?.Stop_time
                    ? formatDate(machine?.Stop_time)
                    : "—"}
              </p>
            )}
          </div>
        )}
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
                        className="text-gray-500 break-words"
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

export default function PlcLiveData() {
  const [selectedDevice, setSelectedDevice] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("");

  const [dateRangePreset, setDateRangePreset] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filters = useMemo(() => {
    const f = {};
    if (selectedDevice && selectedDevice !== "All") {
      f.device_id = selectedDevice;
    }
    if (selectedModel && selectedModel !== "All") {
      f.model = selectedModel;
    }
    if (selectedStatus && selectedStatus !== "All") {
      f.status = selectedStatus;
    }
    if (selectedCompany && selectedCompany !== "All") {
      f.company_name = selectedCompany;
    }
    if (selectedPlant && selectedPlant !== "All") {
      f.plant_name = selectedPlant;
    }

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
    selectedModel,
    selectedStatus,
    selectedCompany,
    selectedPlant,
    dateRangePreset,
    startDate,
    endDate,
  ]);

  const getPlcDashboard = usePlcDashboard(filters, {
    live: true,
    page,
    limit: pageSize,
  });
  const getPlcTimeDistribution = usePlcTimeDistribution(filters);
  const getPlcDashboardOptions = usePlcDashboardOptions();
  const { data: timeDistribution = { runTime: 0, stopTime: 0, idleTime: 0 } } =
    getPlcTimeDistribution || {};
  const { getAllPlcProducts } = usePlcProduct({});
  
  const plcResponse = getPlcDashboard.data || { data: [], pagination: {} };
  const plcDataList = plcResponse.data || [];
  const pagination = plcResponse.pagination || {};
  const isLoading = getPlcDashboard.isLoading;
  const isFetching = getPlcDashboard.isFetching;

  const dashboardOptions = getPlcDashboardOptions.data || { companies: [], plants: [], models: [], statuses: [] };

  const productsList = getAllPlcProducts?.data || [];

  const companyOptions = dashboardOptions?.companies || [];
  const plantOptions = dashboardOptions?.plants || [];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!plcDataList || plcDataList.length === 0) {
      return {
        totalProduction: 0,
        avgLatchForce: 0,
        avgClawForce: 0,
        totalDevices: 0,
        avgSafetyLever: 0,
        avgClawLever: 0,
        totalStroke: 0,
        avgProductionCount: 0,
      };
    }

    const totalProduction = plcDataList.reduce(
      (sum, item) => sum + (item.production_count || 0),
      0,
    );
    const avgLatchForce = Math.round(
      plcDataList.reduce((sum, item) => sum + (item.latch_force || 0), 0) /
        plcDataList.length,
    );
    const avgClawForce = Math.round(
      plcDataList.reduce((sum, item) => sum + (item.claw_force || 0), 0) /
        plcDataList.length,
    );
    const avgSafetyLever = Math.round(
      plcDataList.reduce((sum, item) => sum + (item.safety_lever || 0), 0) /
        plcDataList.length,
    );
    const avgClawLever = Math.round(
      plcDataList.reduce((sum, item) => sum + (item.claw_lever || 0), 0) /
        plcDataList.length,
    );
    const totalStroke = plcDataList.reduce(
      (sum, item) => sum + (item.stroke || 0),
      0,
    );
    const avgProductionCount = Math.round(totalProduction / plcDataList.length);

    // Get unique device IDs
    const uniqueDevices = new Set(
      plcDataList.map((item) => item.device_id).filter(Boolean),
    );
    const totalDevices = uniqueDevices.size;

    return {
      totalProduction,
      avgLatchForce,
      avgClawForce,
      totalDevices,
      avgSafetyLever,
      avgClawLever,
      totalStroke,
      avgProductionCount,
    };
  }, [plcDataList]);

  const latestPerDevice = useMemo(() => plcDataList, [plcDataList]);
  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);

  useEffect(() => {
    setPage(1);
  }, [selectedCompany, selectedPlant, selectedDevice, selectedStatus]);

  const paginatedMachines = useMemo(() => latestPerDevice, [latestPerDevice]);

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
  const forceChartData = useMemo(() => {
    return latestPerDevice.slice(0, 10).map((item) => ({
      name: item.device_id || "Unknown",
      latchForce: item.latch_force || 0,
      clawForce: item.claw_force || 0,
      safetyLever: item.safety_lever || 0,
      clawLever: item.claw_lever || 0,
    }));
  }, [latestPerDevice]);

  const strokeProductionData = useMemo(() => {
    return latestPerDevice.slice(0, 10).map((item) => ({
      name: item.device_id || "Unknown",
      stroke: item.stroke || 0,
      productionCount: item.production_count || 0,
    }));
  }, [latestPerDevice]);

  const lastUpdated = useMemo(() => {
    if (!plcDataList || plcDataList.length === 0) return "No data";
    const latest = plcDataList[0];
    const date = new Date(latest.last_updated || latest.updated_at || Date.now());
    return date.toLocaleTimeString("en-GB");
  }, [plcDataList]);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              PLC Machine Data
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor real-time PLC machine data
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
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              LIVE
            </span>
          </div>
        </div>

        {/* FIlters */}
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
          {/* <div className="flex  flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">
              Date Range
            </label>
            <select
              value={dateRangePreset}
              onChange={(e) => {
                setDateRangePreset(e.target.value);
               
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
          </div> */}

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
              className="h-9 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        </section>

        {/* Run Time / Idle Time / Stop Time Cards & Doughnut Chart */}
        {/* <DonutChart
          runTime={timeDistribution.runTime ?? 0}
          stopTime={timeDistribution.stopTime ?? 0}
          idleTime={timeDistribution.idleTime ?? 0}
        /> */}

        {/* Downtime Charts */}
        {/* <DowntimeCharts filters={filters} /> */}

        {/* PLC Machine Data */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">
              PLC Machine Data (Latest per Device)
            </h2>
            {isLoading && (
              <Loader2 size={16} className="animate-spin text-gray-400" />
            )}
          </div>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-32 rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-40 rounded bg-slate-100" />
                  <div className="mt-4 h-20 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : latestPerDevice.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
              No PLC data available
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                <span>Showing {Math.min((page - 1) * pageSize + 1, latestPerDevice.length)}–{Math.min(page * pageSize, latestPerDevice.length)} of {latestPerDevice.length} records</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">Page {page} / {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paginatedMachines.map((machine, index) => (
                  <PlcMachineCard
                    key={machine._id || `${machine.device_id}-${index}`}
                    machine={machine}
                    products={productsByMachine[machine.device_id] || []}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}