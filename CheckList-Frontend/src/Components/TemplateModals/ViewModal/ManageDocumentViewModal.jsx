import React from "react";
import { X, FileText, Folder, Calendar, Paperclip } from "lucide-react";

export default function ViewDocumentModal({ open, onClose, data }) {
  if (!open || !data) return null;
 
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      {/* PANEL */}
      <div className="bg-white h-screen w-full sm:w-[750px] xl:w-[850px] shadow-2xl animate-slideLeft flex flex-col">
        {/* HEADER */}
        <div className="px-8 py-6 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Document Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete document information (read only)
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
            title="Document Information"
            color="blue"
            icon={<FileText size={18} />}
          >
            <Info label="Document Name" value={data.doc_name} />
            {/* <Info label="Status" value={data.status} /> */}
          </ColoredSection>

          {/* CATEGORY */}
          <ColoredSection
            title="Category"
            color="green"
            icon={<Folder size={18} />}
          >
            <Info label="Category Name" value={data.category} />
            <Info label="Department" value={data.depart_name} />
          </ColoredSection>

          {/* EXPIRY */}
          <ColoredSection
            title="Expiry Details"
            color="teal"
            icon={<Calendar size={18} />}
          >
            <Info
              label="Expiry Date"
              value={new Date(data.expiry).toLocaleDateString("en-GB")}
            />
          </ColoredSection>

          {/* ATTACHMENT */}
          <ColoredSection
            title="Attached Document"
            color="purple"
            icon={<Paperclip size={18} />}
          >
            {data.attached_doc ? (
              <div className="col-span-2">
                <a
                  href={data.attached_doc}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
                >
                  <Paperclip size={16} />
                  View
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500 col-span-2">
                No document attached
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
    purple: "bg-purple-50 border-l-4 border-purple-400",
  };

  const titleColor = {
    blue: "text-blue-700",
    green: "text-green-700",
    teal: "text-teal-700",
    purple: "text-purple-700",
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
