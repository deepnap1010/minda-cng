import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object({
  result: Yup.string().required("Result is required"),
  remark: Yup.string().nullable(),
});

export default function AddCheckItemHistoryModal({
  open,
  onClose,
  mode = "view",
  data,
}) {
  const isView = mode === "view";
  if (!open || !data) return null;

  const formik = useFormik({
    initialValues: {
      result: data.result || "",
      remark: data.remark || "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      if (isView) return;
      onClose();
    },
  });         

  return (
    <div className="fixed inset-0 z-[70]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* sliding panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl
        transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">
              {isView ? "View Check Item History" : "Edit Check Item History"}
            </h3>
            <p className="text-sm text-slate-500">
              Quality check record Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X />
          </button>
        </div>

        {/* body */}
        <form
          onSubmit={formik.handleSubmit}
          className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-160px)]"
        >
          <Info label="Item" value={data.checkList.item} />
          <Info label="Method" value={data.checkList.check_list_method} />
          <Info label="Time" value={data.checkList.check_list_time} />
          <Info
            label="Assembly"
            value={`${data.assembly.assembly_name} (${data.assembly.assembly_number})`}
          />
          <Info
            label="Process"
            value={`${data.process_id.process_name} (${data.process_id.process_no})`}
          />
          <Info
            label="Checked By"
            value={`${data.user_id.full_name} (${data.user_id.user_id})`}
          />

          {/* RESULT */}
          <div>
            <label className="font-medium block mb-1">Result</label>

            {isView ? (
              <span
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold
                ${
                  data.result === "Pass"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {data.result === "Pass" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {data.result}
              </span>
            ) : (
              <select
                name="result"
                value={formik.values.result}
                onChange={formik.handleChange}
                className="w-full px-4 py-3 rounded-xl border focus:ring-4 focus:ring-blue-200"
              >
                <option value="">Select</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            )}

            {formik.touched.result && formik.errors.result && (
              <p className="text-red-500 text-xs mt-1">
                {formik.errors.result}
              </p>
            )}
          </div>

          {/* REMARK */}
          <div>
            <label className="font-medium block mb-1">Remark</label>
            <textarea
              name="remark"
              rows={3}
              readOnly={isView}
              value={formik.values.remark}
              onChange={formik.handleChange}
              className={`w-full px-4 py-3 rounded-xl border resize-none
                ${isView ? "bg-slate-50" : "focus:ring-4 focus:ring-blue-200"}
              `}
            />
          </div>

          <Info
            label="Checked On"
            value={new Date(data.createdAt).toLocaleString()}
          />

          {!isView && (
            <button
              type="submit"
              className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Update
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-slate-600 text-right">{value}</span>
    </div>
  );
};