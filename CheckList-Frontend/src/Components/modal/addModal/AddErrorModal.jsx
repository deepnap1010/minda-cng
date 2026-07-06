import React, { useEffect } from "react";
import { X, AlertCircle, CheckCircle2, AlertOctagon } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAssemblyLineError } from "../../../hooks/useAssemblyLineError";

// Validation schema
const validationSchema = Yup.object({
  is_error: Yup.boolean().required("Status is required"),
  description: Yup.string().nullable(),
});

export default function AddErrorModal({
  open,
  onClose,
  data,
}) {
  const { updateAssemblyLineError } = useAssemblyLineError();

  const formik = useFormik({
    initialValues: {
      is_error: data?.is_error ?? true, 
      description: data?.description || "",
      result: data?.result || "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
    
      let resultValue = values.result;
      if (data?.checklistItem?.result_type === "yesno") {
        resultValue = values.is_error ? "no" : "yes";
      }

      const payload = {
        checkList: data?.checklistItem?._id,
        process_id: data?.processInfo?._id,
        assembly: data?.assemblyLine?._id,
        is_error: false,
        description: values.description,
        result: resultValue,
        is_resolved:true 
      };

      updateAssemblyLineError.mutate(
        { id: data?._id, data: payload },
        {
          onSuccess: () => {
            formik.resetForm();
            onClose();
          },
        }
      );
    },
  });

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slideLeft flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="text-red-600" size={24} />
              Update Error
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Review and update inspection status
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Details Section */}
        <div className="space-y-6 flex-1">
          {/* Item Info Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <InfoRow label="Item" value={data?.checklistItem?.item} />
            <InfoRow label="Method" value={data?.checklistItem?.check_list_method} />
            <InfoRow label="Time" value={data?.checklistItem?.check_list_time} />
          </div>

          {/* Context Info Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
            <InfoRow 
              label="Assembly" 
              value={`${data?.assemblyLine?.assembly_name} (${data?.assemblyLine?.assembly_number})`} 
            />
            <InfoRow 
              label="Process" 
              value={`${data?.processInfo?.process_name} (${data?.processInfo?.process_no})`} 
            />
             <InfoRow 
              label="Current Result" 
              value={data?.result}
              isError={data?.is_error}
            />
          </div>

          {/* Form */}
          <form onSubmit={formik.handleSubmit} className="space-y-6 pt-4">
            
            {/* Status Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">
                Update Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* <button
                  type="button"
                  onClick={() => formik.setFieldValue("is_error", true)}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                    ${formik.values.is_error === true
                      ? "border-red-500 bg-red-50 text-red-700" 
                      : "border-slate-200 hover:border-red-200 hover:bg-slate-50 text-slate-600"}
                  `}
                >
                  <AlertOctagon size={24} />
                  <span className="font-semibold">Error</span>
                </button> */}

                <button
                  type="button"
                  onClick={() => formik.setFieldValue("is_error", false)}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                    ${formik.values.is_error === false
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                      : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-600"}
                  `}
                >
                  <CheckCircle2 size={24} />
                  <span className="font-semibold">Resolve</span>
                </button>
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                rows="4"
                placeholder="Add details about the error or resolution..."
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`
                  w-full px-4 py-3 rounded-xl border bg-white resize-none
                  focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all
                  ${formik.errors.description && formik.touched.description 
                    ? "border-red-300 focus:border-red-400" 
                    : "border-slate-200 focus:border-blue-400"}
                `}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="text-red-500 text-sm font-medium animate-pulse">
                  {formik.errors.description}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={updateAssemblyLineError.isPending}
              className={`
                w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-200
                transition-all duration-200 transform active:scale-[0.98]
                ${updateAssemblyLineError.isPending 
                  ? "bg-slate-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-xl"}
              `}
            >
              {updateAssemblyLineError.isPending ? "Updating..." : "Update Status"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, isError }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="font-medium text-slate-500 shrink-0">{label}</span>
      <span className={`font-semibold text-right break-words ${
        isError === true ? "text-red-600" : 
        isError === false ? "text-emerald-600" : 
        "text-slate-900"
      }`}>
        {value || "—"}
      </span>
    </div>
  );
}
