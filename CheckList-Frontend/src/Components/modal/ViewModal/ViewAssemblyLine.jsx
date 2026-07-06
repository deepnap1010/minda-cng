import React from "react";
import { X, Factory, Layers, Users, Settings, Clock } from "lucide-react";

export default function ViewAssemblyLine({ open, onClose, data }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      {/* PANEL */}
      <div className="bg-white h-screen w-full sm:w-[720px] xl:w-[820px] shadow-2xl animate-slideLeft flex flex-col">
        
        {/* HEADER */}
        <div className="px-8 py-6 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Assembly Line Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Read-only assembly line information
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
            title="Assembly Information"
            icon={<Factory size={16} />}
            color="blue"
          >
            <Row label="Assembly Name">
              {data?.assembly_name || "—"}
            </Row>

            <Row label="Assembly Number">
              {data?.assembly_number || "—"}
            </Row>

            <Row label="Company">
              {data?.company?.company_name || "—"}
            </Row>

            <Row label="Plant">
              {data?.plant?.plant_name || "—"}
            </Row>
          </Section>

          {/* RESPONSIBILITY */}
          <Section
            title="Responsibility & Part"
            icon={<Users size={16} />}
            color="green"
          >
            <Row label="Responsible Person">
              {data?.responsibleUser?.full_name
                ? `${data.responsibleUser.full_name} (${data.responsibleUser.user_id})`
                : "—"}
            </Row>

            {/* PART DATA */}
            <Row label="Part">
              {data?.part_details?.length ? (
                data.part_details.map((part) => (
                  <div key={part._id}>
                    {part.part_name} ({part.part_number})
                  </div>
                ))
              ) : (
                "—"
              )}
            </Row>
          </Section>

          {/* PROCESSES */}
          <Section
            title="Assigned Processes"
            icon={<Settings size={16} />}
            color="blue"
          >
            {data?.processes?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.processes.map((p) => (
                  <span
                    key={p._id}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {p.process_name} ({p.process_no})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No processes assigned
              </p>
            )}
          </Section>

          {/* METADATA */}
          <Section
            title="Metadata"
            icon={<Clock size={16} />}
            color="red"
          >
            <Row label="Created On">
              {formatDate(data?.createdAt)}
            </Row>

            <Row label="Last Updated">
              {formatDate(data?.updatedAt)}
            </Row>
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
    purple: "bg-purple-50 border-purple-200 text-purple-700",
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
      <span className="text-sm font-medium text-right max-w-[280px]">
        {children}
      </span>
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