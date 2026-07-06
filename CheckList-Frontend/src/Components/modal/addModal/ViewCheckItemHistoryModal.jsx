import { X, CheckCircle2, AlertCircle } from "lucide-react";

export default function ViewCheckItemHistoryModal({ open, onClose, data }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl
        transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-semibold">View Check Item History</h3>
            <p className="text-sm text-slate-500">
              Complete quality check information
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
        <div className="p-6 space-y-5 overflow-y-auto h-[calc(100vh-120px)]">
          {/* ================= CHECK INFO ================= */}
          <Section title="Check Information">
            <Info label="Item" value={data.item} />
            <Info label="Method" value={data.check_list_method} />
            <Info label="Time" value={data.check_list_time} />
            <Info label="Result Type" value={data.result_type} />
          </Section>

          {/* ================= LIMITS ================= */}
          <Section title="Specification">
            <Info label="Min" value={data.min ?? "-"} />
            <Info label="Max" value={data.max ?? "-"} />
            <Info label="UOM" value={data.uom ?? "-"} />
          </Section>

          {/* ================= PRODUCTION ================= */}
          <Section title="Production Details">
            <Info
              label="Assembly"
              value={`${data.assembly?.assembly_name} (${data.assembly?.assembly_number})`}
            />
            <Info
              label="Process"
              value={`${data.processName} (${data.processNo})`}
            />
          </Section>

          {/* ================= RESULT ================= */}
          <Section title="Result">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold
              ${
                data.is_error
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
              }`}
            >
              {data.is_error ? (
                <AlertCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {data.is_error ? "Error Found" : "Checked OK"}
            </span>

            <Info label="Result Value" value={data.result} />
          </Section>

          {/* ================= AUDIT ================= */}
          <Section title="Audit">
            <Info
              label="Checked By"
              value={`${data.assembly?.responsibility?.full_name} (${data.assembly?.responsibility?.user_id})`}
            />
            <Info
              label="Checked On"
              value={
                data.today?.createdAt
                  ? new Date(data.today.createdAt).toLocaleString()
                  : "-"
              }
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Section({ title, children }) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
      <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-600 text-right">{value ?? "-"}</span>
    </div>
  );
}
