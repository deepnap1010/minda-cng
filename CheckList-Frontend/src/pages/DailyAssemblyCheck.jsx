import React, { useEffect, useState } from "react";
import { Database, CheckCircle2, AlertCircle } from "lucide-react";
import { getDailyAssemblyLineData, useCheckItemData } from "../hooks/useCheckItemData";
import NoDataFoundPage from "../components/NoDataFound/NoDataFoundPage";
import { useFormik } from "formik";

const DailyCheckAssembly = () => {
  const [assembly_id, setAssembly_id] = useState("");
  const [errors, setErrors] = useState({});
  const { getAssemblyAndProcessData, PostCheckListFormHistoryTiming } = useCheckItemData()
  const { data: dailyData } = getDailyAssemblyLineData(assembly_id);


  const formik = useFormik({
    initialValues: {
      data: [],
    },
    onSubmit: (values) => {

      const allFilled = dailyData?.every((assembly) =>
        assembly.processes.every((p) =>
          p.checklist_item.every((item) =>
            values.data.some((d) => d.checkList === item._id)
          )
        )
      );

      if (!allFilled) {
        toast.error("Please fill all checklist items");
        return;
      }

      PostCheckListFormHistoryTiming.mutate(values, {
        onSuccess: () => {

          formik.resetForm();
          setAssembly_id("");
          setErrors({});
        },
      });
    },
  });
  const setResult = (
    checkListId,
    result,
    assemblyId,
    processId,
    is_error = false,
    description = ""
  ) => {
    const exists = formik.values.data.find(
      (i) => i.checkList === checkListId
    );

    let updatedData;

    if (exists) {
      updatedData = formik.values.data.map((i) =>
        i.checkList === checkListId
          ? { ...i, result, is_error, description, status: "Checked" }
          : i
      );
    } else {
      updatedData = [
        ...formik.values.data,
        {
          checkList: checkListId,
          process_id: processId,
          assembly: assemblyId,
          result,
          is_error,
          description,
          status: "Checked",
        },
      ];
    }

    formik.setFieldValue("data", updatedData);
  };



  const handleMeasurementChange = (itemId, value, min, max) => {
    if (value === "") {
      setErrors((prev) => ({ ...prev, [itemId]: "" }));
      return;
    }
    const numValue = Number(value);

    if (numValue < min || numValue > max) {
      setErrors((prev) => ({
        ...prev,
        [itemId]: `Value must be between ${min} and ${max}`,
      }));
    } else {
      setErrors((prev) => ({ ...prev, [itemId]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 space-y-4">

        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Daily Quality Check Items
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Review, verify, and record checklist values per assembly & process
          </p>
        </div>

        {/* Assembly Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <select
            value={assembly_id}
            onChange={(e) => setAssembly_id(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm
                   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Assembly</option>
            {getAssemblyAndProcessData?.data?.map((i) => (
              <option key={i._id} value={i._id}>
                {i.assembly_name} ({i.assembly_number})
              </option>
            ))}
          </select>
        </div>

        {/* No Assembly Selected */}
        {!assembly_id && (
          <NoDataFoundPage
            title="No Assembly Selected"
            subtitle="Please select an assembly to load quality check items."
          />
        )}

        {/* Assembly Data */}
        {assembly_id && dailyData?.map((assembly) => (
          <div key={assembly._id} className="mb-10 rounded-2xl bg-white border border-slate-200 shadow-lg overflow-hidden">

            {/* Assembly Header */}
            <div className="bg-indigo-700 p-6 text-white">
              <h2 className="text-2xl font-bold">
                {assembly.assembly_name}
                <span className="ml-2 text-indigo-200 text-lg">({assembly.assembly_number})</span>
              </h2>
              <p className="mt-2 text-sm">
                <span className="font-bold">Processes:</span>
                {assembly.processes.map((p) => (
                  <span key={p._id} className="ml-2 inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                    {p.process_name} ({p.process_no})
                  </span>
                ))}
              </p>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-slate-50">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Company</p>
                <p className="font-semibold text-slate-800 text-lg">{assembly.company.company_name}</p>
                <p className="text-xs text-slate-400">{assembly.company.company_address}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Plant</p>
                <p className="font-semibold text-slate-800 text-lg">{assembly.plant.plant_name}</p>
                <p className="text-xs text-slate-400">{assembly.plant.plant_address}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Responsible</p>
                <p className="font-semibold text-slate-800">
                  {assembly.responsibleUser.full_name}
                  <span className="ml-1 text-indigo-600">({assembly.responsibleUser.user_id})</span>
                </p>
                <p className="text-xs text-slate-400">{assembly.responsibleUser.email}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-indigo-700 mb-4">Part Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {assembly.part_details.map((part) => (
                  <div key={part._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="font-semibold text-slate-800">{part.part_name}</p>
                    <p className="text-xs text-slate-500">Part Number: {part.part_number}</p>
                    <p className="text-xs text-slate-500">Material: {part.material_code}</p>
                    <p className="text-xs text-slate-500">Modal: {part.modal_name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Processes & Checklist */}
            {assembly.processes.map((process, pIndex) => (
              <div key={process._id} className="p-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-indigo-600 mb-4">
                  {pIndex + 1}. {process.process_name} ({process.process_no})
                </h3>

                {process.checklist_item.length === 0 ? (
                  <p className="text-sm text-slate-400">No checklist items</p>
                ) : (
                  <div className="space-y-4">
                    {process.checklist_item.map((item, index) => (
                      <div
                        key={item._id}
                        className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-center rounded-xl border border-gray-200 bg-slate-50 p-4 hover:shadow-md transition"
                      >
                        {/* Item Info */}
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-slate-800">{index + 1}. {item.item}</p>
                          <p className="text-xs text-indigo-600">Method: {item.check_list_method}</p>
                          {item.result_type === "measurement" && (
                            <p className="text-xs text-slate-500 mt-1">
                              Min: <span className="font-semibold">{item.min}</span> | Max: <span className="font-semibold">{item.max}</span> | UOM: <span className="font-semibold">{item.uom}</span>
                            </p>
                          )}
                          {/* Check timings */}
                          {item.check_timing && (
                            <p className="text-xs text-slate-400 mt-1">
                              Check Timings: {item.check_timing.map((t) => new Date(t.check_time).toLocaleTimeString()).join(", ")}
                            </p>
                          )}
                        </div>

                        {/* Check Type */}
                        <div className="text-sm font-medium text-slate-600">
                          {item.check_list_time}
                        </div>

                        {/* Input */}
                        <div className="sm:col-span-2">
                          {item.result_type === "yesno" ? (
                            <div className="flex flex-col gap-2">

                              <select
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const isError = value === "Issue Found";

                                  setResult(
                                    item._id,
                                    value,
                                    assembly._id,
                                    process._id,
                                    isError
                                  );
                                }}
                              >
                                <option value="">Select</option>
                                <option value="Checked OK">Checked OK</option>
                                <option value="Issue Found">Issue Found</option>
                              </select>
                              {formik.values.data.find(d => d.checkList === item._id)?.is_error && (
                                <textarea
                                  rows={2}
                                  placeholder="Enter reason..."
                                  className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm mt-2"
                                  onChange={(e) =>
                                    setResult(
                                      item._id,
                                      "Issue Found",
                                      assembly._id,
                                      process._id,
                                      true,
                                      e.target.value
                                    )
                                  }
                                />
                              )}

                            </div>

                          ) : (
                            <div>
                              <input
                                type="number"
                                min={item.min}
                                max={item.max}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const num = Number(value);
                                  const isError = num < item.min || num > item.max;

                                  handleMeasurementChange(item._id, value, item.min, item.max);

                                  setResult(
                                    item._id,
                                    value,
                                    assembly._id,
                                    process._id,
                                    isError
                                  );
                                }}
                                className={`w-full rounded-lg border px-3 py-2 text-sm ${errors[item._id] ? "border-red-400" : "border-gray-300"
                                  }`}
                                placeholder="Enter value"
                              />


                              {errors[item?._id] && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors[item?._id]}
                                </p>
                              )}
                            </div>

                          )}
                        </div>


                        {item.file_path && (
                          <div className="sm:col-span-1">
                            <img src={item.file_path} alt={item.item} className="w-full h-20 object-cover rounded" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}



            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={formik.handleSubmit}
                disabled={formik.values.data.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold
             py-2 px-6 rounded-lg shadow-md disabled:bg-gray-300"
              >
                Submit Daily Check
              </button>

            </div>
          </div>
        ))}
      </div>
    </div>


  );
};

export default DailyCheckAssembly;
