import React from "react";
import {
  X,
  User,
  Mail,
  Briefcase,
  Building2,
  Factory,
  Layers,
} from "lucide-react";

export default function ViewEmployeeModal({ open, onClose, data }) {
  if (!open || !data) return null;



  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      {/* PANEL */}
      <div className="bg-white h-screen w-full sm:w-[750px] xl:w-[850px] shadow-2xl animate-slideLeft flex flex-col">
        {/* HEADER */}
        <div className="px-8 py-6 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Employee Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete employee information (read only)
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
        <div className="px-8 py-6 space-y-6 overflow-y-auto">
          {/* GENERAL INFORMATION */}
          <ColoredSection
            title="General Information"
            color="teal"
            icon={<User size={18} />}
          >
            <Info label="Employee Code" value={data.user_id} />
            <Info label="Full Name" value={data.full_name} />
            <Info label="Email" value={data.email} />
            <Info
              label="Designation"
              value={data.designation || data.desigination}
            />
            <Info label="Role" value={data?.userRole?.name} />
            {data?.is_hod === true ? (
              <Info label="isHod" value="Yes" />
            ) : (
              <Info label="isHod" value="No" />
            )}
          </ColoredSection>

          {/* ORGANIZATION */}
          <ColoredSection
            title="Organization"
            color="blue"
            icon={<Building2 size={18} />}
          >
            <Info label="Company" value={data.company?.company_name} />
            <Info
              label="Plant"
              value={`${data?.plant?.plant_name} (${data?.plant?.plant_code})`}
            />
            <Info label="Department" value={data.department?.name} />
          </ColoredSection>

          {/* ASSEMBLY LINES */}
          <ColoredSection
            title="Assembly Lines"
            color="green"
            icon={<Layers size={18} />}
          >
            {data.assambly_line?.length ? (
              <div className="flex flex-wrap gap-3">
                {data.assambly_line.map((line) => (
                  <span
                    key={line._id}
                    className="px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium"
                  >
                    {line.line_name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No assembly lines assigned
              </p>
            )}
          </ColoredSection>
        </div>
      </div>

      {/* ANIMATION */}
      <style>{`
        @keyframes slideLeft {
          from {
            transform: translateX(100%);
            opacity: 0.85;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideLeft {
          animation: slideLeft 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}

/* ===================== REUSABLE UI ===================== */

function ColoredSection({ title, icon, color, children }) {
  const colorMap = {
    teal: "bg-teal-50 border-teal-200 border-l-4 border-l-teal-400",
    blue: "bg-blue-50 border-blue-200 border-l-4 border-l-blue-400",
    green: "bg-green-50 border-green-200 border-l-4 border-l-green-400",
  };

  const titleColor = {
    teal: "text-teal-700",
    blue: "text-blue-700",
    green: "text-green-700",
  };

  return (
    <div className={`rounded-2xl p-6 border ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-5">
        <span className={`${titleColor[color]}`}>{icon}</span>
        <h3 className={`text-base font-semibold ${titleColor[color]}`}>
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
        {children}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[380px] break-words">
        {value || "-"}
      </span>
    </div>
  );
}
