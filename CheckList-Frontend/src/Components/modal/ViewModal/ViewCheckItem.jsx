import React from "react";
import { X, ClipboardCheck, Clock, Ruler, Info } from "lucide-react";

export default function ViewCheckItem({ open, onClose, data }) {
  if (!open || !data) return null;

  const isMeasurement = data?.result_type === "measurement";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      {/* PANEL */}
      <div className="bg-white h-screen w-full sm:w-[720px] xl:w-[820px] shadow-2xl animate-slideLeft flex flex-col">
        {/* HEADER */}
        <div className="px-8 py-6 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Check-Item Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Read-only check-item information
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* BASIC INFO */}
          <Section
            title="General Information"
            icon={<Info size={16} />}
            color="blue"
          >
            <Row label="Process">
              {data?.processInfo?.process_name
                ? `${data.processInfo.process_name} (${data.processInfo.process_no})`
                : "—"}
            </Row>

            <Row label="Item">{data?.item || "—"}</Row>

            <Row label="Description">{data?.description || "—"}</Row>
          </Section>

          {/* CHECK CONFIG */}
          <Section
            title="Check Configuration"
            icon={<ClipboardCheck size={16} />}
            color="green"
          >
            <Row label="Check Method">{data?.check_list_method || "—"}</Row>

            <Row label="Checking Time">{data?.check_list_time || "—"}</Row>

            <Row label="Evaluation Type">
              {data?.result_type === "yesno"
                ? "Condition Check (Yes / No)"
                : "Numeric Check"}
            </Row>

            {isMeasurement && (
              <div className="grid grid-cols-3 gap-4 mt-3">
                <Mini label="Min">{data?.min}</Mini>
                <Mini label="Max">{data?.max}</Mini>
                <Mini label="UOM">{data?.uom}</Mini>
              </div>
            )}
          </Section>

          {/* META */}
          <Section title="Metadata" icon={<Clock size={16} />} color="red">
            <Row label="Created On">{formatDate(data?.createdAt)}</Row>

            <Row label="Last Updated">{formatDate(data?.updatedAt)}</Row>
          </Section>
        </div>
      </div>

      {/* ANIMATION */}
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideLeft {
          animation: slideLeft 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function Section({ title, icon, color = "blue", children }) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-4 font-semibold">
        {icon}
        <span>{title}</span>
      </div>

      <div className="space-y-3 text-gray-800">{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-right max-w-[260px]">
        {children}
      </span>
    </div>
  );
}

function Mini({ label, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-semibold">{children}</p>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
