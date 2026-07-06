import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
} from "lucide-react";
import CheckItemHistoryModal from "./CheckItemHistory";
import { useCheckItemHistory } from "../hooks/useCheckItemHistory";
import Pagination from "../Components/Pagination/Pagination";
import NoDataFound from "../components/NoDataFound/NoDataFound";

export default function AssemblyLineStatus() {
  const [openHistory, setOpenHistory] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState(null);
  const [assemblyLine, setAssemblyLine] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("TODAY");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [showLimit, setShowLimit] = useState(10);
  const { getAssemblyCardsData, getAssemblyReportData } =
    useCheckItemHistory(page);

  const assembliesRaw = getAssemblyReportData?.data;
  const assemblies = Array.isArray(assembliesRaw)
    ? assembliesRaw
    : assembliesRaw
      ? [assembliesRaw]
      : [];

  const tableData = Array.isArray(assemblies)
    ? assemblies.map((item) => {
      // 🔹 Detect ERROR / RESOLVED
      const hasError =
        Array.isArray(item?.processes) &&
        item.processes.some(
          (proc) =>
            Array.isArray(proc?.check_list_items) &&
            proc.check_list_items.some(
              (cli) =>
                Array.isArray(cli?.check_items_history) &&
                cli.check_items_history.some(
                  (history) => history?.is_error === true
                )
            )
        );

      return {
        id: item?._id,
        assemblyNumber: item?.assembly_number || "—",
        assemblyName: item?.assembly_name || "—",
        companyName: item?.company?.company_name || "—",
        plantName: item?.plant?.plant_name || "—",
        plant_code: item?.plant?.plant_code || "—",
        raw: item,

        //  Status
        status:
          Array.isArray(item?.processes) &&
            item.processes.length > 0 &&
            item.processes.every(
              (proc) =>
                Array.isArray(proc?.check_list_items) &&
                proc.check_list_items.length > 0 &&
                proc.check_list_items.every(
                  (cli) =>
                    Array.isArray(cli?.check_items_history) &&
                    cli.check_items_history.length > 0
                )
            )
            ? "CHECKED"
            : "UN-CHECKED",

        //  Result
        result: hasError ? "ERROR" : "RESOLVED",
      };
    })
    : [];

  //  Apply Assembly + Status filters together
  const currentTableData = tableData.filter((row) => {
    // Assembly filter
    const matchAssembly =
      assemblyLine === "ALL" ||
      `${row.assemblyNumber} / ${row.assemblyName}` === assemblyLine;

    // Status filter
    const matchStatus = statusFilter === "ALL" || row.status === statusFilter;

    // Result filter
    const matchResult = resultFilter === "ALL" || row.result === resultFilter;

    return matchAssembly && matchStatus && matchResult;
  });

  const ITEMS_PER_PAGE =
    showLimit === "ALL" ? currentTableData.length : Number(showLimit);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [assemblyLine, dateFilter, statusFilter, resultFilter]);

  // Pagination check
  const hasNextPage =
    showLimit !== "ALL" && page * showLimit < currentTableData.length;

  const assemblyOptions = React.useMemo(() => {
    const uniqueMap = new Map();

    tableData.forEach((item) => {
      if (item.assemblyNumber && item.assemblyName) {
        const label = `${item.assemblyNumber} / ${item.assemblyName}`;
        uniqueMap.set(label, label);
      }
    });

    return ["ALL", ...Array.from(uniqueMap.values())];
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [tableData]);

  const paginatedTableData =
    showLimit === "ALL"
      ? currentTableData
      : currentTableData.slice((page - 1) * showLimit, page * showLimit);


   console.log(paginatedTableData);

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-0 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl text-black font-semibold">
              Assembly Line Status
            </h1>
            <p className="text-gray-500 text-sm">
              Real-time production line monitoring & compliance
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Assembly Line */}
            <FilterSelect
              label="Assembly Line"
              value={assemblyLine}
              onChange={setAssemblyLine}
              options={assemblyOptions}
              width="w-full sm:w-[220px]"
            />

            {/* Date */}
            {/* <FilterSelect
              label="Date"
              value={dateFilter}
              onChange={setDateFilter}
              options={["TODAY", "YESTERDAY", "THIS_WEEK", "THIS_MONTH"]}
              width="w-full sm:w-[180px]"
            /> */}

            {/* Status */}
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={["ALL", "CHECKED", "UN-CHECKED"]}
              width="w-full sm:w-[180px]"
            />

            {/* Result */}
            <FilterSelect
              label="Result"
              value={resultFilter}
              onChange={setResultFilter}
              options={["ALL", "ERROR", "RESOLVED"]}
              width="w-full sm:w-[180px]"
            />

            {/* Reset */}
            <button
              onClick={() => {
                setAssemblyLine("ALL");
                setDateFilter("TODAY");
                setStatusFilter("ALL");
                setResultFilter("ALL");
                setPage(1);
              }}
              className="h-[42px] px-5 w-full sm:w-auto cursor-pointer rounded-xl border border-slate-300 text-sm font-semibold
      text-slate-600 hover:bg-slate-100 transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Total Assemblies
                </p>
                <p className="text-3xl font-bold bg-linear-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent mt-1">
                  {getAssemblyCardsData?.data?.total_assemblies || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Item Checked
                </p>
                <p className="text-3xl font-bold bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mt-1">
                  {getAssemblyCardsData?.data?.total_checked || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Item Unchecked
                </p>
                <p className="text-3xl font-bold bg-linear-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mt-1">
                  {getAssemblyCardsData?.data?.total_unchecked}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Item Errors
                </p>
                <p className="text-3xl font-bold bg-linear-to-r from-red-600 to-red-700 bg-clip-text text-transparent mt-1">
                  {getAssemblyCardsData?.data?.total_errors || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          {/* Table Header */}
          <div className="px-4 py-3 flex justify-between sm:px-6 sm:py-4 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Assembly Line Overview
              </h3>
              <p className="text-sm text-slate-500">
                Assembly, company, plant & current inspection status
              </p>
            </div>

            <div className="flex items-center gap-4 text-gray-600">
              <span>Show:</span>
              <select
                value={showLimit}
                onChange={(e) => {
                  const value = e.target.value;
                  setShowLimit(value === "ALL" ? "ALL" : Number(value));
                  setPage(1);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-0"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value="ALL">All</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-100/80 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                    Assembly
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                    Company
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide hidden md:table-cell">
                    Plant
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTableData?.length === 0 ? (
                  <NoDataFound
                    title="0 Assembly Lines Found"
                    subtitle="No assembly line data available."
                    colSpan={7}
                  />
                ) : (
                  paginatedTableData?.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-blue-50/50 transition duration-200 group"
                    >
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {row.assemblyNumber} / {row.assemblyName}
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="text-slate-900">{row?.companyName}</div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 hidden md:table-cell">
                        <div className="text-slate-900">
                          {row?.plantName} ({row?.plant_code})
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm ${
                            row.status === "CHECKED"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                          }`}
                        >
                          {row.status === "CHECKED" ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <AlertCircle size={14} />
                          )}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <button
                          onClick={() => {
                            setSelectedAssembly(row.raw);
                            setOpenHistory(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 cursor-pointer rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <History size={14} />
                          History
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {tableData.length > 0 && showLimit !== "ALL" && (
          <Pagination page={page} setPage={setPage} hasNextpage={hasNextPage} />
        )}
      </div>
      <CheckItemHistoryModal
        open={openHistory}
        onClose={() => setOpenHistory(false)}
        data={selectedAssembly}
      />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, width }) {
  return (
    <div className={`flex flex-col gap-1 ${width}`}>
      <label className="text-xs font-medium text-slate-500">{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e?.target?.value)}
        className="h-[42px] px-4 rounded-xl border border-slate-300 bg-white
        text-sm font-medium text-slate-800
        focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
      >
        {options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt?.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
