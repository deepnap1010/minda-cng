import React, { useState } from "react";
import {
  Layers,
  CheckCircle,
  Clock,
  AlertTriangle,
  Factory,
  Package,
  XCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  useMonthlyInspectionTrend,
  useAssemblyStatus,
  useInspectionOverview,
} from "../hooks/useDashboard";
import { useCheckItemHistory } from "../hooks/useCheckItemHistory";
import { useLogin } from "../hooks/useLogin";
import {
  useProductionLogs,
  useProductionLogsSummary,
} from "../hooks/useProductionLogs";

const COLORS = ["#60a5fa", "#93c5fd", "#ef4444"];

export default function UserDashboard() {
  const { logedinUser } = useLogin();
  const user = logedinUser?.data;
  const permissions = user?.userRole?.permissions || [];
  const [logsPage, setLogsPage] = useState(1);
  const [logsStatusFilter, setLogsStatusFilter] = useState("All");
  const logsLimit = 10;

  const assemblyPaths = [
    "/assembly-line",
    "/assigned-assembly-lines",
    "/assembly-line-status",
    "/assembly-line-admin/error",
    "/assembly-line/error",
  ];

  const canSeeAssembly = permissions.some((p) => assemblyPaths.includes(p));
  const hasEmployeeId = Boolean(user?.user_id);

  const { data: logsSummary, isLoading: summaryLoading } =
    useProductionLogsSummary(hasEmployeeId);
  const { data: logsResult, isLoading: logsLoading } = useProductionLogs(
    logsPage,
    logsLimit,
    hasEmployeeId,
    logsStatusFilter === "All" ? "" : logsStatusFilter.toUpperCase()
  );

  const productionLogs = logsResult?.data || [];
  const logsTotalPages = logsResult?.totalPages || 0;

  const { data: monthlyTrendData = [], isLoading: trendLoading } =
    useMonthlyInspectionTrend();
  const { data: inspectionOverview } = useInspectionOverview();
  const inspectionStatus = useAssemblyStatus();
  const inspectionData = inspectionStatus?.data || [];
  const { getAssemblyCardsData } = useCheckItemHistory();
  const statusSummary = getAssemblyCardsData?.data || {};

  const openErrors =
    inspectionOverview?.summary?.stillErrorAssemblies ||
    statusSummary.total_errors ||
    0;

  const productionStats = [
    {
      title: "Total Records",
      value: logsSummary?.total_records ?? 0,
      icon: Factory,
      bg: "bg-indigo-50",
      color: "text-indigo-600",
    },
    {
      title: "Total Qty",
      value: logsSummary?.total_qty ?? 0,
      icon: Package,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      title: "Pass",
      value: logsSummary?.pass_count ?? 0,
      icon: CheckCircle,
      bg: "bg-green-50",
      color: "text-green-600",
    },
    {
      title: "Fail",
      value: logsSummary?.fail_count ?? 0,
      icon: XCircle,
      bg: "bg-red-50",
      color: "text-red-600",
    },
  ];

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentMonthIndex = new Date().getMonth();

  const safeMonthlyData =
    Array.isArray(monthlyTrendData) && monthlyTrendData.length > 0
      ? monthlyTrendData
      : MONTHS.map((month) => ({
          month,
          checked: 0,
          unchecked: 0,
          error: 0,
        }));

  const trendData = safeMonthlyData.map((m, index) => {
    const isCurrentMonth = index === currentMonthIndex;
    return {
      month: m.month || "",
      checked:
        isCurrentMonth && statusSummary?.total_checked !== undefined
          ? statusSummary.total_checked
          : m.checked || 0,
      error:
        isCurrentMonth && statusSummary?.total_errors !== undefined
          ? statusSummary.total_errors
          : m.error || 0,
    };
  });

  const statusData = [
    { name: "Checked", value: statusSummary.total_checked || 0 },
    { name: "Unchecked", value: statusSummary.total_unchecked || 0 },
    { name: "Errors", value: statusSummary.total_errors || 0 },
  ];

  const recentAssemblies = (inspectionData || []).map((a) => {
    const checked = a.checked;
    const status = checked ? "Checked" : "Unchecked";
    return {
      assembly_number: a.assembly_number || "-",
      assembly_name: a.assembly_name || "-",
      method: a.part?.part_name || "N/A",
      time: new Date(
        a.updatedAt || a.createdAt || new Date()
      ).toLocaleTimeString(),
      status,
    };
  });

  const assemblyStats = [
    {
      title: "My Assemblies",
      value: statusSummary?.total_assemblies ?? 0,
      icon: Layers,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      title: "Checked Today",
      value: statusSummary.total_checked ?? 0,
      icon: CheckCircle,
      bg: "bg-green-50",
      color: "text-green-600",
    },
    {
      title: "Unchecked Today",
      value: statusSummary.total_unchecked ?? 0,
      icon: Clock,
      bg: "bg-yellow-50",
      color: "text-yellow-600",
    },
    {
      title: "Open Errors",
      value: openErrors,
      icon: AlertTriangle,
      bg: "bg-red-50",
      color: "text-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">User Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome, {user?.full_name || "User"}
          {user?.user_id ? ` (${user.user_id})` : ""}
        </p>
      </div>

      {/* Production logs from SQL — always visible */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Production Logs</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {productionStats.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <h2 className="text-2xl font-semibold mt-1">
                  {summaryLoading ? "..." : item.value}
                </h2>
              </div>
              <div className={`p-3 rounded-xl ${item.bg}`}>
                <item.icon className={item.color} size={24} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold">Recent Production Logs</h3>
              <p className="text-xs text-gray-500">
                Filter by status and browse paginated results.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['All', 'Pass', 'Fail'].map((option) => {
                const active = logsStatusFilter === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setLogsStatusFilter(option);
                      setLogsPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {logsTotalPages > 1 && (
            <div className="mb-4 flex items-center justify-end gap-2 text-sm">
              <button
                type="button"
                disabled={logsPage <= 1}
                onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-gray-500">{logsPage} / {logsTotalPages}</span>
              <button
                type="button"
                disabled={logsPage >= logsTotalPages}
                onClick={() =>
                  setLogsPage((p) => Math.min(logsTotalPages, p + 1))
                }
                className="px-2 py-1 rounded border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

          {logsLoading ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading...</p>
          ) : productionLogs.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No production logs for employee ID &quot;{user?.user_id || "—"}
              &quot;. SQL data uses user_id &quot;priya001&quot; — set the same
              value on this user profile to see records.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-300">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Part No</th>
                    <th className="py-3 px-3">Qty</th>
                    <th className="py-3 px-3">Machine</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {productionLogs.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-200 last:border-none hover:bg-gray-50"
                    >
                      <td className="py-3 px-3">
                        {row.date_time
                          ? new Date(row.date_time).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-3 px-3">{row.product_name || "—"}</td>
                      <td className="py-3 px-3">{row.part_no || "—"}</td>
                      <td className="py-3 px-3">{row.qty ?? "—"}</td>
                      <td className="py-3 px-3">{row.machine || "—"}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (row.status || "").toUpperCase() === "PASS"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {row.status || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">
                        {row.barcode || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {!canSeeAssembly ? (
        <p className="text-sm text-gray-500">
          Assembly dashboard sections are hidden — no assembly permissions on
          this role.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {assemblyStats.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <h2 className="text-2xl font-semibold mt-1">{item.value}</h2>
                </div>
                <div className={`p-3 rounded-xl ${item.bg}`}>
                  <item.icon className={item.color} size={24} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800">
                  Assembly Performance Trend
                </h3>
                <span className="text-xs text-gray-500">
                  Monthly (My Assemblies)
                </span>
              </div>

              {trendLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-sm text-gray-500">Loading chart data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient
                        id="checkedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop
                          offset="100%"
                          stopColor="#22c55e"
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
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
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
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Legend verticalAlign="top" height={30} />
                    <Area
                      type="monotone"
                      dataKey="checked"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      fill="url(#checkedGradient)"
                      name="Checked Assemblies"
                    />
                    <Area
                      type="monotone"
                      dataKey="error"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      fill="url(#errorGradient)"
                      name="Error Assemblies"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
              <h3 className="text-base font-semibold mb-4">Status Summary</h3>
              <PieChart width={240} height={240}>
                <Pie
                  data={statusData}
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Assembly Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-300">
                    <th className="py-3 px-3">Assembly No</th>
                    <th className="py-3 px-3">Assembly Name</th>
                    <th className="py-3 px-3">Check Method</th>
                    <th className="py-3 px-3">Check Time</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssemblies.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 last:border-none hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-3 font-medium">
                        {item.assembly_number}
                      </td>
                      <td className="py-3 px-3">{item.assembly_name}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                          {item.method}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{item.time}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.status === "Checked"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
