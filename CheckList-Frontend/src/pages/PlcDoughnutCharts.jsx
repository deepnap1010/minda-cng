import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import {
  usePlcDowntimeByError,
  usePlcDowntimeByErrorStatus,
  usePlcDowntimeByMachine,
} from "../hooks/usePlcData";

// ── Professional color palette ──
const COLORS = [
  "#1f77b4", // standard dashboard blue
  "#17becf", // teal / cyan accent
  "#6baed6", // soft blue
  "#9ecae1", // light blue
  "#4b5563", // cool gray-700
  "#9ca3af", // gray-400
  "#d1d5db", // gray-300
  "#374151", // gray-800
  // "#0f4c81", // deep industrial blue (primary)
];

// ── Double Doughnut Chart (by Case/Error) ──
function DowntimeByCase({ data, title = "Downtime Distribution by Case" }) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 1. Sort data by value descending
    const sorted = [...data].sort(
      (a, b) => Number(b?.value || 0) - Number(a?.value || 0),
    );

    // 2. If there are more than 8 categories, group the rest into "Others"
    const threshold = 8;
    if (sorted.length > threshold) {
      const topItems = sorted.slice(0, threshold - 1);
      const remainingItems = sorted.slice(threshold - 1);

      const othersValue = remainingItems.reduce(
        (acc, curr) => acc + Number(curr?.value || 0),
        0,
      );

      // Combine top models for "Others" category tooltip
      const othersTopModels = remainingItems
        .flatMap((item) => item.top_models || [])
        .slice(0, 5);

      return [
        ...topItems,
        {
          name: "Others",
          value: othersValue,
          top_models: othersTopModels,
          isOthers: true,
        },
      ];
    }

    return sorted;
  }, [data]);

  const hasData = processedData.length > 0;
  const totalErrors = useMemo(
    () =>
      data ? data.reduce((acc, curr) => acc + Number(curr?.value || 0), 0) : 0,
    [data],
  );

  return (
    <div
      className="relative bg-white/90 backdrop-blur rounded-2xl 
border border-slate-200/60 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] 
p-6 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-700 tracking-wide">
          {title}
        </h3>
        {hasData && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            LIVE
          </span>
        )}
      </div>

      <div className="h-[360px] md:h-[360px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="85%"
                paddingAngle={processedData.length > 1 ? 4 : 0}
                stroke="none"
                label={({ percent, name }) =>
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {processedData.map((entry, index) => (
                  <Cell
                    key={`cell-outer-${index}`}
                    fill={
                      entry.isOthers ? "#94a3b8" : COLORS[index % COLORS.length]
                    }
                    className="transition-all duration-300 hover:opacity-80 outline-none"
                  />
                ))}

                <Label
                  content={({ viewBox: { cx, cy } }) => (
                    <g>
                      <text
                        x={cx}
                        y={cy - 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: "11px",
                          letterSpacing: "0.08em",
                          fill: "#64748B",
                          fontWeight: 700,
                        }}
                      >
                        TOTAL ERRORS
                      </text>
                      <text
                        x={cx}
                        y={cy + 20}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: "32px",
                          fontWeight: 900,
                          fill: "#0F172A",
                        }}
                      >
                        {totalErrors}
                      </text>
                    </g>
                  )}
                />
              </Pie>

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const p = payload[0]?.payload || {};
                  const errCount = p?.value ?? 0;
                  const topModels = Array.isArray(p?.top_models)
                    ? p.top_models
                    : [];

                  return (
                    <div
                      style={{
                        background: "rgba(15, 23, 42, 0.95)", // slate-900
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#E5E7EB",
                        padding: "12px 16px",
                        fontSize: "13px",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        {String(p?.name || "Unknown")}
                      </div>

                      <div style={{ fontWeight: 700 }}>
                        Errors:{" "}
                        <span style={{ fontWeight: 900 }}>
                          {String(errCount)}
                        </span>
                      </div>

                      {topModels.length > 0 && (
                        <div
                          style={{ marginTop: 10, fontSize: 12, opacity: 0.96 }}
                        >
                          Top models:
                          <div
                            style={{
                              marginTop: 6,
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                            }}
                          >
                            {topModels.map((tm) => (
                              <div
                                key={`${tm?.model || "Unknown"}-${tm?.count || 0}`}
                              >
                                {tm?.model || "Unknown"}: {tm?.count || 0}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 font-medium">
              No error status errors found
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        {hasData ? (
          processedData.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: item.isOthers
                      ? "#94a3b8"
                      : COLORS[index % COLORS.length],
                  }}
                />
                <span className="text-xs font-medium text-slate-600 truncate max-w-[180px]">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {item.value}
                </span>
                <span className="text-[10px] text-slate-400 font-medium w-8 text-right">
                  {totalErrors > 0
                    ? `${((item.value / totalErrors) * 100).toFixed(0)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-slate-400 italic">
            Waiting for error data...
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper to format hours into "Xh Ym" ──
const formatDuration = (totalMinutes) => {
  if (!totalMinutes) return "0h 0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h ${minutes}m`;
};

// ── Half Doughnut (Semi-circle) ──
function DowntimeByMachine({ data }) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 1. Sort data by value descending
    const sorted = [...data].sort(
      (a, b) => Number(b?.value || 0) - Number(a?.value || 0),
    );

    // 2. If there are more than 8 machines, group the rest into "Others"
    const threshold = 8;
    if (sorted.length > threshold) {
      const topItems = sorted.slice(0, threshold - 1);
      const remainingItems = sorted.slice(threshold - 1);

      const othersValue = remainingItems.reduce(
        (acc, curr) => acc + Number(curr?.value || 0),
        0,
      );

      return [
        ...topItems,
        {
          name: "Others",
          value: othersValue,
          isOthers: true,
        },
      ];
    }

    return sorted;
  }, [data]);

  const hasData = processedData.length > 0;
  const totalDowntime = useMemo(
    () =>
      data ? data.reduce((acc, curr) => acc + Number(curr?.value || 0), 0) : 0,
    [data],
  );

  return (
    <div
      className="relative bg-white/90 backdrop-blur rounded-2xl 
border border-slate-200/60 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] 
p-6 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-700 tracking-wide">
          Downtime Distribution by Machine
        </h3>
        {hasData && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            LIVE
          </span>
        )}
      </div>

      <div className="h-[360px] md:h-[360px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="85%"
                innerRadius="65%"
                outerRadius="95%"
                startAngle={180}
                endAngle={0}
                paddingAngle={processedData.length > 1 ? 4 : 0}
                stroke="none"
                label={({ percent }) =>
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {processedData.map((entry, index) => (
                  <Cell
                    key={`cell-machine-${index}`}
                    fill={
                      entry.isOthers ? "#94a3b8" : COLORS[index % COLORS.length]
                    }
                    className="transition-all duration-300 hover:opacity-80 outline-none"
                  />
                ))}

                <Label
                  content={({ viewBox: { cx, cy } }) => (
                    <g>
                      <text
                        x={cx}
                        y={cy + 50}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: "11px",
                          letterSpacing: "0.08em",
                          fill: "#64748B",
                          fontWeight: 700,
                        }}
                      >
                        TOTAL DOWNTIME
                      </text>
                      <text
                        x={cx}
                        y={cy + 80}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: "24px",
                          fontWeight: 900,
                          fill: "#0F172A",
                        }}
                      >
                        {formatDuration(totalDowntime)}
                      </text>
                    </g>
                  )}
                />
              </Pie>

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const p = payload[0]?.payload || {};

                  return (
                    <div
                      style={{
                        background: "rgba(15, 23, 42, 0.95)", // slate-900
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#E5E7EB",
                        padding: "12px 16px",
                        fontSize: "13px",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        {String(p?.name || "Unknown Machine")}
                      </div>
                      <div style={{ fontWeight: 700 }}>
                        Downtime:{" "}
                        <span style={{ fontWeight: 900 }}>
                          {formatDuration(p?.value ?? 0)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 font-medium italic">
              No machine downtime found
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        {hasData ? (
          processedData.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: item.isOthers
                      ? "#94a3b8"
                      : COLORS[index % COLORS.length],
                  }}
                />
                <span className="text-xs font-medium text-slate-600 truncate max-w-[180px]">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {formatDuration(item.value)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium w-8 text-right">
                  {totalDowntime > 0
                    ? `${((item.value / totalDowntime) * 100).toFixed(0)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-slate-400 italic">
            Waiting for machine data...
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Export Component ──
export default function DowntimeCharts({ filters = {} }) {
  const getPlcDowntimeByError = usePlcDowntimeByError(filters, { live: true });
  const getPlcDowntimeByErrorStatus = usePlcDowntimeByErrorStatus(filters, {
    live: true,
  });
  const getPlcDowntimeByMachine = usePlcDowntimeByMachine(filters, {
    live: true,
  });

  const errorDowntimeData = useMemo(() => {
    return (getPlcDowntimeByError.data || []).map((item) => ({
      name: item.error_name,
      value: item.total_downtime,
    }));
  }, [getPlcDowntimeByError.data]);

  const errorStatusDowntimeData = useMemo(() => {
    return (getPlcDowntimeByErrorStatus.data || []).map((item) => ({
      name: item.error_status,
      value: item.total_errors ?? item.total_downtime ?? 0,
      top_models: item.top_models || [],
    }));
  }, [getPlcDowntimeByErrorStatus.data]);

  const machineDowntimeData = getPlcDowntimeByMachine.data || [];

  return (
    <div className=" bg-slate-50/70 mt-5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
            Downtime Analysis Overview
          </h2>
          {/* <div className="text-sm text-slate-600 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
            Last 30 days • Static demo
          </div> */}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
          <DowntimeByCase
            data={errorStatusDowntimeData}
            title="Error Distribution by Error Status"
          />

          <DowntimeByMachine data={machineDowntimeData} />
        </div>
      </div>
    </div>
  );
}
