import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import {
  X,
  Eye,
  FileText,
  MapPin,
  Loader2,
  Sparkles,
  Clock,
  Calendar,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Demo Data (same as yours)
// ──────────────────────────────────────────────────────────────
const DEMO_CARD = {
  _id: "demo",
  template_name: "Demo Template (Activity Timeline)",
  template_type: "DEMO",
  isDemo: true,
};

const getDummyTimelineForTemplate = (templateName) => [
  {
    id: 1,
    type: "Logged In",
    letter: "L",
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    time: "Yesterday 10:49 AM",
    detail: templateName || "Template",
    subDetail: "Deepnap Softech",
    hasNotes: true,
   
  },
  {
    id: 2,
    type: "Waiting",
    letter: "W",
    color: "bg-amber-500",
    textColor: "text-amber-600",
    time: "Yesterday 01:46 PM",
    detail: "Waiting - 2hrs 56m",
    address: "4A, HSIDC, Sector 31, Faridabad, Haryana 121003, India",
    timeRange: "(Yesterday 10:49 AM - Yesterday 01:46 PM)",
  },
  {
    id: 3,
    type: "Waiting",
    letter: "W",
    color: "bg-amber-500",
    textColor: "text-amber-600",
    time: "Yesterday 02:38 PM",
    detail: "Waiting - 23 mins",
    address:
      "88JX+99W, IMT Main Rd, Sector 69, Faridabad, Haryana 121004, India",
    timeRange: "(Yesterday 02:15 PM - Yesterday 02:38 PM)",
  },
  {
    id: 4,
    type: "Waiting",
    letter: "W",
    color: "bg-amber-500",
    textColor: "text-amber-600",
    time: "Yesterday 02:45 PM",
    detail: "Waiting - 5 mins",
    address: "62, Sector 59, Faridabad, Haryana 121004, India",
    timeRange: "(Yesterday 02:40 PM - Yesterday 02:45 PM)",
  },
  {
    id: 5,
    type: "Checked In",
    letter: "C",
    color: "bg-sky-500",
    textColor: "text-sky-600",
    time: "Yesterday 03:02 PM",
    detail: "Checked In",
    address:
      "11/12 Chawla Colony, Ballabhgarh, Faridabad, Haryana 121004, India",
    hasNotes: true,
   
    hasInfo: true,
  },
  {
    id: 6,
    type: "Checked Out",
    letter: "C",
    color: "bg-sky-500",
    textColor: "text-sky-600",
    time: "Yesterday 03:07 PM",
    detail: "Checked Out",
    address:
      "11/12 Chawla Colony, Ballabhgarh, Faridabad, Haryana 121004, India",
   
  },
];

// ──────────────────────────────────────────────────────────────
// Enhanced Timeline Modal
// ──────────────────────────────────────────────────────────────
function TimelineViewModal({ isOpen, onClose, template }) {
  if (!isOpen) return null;

  const timeline = getDummyTimelineForTemplate(template?.template_name);
  const isDemo = template?.isDemo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={`
          relative w-full max-w-3xl max-h-[92vh] 
          rounded-2xl border border-white/20 
          bg-white/80 backdrop-blur-xl shadow-2xl
          transition-all duration-300
          ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}
          flex flex-col          // <-- Important: flex column layout
          overflow-hidden        // Keep this on outer container
        `}
      >
        {/* Header - always sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/50 bg-white/90 backdrop-blur-md px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Activity Timeline
            </h2>
            <p className="text-sm text-gray-600 mt-0.5 font-medium">
              {template?.template_name || "Selected Template"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100/80 hover:text-gray-700 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="relative pl-10">
            {/* Vertical line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-300 via-gray-200 to-gray-300" />

            {timeline.map((event, index) => (
              <div
                key={event.id}
                className="relative flex gap-6 pb-10 last:pb-0 group"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 w-10 h-10 flex items-center justify-center -translate-x-1/2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${event.color} ring-4 ring-white shadow-md group-hover:ring-blue-100 transition-all duration-300`}
                  />
                </div>

                {/* Time label */}
                <div className="w-28 flex-shrink-0 text-right pt-1.5">
                  <p className="text-xs font-medium text-gray-500">
                    {event.time.split(" ")[0]}
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {event.time.split(" ").slice(1).join(" ")}
                  </p>
                </div>

                {/* Event Card */}
                <div
                  className={`
                    flex-1 rounded-xl border border-gray-200/60 
                    bg-white/70 backdrop-blur-sm shadow-sm 
                    p-4 transition-all duration-300
                    group-hover:shadow-md group-hover:-translate-y-0.5
                    group-hover:border-blue-200/50
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${event.color} text-white font-bold shadow-sm`}
                      >
                        {event.letter}
                      </div>
                      <div>
                        <span className={`font-semibold ${event.textColor}`}>
                          {event.detail}
                        </span>
                        {event.subDetail && (
                          <p className="text-sm text-gray-600 mt-0.5">
                            {event.subDetail}
                          </p>
                        )}
                      </div>
                    </div>

                    {event.badge && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {event.badge}
                      </span>
                    )}
                  </div>

                  {event.address && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-500" />
                      <span>{event.address}</span>
                    </div>
                  )}

                  {event.timeRange && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={14} />
                      <span>{event.timeRange}</span>
                    </div>
                  )}

                  {event.hasNotes && (
                    <button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                      <FileText size={14} />
                      View Notes
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Enhanced Template Card
// ──────────────────────────────────────────────────────────────
function TemplateCard({ template, onView }) {
  const isDemo = template?.isDemo;
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
        isDemo
          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {template.template_name}
            </h3>
            {isDemo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Sparkles size={12} />
                Demo
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {template.template_type || "—"}
          </p>
          {!isDemo && template.workflow?.workflow_name && (
            <p className="mt-1 text-xs text-gray-400">
              Workflow: {template.workflow.workflow_name}
            </p>
          )}
          {isDemo && (
            <p className="mt-1 text-xs text-amber-600">
              Click View to see activity timeline (Logged In, Waiting, Checked
              In/Out)
            </p>
          )}
        </div>
        <button
          onClick={() => onView(template)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Eye size={16} />
          View
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
export default function TemplateModuleHistory() {
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["template-master", "templates"],
    queryFn: async () => {
      const res = await axiosHandler.get("/template-master/templates");
      return res?.data?.data || [];
    },
  });

  const handleView = (template) => {
    setViewingTemplate(template);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setViewingTemplate(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-3 text-white shadow-lg">
              <Calendar size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Template Activity History
              </h1>
              <p className="mt-2 text-gray-600">
                Track usage, check-ins, waiting times and activity timeline for
                every template
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <TemplateCard key="demo" template={DEMO_CARD} onView={handleView} />

          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="flex items-center gap-3 rounded-xl bg-white/80 px-6 py-4 shadow-md">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <span className="text-gray-700 font-medium">
                  Loading templates...
                </span>
              </div>
            </div>
          ) : (
            templates.map((t) => (
              <TemplateCard key={t._id} template={t} onView={handleView} />
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <TimelineViewModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        template={viewingTemplate}
      />
    </div>
  );
}
