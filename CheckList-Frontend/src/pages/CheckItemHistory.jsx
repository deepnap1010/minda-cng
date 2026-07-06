import React from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

export default function CheckItemHistory({ open, onClose, data }) {


  if (!open || !data) return null;
  const process =
    Array.isArray(data?.processes) && data?.processes?.length > 0
      ? data?.processes[0]
      : null;
  const formatDT = (d) => {
    if (!d) return "—";
    const dt = new Date(d);

    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];

    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = months[dt.getMonth()];
    const yyyy = dt.getFullYear();

    let hours = dt.getHours();
    const minutes = String(dt.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;

    return `${dd}-${mm}-${yyyy}, ${hours}:${minutes}${ampm}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="bg-white h-screen w-full sm:w-[60%] xl:w-[80%] shadow-2xl animate-slideLeft flex flex-col">
        <div className="px-8 py-6 flex justify-between items-center bg-blue-500 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-100">
              {data?.assembly_name} ({data?.assembly_number})
            </h2>
            <p className="text-sm text-gray-200 mt-1">
              Process:{" "}
              <span className="font-semibold">
                {process?.process_name || "—"} ({process?.process_no || "—"})
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white hover:bg-gray-300 hover:text-black transition"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Company</p>
            <p className="font-semibold text-slate-800 text-lg">
              {data?.company?.company_name || "—"}
            </p>
            <p className="text-sm  text-slate-400 mt-1">
              {data?.company?.company_address || "—"}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Plant</p>
            <p className="font-semibold text-slate-800 text-lg">
              {data?.plant?.plant_name || "—"} ({data?.plant?.plant_code})
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {data?.plant?.plant_address || "—"}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Responsible</p>
            <p className="font-semibold text-slate-800 text-lg">
              {data?.responsibleUser?.full_name || "—"}
              <span className="ml-1 text-blue-500">
                ({data?.responsibleUser?.user_id || "—"})
              </span>
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {data?.responsibleUser?.email || "—"}
            </p>
          </div>
        </div>

        <div className="px-6 pb-8 space-y-6 overflow-y-auto">
          {Array.isArray(data?.processes) &&
            data?.processes?.map((proc) => (
              <div
                key={proc?._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {proc?.process_name || "—"} ({proc?.process_no || "—"})
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {Array.isArray(proc?.check_list_items) &&
                  proc.check_list_items.length > 0 ? (
                    proc?.check_list_items?.map((cli) => (
                      <div
                        key={cli?._id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-slate-900">
                              {cli?.item || "—"}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              Method:{" "}
                              <span className="font-medium">
                                {cli?.check_list_method || "—"}
                              </span>
                            </p>
                            <p className="text-sm text-slate-600">
                              Time:{" "}
                              <span className="font-medium">
                                {cli?.check_list_time || "—"}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-500">
                              Created:{" "}
                              <span className="font-medium">
                                {formatDT(cli?.createdAt)}
                              </span>
                            </p>
                            <p className="text-sm font-medium text-slate-500">
                              Updated:{" "}
                              <span className="font-medium">
                                {formatDT(cli?.updatedAt)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-3">
                          {Array.isArray(cli?.check_items_history) &&
                          cli?.check_items_history?.length > 0 ? (
                            cli?.check_items_history?.map((hist) => (
                              <div
                                key={hist?._id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white border border-slate-200 p-3"
                              >
                                <div className="flex-1 min-w-[220px]">
                                  <p className="text-sm text-slate-500">
                                    Result
                                  </p>
                                  <p className="text-sm font-medium text-slate-800">
                                    {hist?.result || "—"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${
                                      hist?.is_error
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    }`}
                                  >
                                    {hist?.is_error ? (
                                      <AlertCircle size={14} />
                                    ) : (
                                      <CheckCircle2 size={14} />
                                    )}
                                    {hist?.is_error
                                      ? "Error Found"
                                      : "No Error Found"}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${
                                      hist?.status === "Checked"
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        : "bg-amber-50 text-amber-600 border-amber-200"
                                    }`}
                                  >
                                    {hist?.status ? (
                                      <CheckCircle2 size={15} />
                                    ) : (
                                      <AlertCircle size={15} />
                                    )}
                                    {hist?.status || "—"}
                                  </span>
                                </div>
                                <div className="w-full">
                                  <p className="text-xs text-slate-500">
                                    Description
                                  </p>
                                  <p className="text-sm text-slate-700">
                                    {hist?.description || (
                                      <p className="text-xs text-slate-400">
                                        No description available
                                      </p>
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400">
                              No history available
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center mb-10 mt-10">
                      No history available
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
