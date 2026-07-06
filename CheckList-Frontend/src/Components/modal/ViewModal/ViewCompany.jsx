import React from "react";
import { X, Building2, MapPin, FileText, BadgeCheck } from "lucide-react";

const ViewCompanyDrawer = ({ open, onClose, data }) => {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      {/* PANEL */}
      <div className="bg-white h-screen w-full sm:w-[720px] xl:w-[820px] shadow-2xl animate-slideLeft flex flex-col">
        
        {/* HEADER */}
        <div className="px-8 py-6 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Company Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Read-only company information
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
            color="blue"
            icon={<Building2 size={18} />}
          >
            <Info label="Company Name" value={data.company_name} />
            <Info label="PAN Number" value={data.gst_no} />
          </ColoredSection>

          {/* ADDRESS */}
          <ColoredSection
            title="Address Information"
            color="green"
            icon={<MapPin size={18} />}
          >
            <Info
              label="Company Address"
              value={data.company_address}
              full
            />
          </ColoredSection>

          {/* DESCRIPTION */}
          <ColoredSection
            title="Additional Details"
            color="teal"
            icon={<FileText size={18} />}
          >
            <Info
              label="Description"
              value={data.description || "—"}
              full
            />
          </ColoredSection>
        </div>
      </div>

      {/* ANIMATION */}
      <style>{`
        @keyframes slideLeft {
          from {
            transform: translateX(100%);
            opacity: 0.9;
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
};

export default ViewCompanyDrawer;

/* ===================== REUSABLE UI ===================== */

function ColoredSection({ title, icon, color, children }) {
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 border-l-4 border-l-blue-400",
    green: "bg-green-50 border-green-200 border-l-4 border-l-green-400",
    teal: "bg-teal-50 border-teal-200 border-l-4 border-l-teal-400",
  };

  const titleColor = {
    blue: "text-blue-700",
    green: "text-green-700",
    teal: "text-teal-700",
  };

  return (
    <div className={`rounded-2xl p-6 border ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-5">
        <span className={titleColor[color]}>{icon}</span>
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

function Info({ label, value, full = false }) {
  return (
    <div
      className={`flex ${
        full ? "sm:col-span-2" : ""
      } justify-between gap-4`}
    >
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right break-words max-w-[420px]">
        {value || "-"}
      </span>
    </div>
  );
}
