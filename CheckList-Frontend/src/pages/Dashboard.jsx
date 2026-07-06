import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock3,
  Users,
  Activity,
  Sparkles,
} from "lucide-react";
import {
  useDashboardCards,
  useMonthlyInspectionTrend,
  useAssemblyStatus,
  useAssemblyMonthly,
  useInspectionOverview,
} from "../hooks/useDashboard";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import { useCheckItemHistory } from "../hooks/useCheckItemHistory";
import { useCompanies } from "../hooks/useCompanies";
import { usePlantsByCompany } from "../hooks/UsePlantName";

/* ---------------- Mock / Static Data ---------------- */

const DONUT_DATA = [
  { label: "Checked", value: 120, color: "#22c55e" },
  { label: "Unchecked", value: 40, color: "#eab308" },
];

const ASSEMBLY_BAR = [
  { label: "500", running: 18, fault: 6 },
  { label: "1000A", running: 24, fault: 9 },
  { label: "1000B", running: 20, fault: 12 },
  { label: "2000", running: 26, fault: 4 },
  { label: "5000", running: 14, fault: 10 },
];

/* ---------------- Helpers ---------------- */

function getMinMax(arr, key) {
  const vals = arr?.map((r) => r[key]);
  return [Math.min(...vals), Math.max(...vals)];
}

// eslint-disable-next-line no-unused-vars
function toPolylinePoints(data, key, width = 700, height = 150, pad = 24) {
  const count = data?.length;
  const stepX = (width - pad * 2) / Math.max(1, count - 1);
  const [min, max] = getMinMax(data, key);
  const range = Math.max(1, max - min);
  return data
    .map((d, i) => {
      const x = pad + i * stepX;
      const y = pad + (height - pad * 2) * (1 - (d[key] - min) / range);
      return x + "," + y;
    })
    .join(" ");
}

function polarToCartesian(cx, cy, r, angleInRad) {
  return {
    x: cx + r * Math.cos(angleInRad),
    y: cy + r * Math.sin(angleInRad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
  return (
    "M " +
    cx +
    " " +
    cy +
    " L " +
    start.x +
    " " +
    start.y +
    " A " +
    r +
    " " +
    r +
    " 0 " +
    largeArcFlag +
    " 0 " +
    end.x +
    " " +
    end.y +
    " Z"
  );
}

/* ---------------- Small UI Pieces ---------------- */

function KPIBadge({ delta }) {
  const isUp = delta >= 0;
  return (
    <div
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " +
        (isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600")
      }
    >
      <span>{Math.abs(delta)} vs last period</span>
    </div>
  );
}

function StatCard({ title, value, delta, icon, loading }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {loading ? "..." : value}
          </p>
        </div>
        <div className="inline-flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 p-2">
          {icon}
        </div>
      </div>
      <KPIBadge delta={delta} />
    </div>
  );
}

function StatusPill({ status }) {
  const base =
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium";

  const value = status?.toUpperCase();

  if (value === "CHECKED")
    return (
      <span
        className={base + " bg-green-50 border border-green-300 text-green-700"}
      >
        Checked
      </span>
    );

  if (value === "UN-CHECKED" || value === "UNCHECKED")
    return <span className={base + " bg-red-50 text-red-700"}>Unchecked</span>;

  if (value === "IN PROGRESS" || value === "PENDING")
    return (
      <span className={base + " bg-sky-50 text-sky-700"}>In Progress</span>
    );

  return (
    <span className={base + " bg-slate-100 text-slate-700"}>{status}</span>
  );
}

function IssuePill({ status }) {
  const base =
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium";

  const value = status?.toUpperCase();

  if (value === "NO-ISSUE" || value === "NO ISSUE" || value === "OK")
    return (
      <span
        className={
          base + " bg-emerald-50 border border-green-300 text-emerald-700"
        }
      >
        No Issue
      </span>
    );

  return (
    <span className={base + " bg-rose-50 border border-red-300 text-rose-700"}>
      Issue
    </span>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </span>
  );
}

function StatusSummaryCard({
  label,
  colorFrom,
  colorTo,
  dotColor,
  count,
  percentage,
}) {
  return (
    <div
      className={
        "flex flex-col justify-between rounded-xl border border-white/70 bg-gradient-to-br " +
        colorFrom +
        " " +
        colorTo +
        " p-3 shadow-sm"
      }
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={"h-3 w-3 rounded-full " + dotColor} />
        <span className="text-xs font-semibold text-slate-900">{label}</span>
      </div>
      <div className="mb-2 text-xl font-bold text-slate-950">{count}</div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/80">
        <div
          className="h-1.5 rounded-full bg-slate-900/70"
          style={{ width: `${Math.max(4, percentage)}%` }}
        />
      </div>
    </div>
  );
}

function MiniKPI({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] text-slate-600">{label}</span>
      </div>
      <span className="text-[11px] font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-100 text-[9px] text-emerald-700">
      ✓
    </span>
  );
}

function InsightItem({ title, value, detail }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-medium text-slate-500">{title}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="whitespace-nowrap px-3 py-2 align-top text-[11px] text-slate-700">
      {children}
    </td>
  );
}

function MiniBar({ label, value, max }) {
  const width = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-400">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-1.5 rounded-full bg-rose-400"
          style={{ width: width + "%" }}
        />
      </div>
    </div>
  );
}

/* MultiSelect (chips + dropdown) */

function MultiSelect({
  label,
  options = [],
  value = null, // single value object
  onChange,
  placeholder,
  isOpen,
  onToggle,
  onClose,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const selectOption = (opt) => {
    onChange(opt);
    onClose();
  };

  return (
    <div className="relative min-w-[180px]" ref={ref}>
      <label className="mb-1 block text-[11px] font-medium text-slate-500">
        {label}
      </label>

      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px]"
      >
        <span className={value ? "text-slate-700" : "text-slate-400"}>
          {value ? value.label : placeholder || "Select " + label}
        </span>
        <span className="ml-2 text-slate-400 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-2xl">
          <div className="max-h-48 overflow-auto text-[11px]">
            {options.map((opt) => {
              const selected = value?.value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => selectOption(opt)}
                  className={
                    "flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-slate-50 " +
                    (selected ? "bg-slate-50 font-medium" : "")
                  }
                >
                  <span className="w-3">{selected ? "✔" : ""}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Main Dashboard ---------------- */

export default function ChecklistDashboard() {
  const [companyId, setCompanyId] = useState();
  const { listQuery } = useCompanies();
  const query = usePlantsByCompany(companyId);

  // eslint-disable-next-line no-unused-vars
  const [lineHover, setLineHover] = useState({
    x: null,
    y: null,
    text: null,
  });

  const [filters, setFilters] = useState({
    company: null,
    plant: null,
    inspectionStatus: null,
    issueStatus: null,
    dateRange: "",
    startDate: "",
    endDate: "",
  });

  const [openSelect, setOpenSelect] = useState(null);

  const handleFilterChange = (key, selected) => {
    setFilters((prev) => ({
      ...prev,
      [key]: selected,
    }));

    if (key === "company") {
      const companyIds = selected.map((c) => c.value);
      setCompanyId(companyIds[0]);
    }
  };

  // Derive selected company / plant IDs for cards API
  const selectedCompanyId = filters.company?.value || null;
  const selectedPlantId = filters.plant?.value || null;

  // Only send start/end dates when user selects Custom range and both dates are filled
  const startDateForApi = filters.startDate?.trim() || undefined;
  const endDateForApi = filters.endDate?.trim() || undefined;

  const {
    data: cardData,
    isLoading: cardsLoading,
    isError: cardsError,
  } = useDashboardCards({
    startDate: startDateForApi,
    endDate: endDateForApi,
    company: selectedCompanyId,
    plant: selectedPlantId
  });

  const { data: monthlyTrendData = [], isLoading: monthlyTrendLoading } =
    useMonthlyInspectionTrend();

  const Inspection = useAssemblyStatus();

  // Assembly Performance (date‑aware)
  const Assembly = useAssemblyMonthly({
    startDate: startDateForApi,
    endDate: endDateForApi,
  });

  const AssemblyData = Assembly?.data;

  const InspectionData = Inspection?.data;

  const tableRows = Array.isArray(InspectionData)
    ? InspectionData.map((item) => {
      const inspectionStatus = item.checked
        ? "CHECKED"
        : item.unchecked
          ? "UN-CHECKED"
          : "PENDING";

      const issueStatus = item.error ? "ERROR" : "NO-ISSUE";

      const resolutionStatus = item.error ? "OPEN" : "RESOLVED";
      return { 
        id: item._id,
        date: new Date(item.createdAt).toLocaleDateString(),

        company: item.company?.company_name || "—",
        plant: item.plant?.plant_name || "—",
        plant_code: item.plant?.plant_code || "—",

        line: `${item.assembly_number} / ${item.assembly_name}`,

        process: Array.isArray(item.process_id) ? item.process_id.length : 0,

        part: item.part_id?.part_name || "—",

        checkItem: "Checklist",

        inspectionStatus,
        issueStatus,
        resolutionStatus,

        checkedBy: item.responsibleUser?.full_name || "—",
        userId: item.responsibleUser?.user_id,
        time: new Date(item.updatedAt).toLocaleTimeString(),

        remarks: item.error ? "Issue detected during inspection" : "—",
      };
    })
    : [];

  // Status summary (date‑aware)
  const { getAssemblyCardsData } = useCheckItemHistory(
    1,
    10,
    {
      startDate: startDateForApi,
      endDate: endDateForApi,
    },
    selectedCompanyId,
    selectedPlantId
  );


  const summaryCards = [
    {
      title: "Total Assemblies",
      value: cardData?.totals?.assembly ?? 0,
      delta: cardData?.month_difference?.assembly ?? 0,
      icon: <Activity className="w-4 h-4" />,
    },
    {
      title: "Total Employees",
      value: cardData?.totals?.employee ?? 0,
      delta: cardData?.month_difference?.employee ?? 0,
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: "Total Processes",
      value: cardData?.totals?.process ?? 0,
      delta: cardData?.month_difference?.process ?? 0,
      icon: <Filter className="w-4 h-4" />,
    },
    {
      title: "Total Parts",
      value: cardData?.totals?.parts ?? 0,
      delta: cardData?.month_difference?.parts ?? 0,
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  ];

  // Inspection overview (date‑aware)
  const { data } = useInspectionOverview({
    startDate: startDateForApi,
    endDate: endDateForApi,
    company: selectedCompanyId,
    plant: selectedPlantId
  });

  const openErrors = data?.summary?.stillErrorAssemblies || 0;
  const resolvedErrors = data?.summary?.resolvedAssemblies || 0;
  const totalErrors = openErrors + resolvedErrors;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sticky Header + Filters */}
      <div className="border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 space-y-4">
          <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                CheckList Management
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm">
                Monitor assembly checks, errors & progress
              </p>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </header>

          <section className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:flex-wrap sm:items-end">
            <MultiSelect
              label="Company"
              options={listQuery?.data?.map((c) => ({
                label: c.company_name,
                value: c._id,
              }))}
              value={filters.company || null} // single selected object
              onChange={(selected) => {
                setFilters({ ...filters, company: selected });
                setCompanyId(selected?.value || null);
              }}
              placeholder="Select a company"
              isOpen={openSelect === "company"}
              onToggle={() =>
                setOpenSelect(openSelect === "company" ? null : "company")
              }
              onClose={() => openSelect === "company" && setOpenSelect(null)}
            />

            <MultiSelect
              id="plant"
              label="Plant"
              options={query?.data?.map((plant) => ({
                label: plant?.plant_name,
                value: plant?._id,
              }))}
              value={filters.plant}
              onChange={(v) => handleFilterChange("plant", v)}
              placeholder="All Plants + Multi"
              isOpen={openSelect === "plant"}
              onToggle={() =>
                setOpenSelect(openSelect === "plant" ? null : "plant")
              }
              onClose={() => openSelect === "plant" && setOpenSelect(null)}
            />
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[11px] font-medium text-slate-500">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => {
                  const value = e.target.value;
                  const today = new Date();
                  let startDate = "";
                  let endDate = "";

                  if (value === "Today") {
                    startDate = today.toISOString().split("T")[0];
                    endDate = today.toISOString().split("T")[0];
                  } else if (value === "Yesterday") {
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    startDate = yesterday.toISOString().split("T")[0];
                    endDate = yesterday.toISOString().split("T")[0];
                  } else if (value === "This Week") {
                    const firstDay = new Date(today);
                    firstDay.setDate(today.getDate() - today.getDay()); // Sunday as first day
                    const lastDay = new Date(firstDay);
                    lastDay.setDate(firstDay.getDate() + 6); // Saturday
                    startDate = firstDay.toISOString().split("T")[0];
                    endDate = lastDay.toISOString().split("T")[0];
                  } else if (value === "This Month") {
                    const firstDay = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      1
                    );
                    const lastDay = new Date(
                      today.getFullYear(),
                      today.getMonth() + 1,
                      0
                    );
                    startDate = firstDay.toISOString().split("T")[0];
                    endDate = lastDay.toISOString().split("T")[0];
                  }

                  setFilters((prev) => ({
                    ...prev,
                    dateRange: value,
                    startDate: value !== "Custom" ? startDate : "",
                    endDate: value !== "Custom" ? endDate : "",
                  }));
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="" selected>Select Date</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Custom">Custom</option>
              </select>

              {filters.dateRange === "Custom" && (
                <div className="mt-1 flex gap-2">
                  {/* Start Date */}
                  <input
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters((prev) => {
                        // If there is an existing endDate that is before new startDate,
                        // snap endDate forward to startDate to keep range valid.
                        let nextEnd = prev.endDate;
                        if (nextEnd && value && nextEnd < value) {
                          nextEnd = value;
                        }
                        return {
                          ...prev,
                          startDate: value,
                          endDate: nextEnd,
                        };
                      });
                    }}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 focus:border-slate-400 focus:outline-none"
                  />

                  {/* End Date */}
                  <input
                    type="date"
                    value={filters.endDate || ""}
                    min={filters.startDate || undefined}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 focus:border-slate-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center ml-auto">
              <button
              onClick={()=>{
                  setFilters({
                    company: null,
                    plant: null,
                    inspectionStatus: null,
                    issueStatus: null,
                    dateRange: "",
                    startDate: "",
                    endDate: "",
                  })
                  setCompanyId("")
                  
              }}
                className="px-6 py-[7px] rounded-[10px] bg-blue-500 text-white font-semibold"
              >
                Reset
              </button>
            </div>

          </section>
        </div>
      </div>

      {/* Main content */}
      <main className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 space-y-4">
        {/* {cardsError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {cardsError}
          </div>
        )} */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((c, i) => (
            <StatCard
              key={i}
              title={c.title}
              value={c.value}
              delta={c.delta}
              icon={c.icon}
              loading={cardsLoading}
            />
          ))}
        </section>

        {/* Trend + Status + Donut; Smart insights left column ke niche */}
        <section className="grid gap-4 xl:grid-cols-12">
          {/* Left column */}
          <div className="space-y-4 xl:col-span-8">
            {/* Monthly Inspection Trend */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Monthly Inspection Trend
                </h2>
                <p className="text-xs text-slate-400">
                  Checked vs Unchecked assemblies (monthly)
                </p>
              </div>

              <div className="h-64 w-full relative">
                {monthlyTrendLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                    Loading trend...
                  </div>
                ) : monthlyTrendData.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyTrendData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="checkedGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#22c55e"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="#22c55e"
                            stopOpacity={0.05}
                          />
                        </linearGradient>

                        <linearGradient
                          id="uncheckedGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#eab308"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="#eab308"
                            stopOpacity={0.05}
                          />
                        </linearGradient>

                        <linearGradient
                          id="errorGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#ef4444"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="#ef4444"
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          fontSize: 12,
                        }}
                      />

                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                      />

                      <Area
                        type="monotone"
                        dataKey="checked"
                        stroke="#22c55e"
                        strokeWidth={2.5}
                        fill="url(#checkedGradient)"
                        name="Checked"
                      />
                      <Area
                        type="monotone"
                        dataKey="unchecked"
                        stroke="#eab308"
                        strokeWidth={2.5}
                        fill="url(#uncheckedGradient)"
                        name="Unchecked"
                      />
                      <Area
                        type="monotone"
                        dataKey="error"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        fill="url(#errorGradient)"
                        name="Error"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Active Assembly Performance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Assembly Performance
                  </h3>
                  <p className="text-xs text-slate-400">
                    Running vs Fault (Monthly)
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <LegendDot color="#4f46e5" label="Running" />
                  <LegendDot color="#fb7185" label="Fault" />
                </div>
              </div>

              {/* Chart */}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={AssemblyData}
                    barSize={22}
                    radius={[8, 8, 0, 0]}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />

                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />

                    <Tooltip
                      cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                    />

                    <Bar
                      dataKey="running"
                      stackId="a"
                      fill="#4f46e5"
                      radius={[0, 0, 8, 8]}
                    />
                    <Bar
                      dataKey="fault"
                      stackId="a"
                      fill="#fb7185"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Smart Insights under performance */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col h-auto md:h-[315px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Smart Insights
                </h3>

                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  <Sparkles size={12} />
                  Coming Soon
                </span>
              </div>

              <div className="grid gap-3 text-xs grid-cols-1 sm:grid-cols-2 flex-1">
                <InsightItem
                  title="Highest error rate"
                  value="Line 1000B"
                  detail="12 faults in last 24h"
                />
                <InsightItem
                  title="Longest pending item"
                  value="Grease Weight Check"
                  detail="Pending for 3.2h on Line 2000"
                />
                <InsightItem
                  title="Top performing inspector"
                  value="Priya Sharma"
                  detail="96% on-time checks this week"
                />
                <InsightItem
                  title="Repeating defect"
                  value="SOP Violation"
                  detail="7 occurrences across 3 lines"
                />
              </div>
            </div>
          </div>

          {/* Right column */}
          <aside className="space-y-4 xl:col-span-4">
            {/* Status Summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Status Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <StatusSummaryCard
                  label="Checked"
                  colorFrom="from-emerald-100"
                  colorTo="to-emerald-200"
                  dotColor="bg-emerald-600"
                  count={getAssemblyCardsData?.data?.total_checked || 0}
                  percentage={72}
                />
                <StatusSummaryCard
                  label="Unchecked"
                  colorFrom="from-amber-100"
                  colorTo="to-amber-200"
                  dotColor="bg-amber-500"
                  count={getAssemblyCardsData?.data?.total_unchecked || 0}
                  percentage={18}
                />
                <StatusSummaryCard
                  label="Resolved"
                  colorFrom="from-sky-100"
                  colorTo="to-sky-200"
                  dotColor="bg-sky-500"
                  count={getAssemblyCardsData?.data?.total_resolved || 0}
                  percentage={65}
                />
                <StatusSummaryCard
                  label="Error"
                  colorFrom="from-rose-100"
                  colorTo="to-rose-200"
                  dotColor="bg-rose-500"
                  count={getAssemblyCardsData?.data?.total_errors || 0}
                  percentage={12}
                />
              </div>
            </div>
            {/* Inspection overview  */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-6 min-h-[420px]">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Inspection Overview
                  </h3>
                  <p className="text-xs text-slate-400">
                    Error status distribution
                  </p>
                </div>


              </div>

              {/* Donut */}
              <div className="flex justify-center">
                <div className="relative w-[160px] h-[160px]">
                  <svg viewBox="0 0 32 32" className="w-full h-full">
                    {totalErrors > 0 ? (
                      (() => {
                        let cum = 0;
                        const parts = [
                          { value: openErrors, color: "#f59e0b" },
                          { value: resolvedErrors, color: "#22c55e" },
                        ];

                        return parts.map((p, i) => {
                          const start = (cum / totalErrors) * Math.PI * 2;
                          const end =
                            ((cum + p.value) / totalErrors) * Math.PI * 2;
                          cum += p.value;

                          return (
                            <path
                              key={i}
                              d={describeArc(16, 16, 14, start, end)}
                              fill={p.color}
                            />
                          );
                        });
                      })()
                    ) : (
                      <circle cx="16" cy="16" r="14" fill="#e5e7eb" />
                    )}

                    {/* Inner cut */}
                    <circle cx="16" cy="16" r="9.8" fill="white" />

                    {/* Center text */}
                    <text
                      x="16"
                      y="14.2"
                      textAnchor="middle"
                      className="fill-slate-900 text-[6.5px] font-semibold"
                    >
                      {totalErrors}
                    </text>
                    <text
                      x="16"
                      y="18.5"
                      textAnchor="middle"
                      className="fill-slate-400 text-[2.2px]"
                    >
                      Total Errors
                    </text>
                  </svg>
                </div>
              </div>

              {/* Open / Resolved INLINE */}
              <div className="space-y-2">
                {/* Open Errors */}
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-slate-700">
                      Open Errors
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-amber-600">
                      {openErrors}
                    </div>
                    <div className="text-[10px] text-slate-400">items</div>
                  </div>
                </div>

                {/* Resolved */}
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-slate-700">
                      Resolved
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {resolvedErrors}
                    </div>
                    <div className="text-[10px] text-slate-400">items</div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 pt-3">
                <p className="mb-2 text-[11px] font-semibold text-slate-700">
                  Top Defect Lines
                </p>

                {data?.topErrorProcesses?.length ? (
                  <div className="space-y-2">
                    {data.topErrorProcesses.slice(0, 4).map((d) => (
                      <MiniBar
                        key={d.process}
                        label={d.process}
                        value={d.count}
                        max={Math.max(
                          ...data.topErrorProcesses.map((x) => x.count)
                        )}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    No defect data available
                  </p>
                )}
              </div>
            </div>
          </aside>
        </section>

        {/* Data Grid */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Inspection Data Grid
              </h3>
              <p className="text-xs text-slate-400">
                Detailed record of inspections with filters and export
              </p>
            </div>
            {/* <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by part, process, line..."
                  className="h-8 w-48 rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>
              <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                Column Filters
              </button>
              <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                Export
              </button>
            </div> */}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Company</Th>
                  <Th>Plant</Th>
                  <Th>Assembly Line</Th>

                  <Th>Inspection Status</Th>
                  <Th>Issue Status</Th>

                  <Th>Checked By</Th>
                  <Th>Time</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tableRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 cursor-pointer">
                    <Td>{r.date}</Td>
                    <Td>{r.company}</Td>
                    <Td>{r.plant} ({r?.plant_code}) </Td>
                    <Td>{r.line}</Td>

                    <Td>
                      <StatusPill status={r.inspectionStatus} />
                    </Td>
                    <Td>
                      <IssuePill status={r.issueStatus} />
                    </Td>

                    <Td>
                      {r.checkedBy} ({r?.userId})
                    </Td>
                    <Td>{r.time}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Showing 1–10 of 120 inspections</span>
            <div className="flex items-center gap-1">
              <button className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50">
                Prev
              </button>
              <button className="rounded border border-slate-200 bg-slate-900 px-2 py-1 text-white">
                1
              </button>
              <button className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50">
                2
              </button>
              <button className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50">
                Next
              </button>
            </div>
          </div> */}
        </section>

        <footer className="pt-1 pb-3 text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} Check Item Management
        </footer>
      </main>
    </div>
  );
}
