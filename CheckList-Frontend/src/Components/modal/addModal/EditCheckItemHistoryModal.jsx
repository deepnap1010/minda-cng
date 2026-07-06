import { CheckCheck, X } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useCheckItemHistory } from "../../../hooks/useCheckItemHistory";

const validationSchema = Yup.object({
  result: Yup.string().required("Result is required"),
  remark: Yup.string().nullable(),
});

export default function EditCheckItemHistoryModal({ open, onClose, data }) {
  if (!open || !data) return null;

  const { updateCheckItemHistory } = useCheckItemHistory();

  const formik = useFormik({
    initialValues: {
      result: data.result || "",
      remark: data.remark || "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      updateCheckItemHistory.mutate(
        {
          id: data._id,
          data: values,
        },
        {
          onSuccess: () => {
            formik.resetForm();
            onClose();
          },
        }
      );
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
            <h3 className="text-xl font-semibold">Edit Check Item History</h3>
            <p className="text-sm text-slate-500">
              Update quality check record
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
            value={`${data?.assembly?.assembly_name} (${data?.assembly?.assembly_number})`}
          />
          <Info
            label="Process"
            value={`${data?.process_id?.process_name} (${data?.process_id?.process_no})`}
          />
          <Info
            label="Checked By"
            value={`${data?.user_id?.full_name} (${data?.user_id?.user_id})`}
          />

          {/* RESULT */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Evaluation
            </label>

            <div className="relative">
              <select
                name="result"
                value={formik.values.result}
                onChange={formik.handleChange}
                className={`
        w-full appearance-none px-4 py-3 rounded-xl border bg-white
        font-medium text-slate-800
        focus:outline-none focus:ring-4
        transition-all duration-200
        ${
          formik.values.result === "Checked OK"
            ? "border-emerald-300 focus:ring-emerald-200"
            : formik.values.result === "Issue Found"
            ? "border-red-300 focus:ring-red-200"
            : "border-slate-300 focus:ring-blue-200"
        }
      `}
              >
                <option value="">Select Evaluation</option>
                <option value="Checked OK">Checked OK</option>
                <option value="Issue Found">Issue Found</option>
              </select>

              {/* dropdown arrow */}
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                ▼
              </span>
            </div>

            {formik.touched.result && formik.errors.result && (
              <p className="text-red-500 text-xs mt-1 font-medium">
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
              value={formik.values.remark}
              onChange={formik.handleChange}
              className="w-full px-4 py-3 rounded-xl border resize-none focus:ring-4 focus:ring-blue-200"
            />
          </div>

          <Info
            label="Checked On"
            value={new Date(data.createdAt).toLocaleString()}
          />

          <button
            type="submit"
            disabled={updateCheckItemHistory.isPending}
            className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {updateCheckItemHistory.isPending ? "Updating..." : "Update"}
          </button>
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
}
