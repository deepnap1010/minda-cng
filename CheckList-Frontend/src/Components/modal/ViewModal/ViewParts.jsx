import React from "react";
import { X, Hash, Package, Layers, Calendar } from "lucide-react";

export default function ViewPartsModal({ open, onClose, data }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      {/* PANEL */}
      <div className="bg-white h-screen w-full sm:w-[750px] xl:w-[850px] shadow-2xl animate-slideLeft flex flex-col">
        
        {/* HEADER */}
        <div className="px-8 py-6 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Part Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete part information (read only)
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

          {/* BASIC INFO */}
          <ColoredSection
            title="Basic Information"
            color="blue"
            icon={<Package size={18} />}
          >
            <Info label="Part Name" value={data.part_name} />
            <Info label="Part Number" value={data.part_number} />
            <Info label="Material Code" value={data.material_code} />
            <Info label="Total Assemblies" value={data.integration_count
} />
          </ColoredSection>

          {/* ASSEMBLIES */}
          <ColoredSection
            title="Assemblies"
            color="green"
            icon={<Layers size={18} />}
          >
            {data.assemblies_used?.length ? (
              <div className="col-span-2">
                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100 text-green-800">
                      <tr>
                        <th className="px-4 py-2 text-left">
                          Assembly Name
                        </th>
                        <th className="px-4 py-2 text-left">
                          Assembly Number
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.assemblies_used?.map((asm) => (
                        <tr key={asm._id} className="border-t border-gray-300">
                          <td className="px-4 py-2">
                            {asm.assembly_name}
                          </td>
                          <td className="px-4 py-2">
                            {asm.assembly_number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 col-span-2">
                No assemblies linked
              </p>
            )}
          </ColoredSection>

          {/* METADATA
          <ColoredSection
            title="Metadata"
            color="teal"
            icon={<Calendar size={18} />}
          >
            <Info
              label="Created At"
              value={new Date(data.createdAt).toLocaleString()}
            />
            <Info
              label="Updated At"
              value={new Date(data.updatedAt).toLocaleString()}
            />
          </ColoredSection> */}
        </div>
      </div>

      {/* SLIDE ANIMATION */}
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
}

/* ================= REUSABLE UI ================= */

function ColoredSection({ title, icon, color, children }) {
  const colorMap = {
    blue: "bg-blue-50 border-l-4 border-blue-400",
    green: "bg-green-50 border-l-4 border-green-400",
    teal: "bg-teal-50 border-l-4 border-teal-400",
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
