import React, { useEffect, useState } from "react";
import { useCheckItemData } from "../hooks/useCheckItemData";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import NoDataFoundPage from "../components/NoDataFound/NoDataFoundPage";

const CheckItemsData = () => {
  const [assembly_id, setAssembly_id] = useState("");
  const {
    getAssemblyAndProcessData,
    PostCheckListForm,
    PostCheckListFormHistory,
  } = useCheckItemData();
  const [errors, setErrors] = useState({});
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

  const formik = useFormik({
    initialValues: {
      data: [],
    },
    onSubmit: (values) => {
      const allFilled = PostCheckListForm?.data?.every((assembly) =>
        assembly?.processes?.every((p) =>
          p?.checklist_item?.every((item) =>
            values.data.some((dataItem) => dataItem.checkList === item._id)
          )
        )
      );

      if (allFilled) {
        PostCheckListFormHistory.mutate(values, {
          onSuccess: () => {
            formik.resetForm();
            setAssembly_id("");
            setErrors({});
            PostCheckListForm.data = [];
            getAssemblyAndProcessData.refetch();
          },
        });
      } else {
        toast.error("Please fill all checklist items before submitting.");
      }
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
    const exists = formik.values.data.find((i) => i.checkList === checkListId);

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

  const setDescription = (checkListId, description) => {
    const updatedData = formik.values.data.map((i) =>
      i.checkList === checkListId ? { ...i, description } : i
    );
    formik.setFieldValue("data", updatedData);
  };

  useEffect(() => {
    if (assembly_id) {
      PostCheckListForm.mutate({ assembly_id });
    }
  }, [assembly_id]);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 space-y-4">
        <div className="mb-8 rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Quality Check Items
              </h1>
              <p className="text-slate-500 mt-1 text-sm sm:text-base">
                Review, verify, and record checklist values per assembly &
                process
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <select                                                                                  
              value={assembly_id}
              onChange={(e) => {
                setAssembly_id(e.target.value);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Assembly</option>
              {getAssemblyAndProcessData?.data?.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.assembly_name} ({i.assembly_number})
                  {i?.checked && <span>✔</span>}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!assembly_id && (
          <NoDataFoundPage
            title="No Assembly Selected"
            subtitle="Please select an assembly from the dropdown above to load 
            quality check items."
          />
        )}

        {assembly_id &&
          PostCheckListForm?.data?.map((assembly) => (
            <div
              key={assembly._id}
              className="mb-10 rounded-2xl bg-white border border-slate-200 shadow-lg overflow-hidden"
            >
              <div className="bg-[#6955e7] p-6 text-white">
                <h2 className="text-2xl font-bold">
                  {assembly?.assembly_name}
                  <span className="ml-2 text-indigo-200 text-lg">
                    ({assembly?.assembly_number})
                  </span>
                </h2>

                <p className="text-sm mt-2 flex items-center gap-2">
                  <p className="font-bold">Process:</p>
                  <span className="flex flex-wrap gap-2 mt-2">
                    {assembly?.processes?.map((p) => (
                      <span
                        key={p._id}
                        className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold"
                      >
                        {p.process_name} ({p.process_no})
                      </span>
                    ))}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-slate-50">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Company</p>
                  <p className="font-semibold text-slate-800 text-lg">
                    {assembly?.company?.company_name}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Plant</p>
                  <p className="font-semibold text-slate-800 text-lg">
                    {assembly?.plant?.plant_name}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">
                    Responsible
                  </p>
                  <p className="font-semibold text-slate-800">
                    {assembly.responsibleUser.full_name}
                    <span className="ml-1 text-indigo-600">
                      ({assembly?.responsibleUser?.user_id})
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {assembly?.responsibleUser?.email}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-indigo-700 mb-5">
                  Checklist Items
                </h3>

                <div className="space-y-8">
                  {assembly?.processes?.map((p, pIndex) => (
                    <div
                      key={p._id}
                      className="  rounded-xl p-4 bg-white shadow-sm"
                    >
                      <h4 className="text-lg font-bold text-indigo-600 mb-4">
                        {pIndex + 1}. {p.process_name} ({p.process_no})
                      </h4>

                      {p?.checklist_item?.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          No checklist items
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {p.checklist_item.map((item, index) => (
                            <div
                              key={item._id}
                              className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-center
              rounded-xl border border-gray-200 bg-slate-50
              p-4 hover:shadow-md transition"
                            >
                              <div className="sm:col-span-2">
                                <p className="font-semibold text-slate-800">
                                  {index + 1}. {item.item}
                                </p>
                                <p className="text-xs text-indigo-600">
                                  Method: {item.check_list_method}
                                </p>

                                {item.result_type === "measurement" && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    Min:{" "}
                                    <span className="font-semibold">
                                      {item.min}
                                    </span>{" "}
                                    | Max:{" "}
                                    <span className="font-semibold">
                                      {item.max}
                                    </span>{" "}
                                    | UOM:{" "}
                                    <span className="font-semibold">
                                      {item.uom}
                                    </span>
                                  </p>
                                )}
                              </div>

                              <div className="text-sm font-medium text-slate-600">
                                ⏱ {item?.check_list_time}
                              </div>

                              <div className="sm:col-span-2">
                                {item?.result_type === "yesno" ? (
                                  <div className="flex flex-col gap-2">
                                    <select
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const isError = value === "Issue Found";

                                        setResult(
                                          item?._id,
                                          value,
                                          assembly?._id,
                                          p?._id,
                                          isError
                                        );
                                      }}
                                      required
                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    >
                                      <option value="">Select</option>
                                      <option value="Checked OK">
                                        Checked OK
                                      </option>
                                      <option value="Issue Found">
                                        Issue Found
                                      </option>
                                    </select>

                                    {formik.values.data.find(
                                      (d) => d?.checkList === item?._id
                                    )?.is_error && (
                                        <textarea
                                          placeholder="Enter reason for issue found..."
                                          onChange={(e) =>
                                            setDescription(
                                              item?._id,
                                              e.target.value
                                            )
                                          }
                                          className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm"
                                          rows={2}
                                        />
                                      )}
                                  </div>
                                ) : (
                                  <div>
                                    <input
                                      type="number"
                                      min={item?.min}
                                      max={item?.max}
                                      required
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const numValue = Number(value);
                                        const isOutOfRange =
                                          value !== "" &&
                                          (numValue < item?.min ||
                                            numValue > item?.max);

                                        handleMeasurementChange(
                                          item?._id,
                                          value,
                                          item?.min,
                                          item?.max
                                        );

                                        setResult(
                                          item?._id,
                                          value,
                                          assembly?._id,
                                          p?._id,
                                          isOutOfRange
                                        );
                                      }}
                                      className={`w-full rounded-lg border px-3 py-2 text-sm
                        ${errors[item?._id]
                                          ? "border-red-400"
                                          : "border-gray-300"
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
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

        {formik.errors.data && (
          <p className="text-red-500 text-sm mb-2">{formik.errors.data}</p>
        )}
        {assembly_id?.length > 0 && (
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              onClick={formik.handleSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={formik.values.data.length === 0}
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckItemsData;
