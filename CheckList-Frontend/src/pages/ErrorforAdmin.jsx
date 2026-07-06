/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from "react";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Pencil,
  X,
  OctagonAlert,
  XCircle,
} from "lucide-react";
import { useAssemblyLineError } from "../hooks/useAssemblyLineError";
import AddErrorModal from "../components/modal/addModal/AddErrorModal";
import Refresh from "../components/Refresh/Refresh";
import NoDataFound from "../components/NoDataFound/NoDataFound";

export default function AssemblyError() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [showRefresh, setShowRefresh] = useState(false);
  const { getAssemblyLineError } = useAssemblyLineError();

  const errorsRaw = getAssemblyLineError?.data;
  const errors = useMemo(() => {
    if (!errorsRaw) return [];
    return Array.isArray(errorsRaw) ? errorsRaw : [errorsRaw];
  }, [errorsRaw]);

  const handleUpdateClick = (error) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    const day = d.toLocaleString("en-GB", { day: "2-digit" });
    const mon = d.toLocaleString("en-GB", { month: "short" });
    const yr = d.getFullYear();
    return `${day}-${mon}-${yr}`;
  };

  const handleRefresh = async () => {
    setShowRefresh(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.all([getAssemblyLineError.refetch(), minDelay]);
    setShowRefresh(false); // Hide overlay
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl ">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 ">
            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
              <OctagonAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                Assembly Errors
              </h1>
              <p className="text-sm text-slate-500">
                Review and resolve inspection issues
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Total Errors
                </p>
                <p className="text-3xl font-bold bg-linear-to-r from-red-600 to-red-700 bg-clip-text text-transparent mt-1">
                  {errors.filter((e) => e?.is_error).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-600">Total Records</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {errors.length}
            </p>
          </div> */}
        </div>

        <div className="bg-white border relative min-h-[300px] h-full border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 flex flex-row justify-between w-full items-center gap-4">
            <div className="flex flex-col ">
              <h3 className="text-lg font-semibold text-slate-900">
                Error History
              </h3>
              <p className="text-sm text-slate-500">
                Inspection items with error status and audit info
              </p>
            </div>
            <div className="p-2 hover:bg-gray-200 rounded-full"
              onClick={handleRefresh}
            >
              <RefreshCw size={20} className="text-gray-600" />
            </div>
          </div>

          {showRefresh ? (
            <Refresh />
          ) : (
            <div className="sm:hidden p-4 space-y-4">
              {errors.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No error records found
                </div>
              )}
              {errors.map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.checklistItem?.item}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDateShort(item.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_error
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                        }`}
                    >
                      {item.is_error ? "Error" : "Resolved"}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Assembly:</span>
                      <span className="font-medium">
                        {item?.assemblyLine?.assembly_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Process:</span>
                      <span className="font-medium">
                        {item?.processInfo?.process_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Result:</span>
                      <span className="font-medium">{item.result}</span>
                    </div>
                  </div>
                  {/* <button
                  onClick={() => handleUpdateClick(item)}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Pencil size={16} />
                  Update Result
                </button> */}
                </div>
              ))}
            </div>
          )}

          {showRefresh ? (
            <Refresh />
          ) : (
            <div className="overflow-x-auto m-2 hidden border border-gray-100 rounded-xl sm:block">
              <table className="min-w-full text-sm whitespace-nowrap">
                <thead className="bg-slate-100/80 sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Severity
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Item
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Method
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Time
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Assembly
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Process
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Result
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Description
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Created
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left font-semibold text-slate-700 tracking-wide">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {errors?.length === 0 ? (
                    <NoDataFound
                      title="0 Plants Found"
                      subtitle="No plants available at the moment."
                      colSpan={11}
                    />
                  ) : (
                    errors.map((row) => (
                      <tr
                        key={row?._id}
                        className={`transition duration-200 group ${row?.is_error
                          ? "bg-red-50/40 hover:bg-red-50/70"
                          : "bg-emerald-50/40 hover:bg-emerald-50/70"
                          }`}
                      >
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold shadow-sm ${row?.is_error
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              }`}
                          >
                            {row?.is_error ? (
                              <AlertCircle size={13} />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            {row?.is_error ? "Error" : "OK"}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <div className="font-semibold text-slate-900">
                            {row?.checklistItem?.item || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          {row?.checklistItem?.check_list_method || "—"}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          {row?.checklistItem?.check_list_time || "—"}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          {(row?.assemblyLine?.assembly_name || "—") +
                            " / " +
                            (row?.assemblyLine?.assembly_number || "—")}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          {(row?.processInfo?.process_name || "—") +
                            " / " +
                            (row?.processInfo?.process_no || "—")}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          {row?.result || "—"}
                        </td>
                        <td
                          className={`px-4 py-3 sm:px-6 sm:py-4 ${row?.is_error ? "text-red-700" : "text-slate-600"
                            }`}
                        >
                          <div
                            className="max-w-[250px] truncate"
                            title={row?.description}
                          >
                            {row?.description || "—"}
                          </div>
                        </td>

                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold ${row?.status === "Checked"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                              }`}
                          >
                            {row?.status ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <AlertCircle size={13} />
                            )}
                            {row?.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          {formatDateShort(row?.createdAt)}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          {formatDateShort(row?.updatedAt)}
                        </td>
                      </tr>
                    ))
                  )}
                  {errors.length === 0 && (
                    <tr>
                      <td
                        colSpan={12}
                        className="text-center py-16 text-slate-500"
                      >
                        No error records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddErrorModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedError}
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-slate-600 text-right">{value || "—"}</span>
    </div>
  );
}
