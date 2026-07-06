import React from "react";
import { X, Users, Building2, Layers } from "lucide-react";

export default function ViewReleaseGroupModal({ open, onClose, data }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="bg-white h-screen w-full sm:w-[750px] xl:w-[850px] shadow-2xl animate-slideLeft flex flex-col">
        <div className="px-8 py-6 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Release Group Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete release group information (read only)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6 overflow-y-auto">
          <ColoredSection
            title="Basic Information"
            color="blue"
            icon={<Layers size={18} />}
          >
            <Info label="Group Name" value={data.group_name} />
            <Info label="Department" value={data.group_department} />
            <Info label="Total Users" value={data.users?.length || 0} />
          </ColoredSection>

          <ColoredSection
            title="User & Plant Mapping"
            color="green"
            icon={<Users size={18} />}
          >
            {data.users?.length ? (
              <div className="col-span-2 space-y-4">
                {data.users.map((u, index) => (
                  <div
                    key={index}
                    className="border border-gray-300 rounded-xl p-4 bg-white"
                  >
                    
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-600">User Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {u.users_detail?.full_name} ({u.users_detail?.user_id})
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Plants</p>

                      {u.plants?.length ? (
                        <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
                          {u.plants.map((p) => (
                            <li key={p._id}>
                              <span className="font-medium">
                                {p.plant_name}
                              </span>{" "}
                              <span className="text-gray-500">
                                ({p.plant_code})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No plants assigned
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 col-span-2">
                No users assigned to this group
              </p>
            )}
          </ColoredSection>
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
