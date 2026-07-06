import React, { useEffect } from "react";
import { Form, X } from "lucide-react";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useProcess } from "../../../hooks/useProcess";
import { validationSchema } from "../../../Validation/CheckItemValidation";
import { useCheckItem } from "../../../hooks/useCheckItem";
import SearchableDropdown from "../../SearchableDropDown/SearchableDropDown";
import SearchableDropdownwithRemove from "../../SearchableDropDown/SearchableDropDown2";

export default function AddCheckItemModal({
  open,
  onClose,
  mode = "add",
  initialData = null,
}) {
  const isView = mode === "view";

  const { getProcessData } = useProcess();
  const { CreateCheckItem, updateCheckItem, AddCategroy, GetCategory } =
    useCheckItem();
  const [newInputTime, setNewInputTime] = useState("");

  const [showMethodInput, setShowMethodInput] = useState(false);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [showUomInput, setShowUomInput] = useState(false);
  const [methodList, setMethodList] = useState([]);
  const [newMethod, setNewMethod] = useState("");

  const [newTime, setNewTime] = useState("");
  const [checklistTimes, setChecklistTimes] = useState("");

  const [newUom, setNewUom] = useState("");
  const [uom, setUom] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (GetCategory?.data) {
      const UomData = GetCategory?.data
        ?.filter((item) => item?.uom)
        ?.map((item) => ({
          uom: item.uom,
          id: item._id,
        }));

      setUom(UomData);
      const MethodData = GetCategory.data
        .filter((item) => item?.checking_method)
        .map((item) => ({
          checking_method: item.checking_method,
          id: item._id,
        }));

      setMethodList(MethodData);
      const ListData = GetCategory.data
        .filter((item) => item?.checking_time)
        .map((item) => ({
          checking_time: item.checking_time,
          id: item._id,
        }));

      setChecklistTimes(ListData);
    }
  }, [GetCategory?.data]);

  const formik = useFormik({
    initialValues: {
      process: initialData?.processInfo?._id || initialData?.processInfo || "",
      item: initialData?.item || "",
      description: initialData?.description || "",
      check_list_method: initialData?.check_list_method || "",
      check_list_time: initialData?.check_list_time || "",
      result_type: initialData?.result_type || "",
      min: initialData?.min || 0,
      max: initialData?.max || 0,
      uom: initialData?.uom || "",
      file: initialData?.file_path || null,
      time: initialData?.time || []

    }, 
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const formdata = new FormData();

      formdata.append("process", values.process);
      formdata.append("item", values.item);
      formdata.append("description", values.description);
      formdata.append("check_list_method", values.check_list_method);
      formdata.append("check_list_time", values.check_list_time);
      formdata.append("result_type", values.result_type);
      formdata.append("min", values.min);
      formdata.append("max", values.max);
      formdata.append("uom", values.uom);
      formdata.append("file", values.file);
      values.time.map((item) => {
        const time = item?.check_time
          ? new Date(item.check_time).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          : item;

        formdata.append("time", time);
      });



   
      if (mode === "edit") {
        updateCheckItem.mutate({
          id: initialData?._id,
          data: formdata,
        }, {
          onSuccess: () => {
            onClose()
            formik.resetForm()
            formdata("")
            setImagePreview(null)
          }
        }
        );

      } else {
        CreateCheckItem.mutate(formdata, {
          onSuccess: () => {
            onClose()
            formik.resetForm()
            formdata("")
            setImagePreview(null)
          }
        });

      }
    }

  });


  useEffect(() => {
    if (open && initialData?.file_path) {
      setImagePreview(initialData.file_path);
    }
  }, [open, initialData?.file_path]);


  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white h-full w-[420px] shadow-lg p-6 animate-slideLeft overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {mode === "add"
              ? "Add Check Item"
              : mode === "edit"
                ? "Edit Check Item"
                : "View Check Item"}
          </h2>
          <button onClick={() => {
            onClose()
            formik.resetForm()
            setImagePreview(null)
          }}>
            <X size={22} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          {/* Process */}
          <Field label="Process">
            <SearchableDropdown
              placeholder="Select Process"
              options={(getProcessData?.data || []).map((p) => ({
                label: `${p.process_name} (${p.process_no})`,
                value: p._id,
              }))}
              value={formik.values.process}
              getOptionLabel={(opt) => opt.label}
              getOptionValue={(opt) => opt.value}
              onChange={(val) => formik.setFieldValue("process", val)}
              onBlur={() => formik.setFieldTouched("process", true)}
              disabled={isView}
              error={formik.touched.process && formik.errors.process}
            />
          </Field>

          {/* Item */}
          <Field label="Item">
            <input
              name="item"
              disabled={isView}
              value={formik.values.item}
              onChange={formik.handleChange}
              className="input"
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              name="description"
              disabled={isView}
              value={formik.values.description}
              onChange={formik.handleChange}
              className="input"
            />
          </Field>

          <Field label="Check Method">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <SearchableDropdownwithRemove
                  placeholder="Select Checklist Method"
                  options={methodList.map((m) => ({
                    label: m.checking_method,
                    value: m.checking_method,
                    _id: m.id,
                  }))}
                  value={formik.values.check_list_method}
                  getOptionLabel={(o) => o.label}
                  getOptionValue={(o) => o.value}
                  getOptionId={(o) => o._id}
                  onChange={(val) =>
                    formik.setFieldValue("check_list_method", val)
                  }
                  type="checking_method"
                />
              </div>
            </div>

            <div className=" w-full flex justify-end pt-2">
              {!showMethodInput && !isView && (
                <button
                  type="button"
                  className="text-blue-600 text-sm font-medium whitespace-nowrap
        bg-blue-50 border border-blue-300
        px-3 py-1.5 rounded-md
        hover:bg-blue-100 hover:border-blue-400
        transition-colors "
                  onClick={() => setShowMethodInput(true)}
                >
                  + Add Method
                </button>
              )}
            </div>

            {showMethodInput && (
              <div className="flex gap-2 mt-2">
                <input
                  className="input flex-1"
                  placeholder="Enter method"
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                />
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded"
                  onClick={() => {
                    if (!newMethod.trim()) return;

                    AddCategroy.mutate({ newMethod: newMethod });
                    setNewMethod("");
                    setShowMethodInput(false);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowMethodInput(false);
                    setNewMethod("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </Field>

          <Field label="Checking Time">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <SearchableDropdownwithRemove
                  placeholder="Select Checklist Time"
                  options={checklistTimes.map((t) => ({
                    label: t.checking_time,
                    value: t.checking_time,
                    _id: t.id,
                  }))}
                  value={formik.values.check_list_time}
                  getOptionLabel={(o) => o.label}
                  getOptionValue={(o) => o.value}
                  getOptionId={(o) => o._id}
                  onChange={(val) =>
                    formik.setFieldValue("check_list_time", val)
                  }
                  type="checking_time"
                />
              </div>
            </div>

            <div className="w-full flex justify-end pt-2">
              {!showTimeInput && !isView && (
                <button
                  type="button"
                  className="
                     text-blue-600 text-sm font-medium whitespace-nowrap
                     bg-blue-50 border border-blue-300
                        px-3 py-1.5 rounded-md
                      hover:bg-blue-100 hover:border-blue-400
                        transition-colors
                        "
                  onClick={() => setShowTimeInput(true)}
                >
                  + Add Time
                </button>
              )}
            </div>

            {showTimeInput && (
              <div className="flex gap-2 mt-2">
                <input
                  className="input flex-1"
                  placeholder="Enter time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded"
                  onClick={() => {
                    if (!newTime.trim()) return;
                    AddCategroy.mutate({ newTime: newTime });
                    setNewTime("");
                    setShowTimeInput(false);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowTimeInput(false);
                    setNewTime("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </Field>

          <Field label="Timing">
            <div className="flex gap-2">
              <input
                type="time"
                value={newInputTime}
                onChange={(e) => setNewInputTime(e.target.value)}
                className="input flex-1"
                disabled={isView}
              />

              {!isView && (
                <button
                  type="button"
                  className="bg-blue-600 text-white px-4 rounded"
                  onClick={() => {
                    if (!newInputTime) return;

                    formik.setFieldValue("time", [
                      ...formik.values.time,
                      newInputTime,
                    ]);

                    setNewInputTime("");
                  }}
                >
                  Add
                </button>
              )}
            </div>

           
            <div className="flex flex-wrap gap-2 mt-2">
              {formik.values.time?.map((time, index) => 
              (
                <span
                  key={index}
                  className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  
                  {
                    <p key={index}>
                      {time?.check_time ? new Date(time?.check_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : time}
                  </p>
                 }
                  {!isView && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formik.values.time.filter(
                          (_, i) => i !== index
                        );
                        formik.setFieldValue("time", updated);
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </Field>




          {/* Result Type */}
          <Field label="Evaluation Type">
            <div className="flex gap-4 mt-1">
              <label className="flex text-[15px] items-center gap-2">
                <input
                  type="radio"
                  name="result_type"
                  value="yesno"
                  disabled={isView}
                  checked={formik.values.result_type === "yesno"}
                  onChange={formik.handleChange}
                />
                Simple Check
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="result_type"
                  value="measurement"
                  disabled={isView}
                  checked={formik.values.result_type === "measurement"}
                  onChange={formik.handleChange}
                />
                Value Based Check
              </label>
            </div>
          </Field>

          {/* MEASUREMENT */}
          {formik.values.result_type === "measurement" && (
            <>
              <Field label="Min Value">
                <input
                  type="number"
                  name="min"
                  disabled={isView}
                  value={formik.values.min}
                  onChange={formik.handleChange}
                  className="input"
                />
              </Field>

              <Field label="Max Value">
                <input
                  type="number"
                  name="max"
                  disabled={isView}
                  value={formik.values.max}
                  onChange={formik.handleChange}
                  className="input"
                />
              </Field>

              <Field label="UOM">
                <SearchableDropdownwithRemove
                  placeholder="Select UOM"
                  options={uom.map((t) => ({
                    label: t?.uom,
                    value: t?.uom,
                    _id: t.id,
                  }))}
                  value={formik.values.uom}
                  getOptionLabel={(o) => o.label}
                  getOptionValue={(o) => o.value}
                  getOptionId={(o) => o._id}
                  onChange={(val) => formik.setFieldValue("uom", val)}
                  type="uom"
                />

                <div className="w-full flex justify-end pt-2">
                  {!showUomInput && !isView && (
                    <button
                      type="button"
                      className="
        text-blue-600 text-sm font-medium whitespace-nowrap
        bg-blue-50 border border-blue-300
        px-3 py-1.5 rounded-md
        hover:bg-blue-100 hover:border-blue-400
        transition-colors"
                      onClick={() => setShowUomInput(true)}
                    >
                      + Add Uom
                    </button>
                  )}
                </div>

                {showUomInput && (
                  <div className="flex gap-2 mb-2">
                    <input
                      className="input"
                      placeholder="Enter Uom"
                      value={newUom}
                      onChange={(e) => setNewUom(e.target.value)}
                    />
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-3 rounded"
                      onClick={() => {
                        if (!newUom.trim()) return;
                        setNewUom("");
                        setShowUomInput(false);
                        AddCategroy.mutate({ newUom: newUom });
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-gray-500"
                      onClick={() => {
                        setShowUomInput(false);
                        setUomTime("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </Field>
            </>
          )}

          {/* IMAGE UPLOAD */}
          <Field className="mt-2" label="Upload Image">
            <input
              type="file"
              accept="image/*"
              disabled={isView}
              onChange={(e) => {
                const file = e.target.files[0];

                formik.setFieldValue("file", file);  
                formik.setFieldTouched("file", true); 

                if (file) {
                  setImagePreview(URL.createObjectURL(file));
                } else {
                  setImagePreview(null);
                }
              }}
              className="input"
            />
            {formik.touched.file && formik.errors.file && (
              <p className="text-sm text-red-500">{formik.errors.file}</p>
            )}

            {imagePreview && (
              imagePreview.endsWith(".pdf") ? (
                <a href={imagePreview} target="_blank" className="text-blue-600 underline">
                  View PDF
                </a>
              ) : (
                <img src={imagePreview} className="w-full h-40 object-cover rounded-lg" />
              )
            )}

          </Field>

          {/* SUBMIT */}
          {!isView && (
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 rounded-lg mt-4"
            >
              {mode === "add" ? "Add Check Item" : "Update Check Item"}
            </button>
          )}
        </form>
      </div>

      {/* STYLES */}
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideLeft {
          animation: slideLeft 0.3s ease-out;
        }
        .input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

/* FIELD WRAPPER */
 export function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm text-gray-700 font-medium">{label}</label>
      {children}
    </div>
  );
}
