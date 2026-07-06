import { useAssignedAssemblyLines } from "../hooks/useAssignedAssemblyLines";
import { useState } from "react";
import { Eye, CheckCircle2, AlertCircle, X } from "lucide-react";
import Pagination from "../Components/Pagination/Pagination";
import AssemblyLineCards from "../components/AssemblyLineCard/AssemblyLineCards";

const AssignedAssemblyLines = () => {
  const [page, setPage] = useState(1);
  const [showLimit, setShowLimit] = useState(10);

  // 🔹 Modal state
  const [openView, setOpenView] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState(null);

  const { getAssignedAssemblyLines } = useAssignedAssemblyLines();
  const { data: assemblyLines = [], isLoading } = getAssignedAssemblyLines;

  if (isLoading) return <div className="p-6">Loading...</div>;

  /* 🔹 Table Mapping */
  const tableData = Array.isArray(assemblyLines)
    ? assemblyLines.map((item) => {
        const allCheckHistories =
          item.processes?.flatMap(
            (process) =>
              process.check_list_items?.flatMap(
                (checkItem) => checkItem.check_items_history || []
              ) || []
          ) || [];

        const isChecked = allCheckHistories.find(
          (history) => history.status === "Checked"
        );

        return {
          id: item?._id,
          assemblyNumber: item?.assembly_number || "—",
          assemblyName: item?.assembly_name || "—",
          companyName: item?.company?.company_name || "—",
          plantName: item?.plant?.plant_name || "—",
          status: isChecked ? "CHECKED" : "UN-CHECKED",
          raw: item,
        };
      })
    : [];

  /* 🔹 Pagination */
  const ITEMS_PER_PAGE =
    showLimit === "ALL" ? tableData.length : Number(showLimit);

  const paginatedTableData =
    showLimit === "ALL"
      ? tableData
      : tableData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const hasNextPage =
    showLimit !== "ALL" && page * ITEMS_PER_PAGE < tableData.length;

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Assigned Assembly Lines
          </h1>
          <p className="text-slate-500 text-sm">
            View your assigned assembly lines
          </p>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          {/* Table Header */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 flex justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Assembly Overview
              </h3>
              <p className="text-sm text-slate-500">
                Assembly, company & current status
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span>Show:</span>
              <select
                value={showLimit}
                onChange={(e) => {
                  const value = e.target.value;
                  setShowLimit(value === "ALL" ? "ALL" : Number(value));
                  setPage(1);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value="ALL">All</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Assembly
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 hidden md:table-cell">
                    Plant
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedTableData.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {row.assemblyNumber} / {row.assemblyName}
                    </td>

                    <td className="px-6 py-4">{row.companyName}</td>

                    <td className="px-6 py-4 hidden md:table-cell">
                      {row.plantName}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
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

                    {/* 🔹 View Button */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedAssembly(row.raw);
                          setOpenView(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold
                          text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}

                {tableData.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-14 text-slate-500"
                    >
                      No assigned assembly lines found
                    </td>
                  </tr>
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

      {/* 🔹 VIEW MODAL */}
      {openView && selectedAssembly && (
        <div className="fixed inset-0 z-[90]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpenView(false)}
          />

          {/* Modal Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl overflow-y-auto">
            {/* Body */}
            <div className="p-6">
              <AssemblyLineCards AssemblyLines={[selectedAssembly]} setOpenView={setOpenView}  />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedAssemblyLines;
