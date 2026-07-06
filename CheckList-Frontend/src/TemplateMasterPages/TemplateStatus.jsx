import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Search,
  Loader2,
  Eye,
  X,
  FileText,
  MapPin,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useTemplateMaster } from "../hooks/Template Hooks/useTemplateMaster";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../Components/Pagination/Pagination";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "re-assign", label: "Re-assign" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function formatStatusDisplay(raw) {
  const map = {
    pending: "Pending",
    "in-progress": "In Progress",
    "re-assign": "Re-assign",
    approved: "Approved",
    rejected: "Rejected",
  };
  return map[raw] || raw || "—";
}

function getStatusBadge(status) {
  switch (status) {
    case "approved":
    case "Approved":
      return "bg-green-100 text-green-800";
    case "rejected":
    case "Rejected":
    case "reject":
      return "bg-red-100 text-red-800";
    case "re-assign":
    case "Re-assign":
      return "bg-orange-100 text-orange-800";
    case "in-progress":
    case "In Progress":
      return "bg-blue-100 text-blue-800";
    case "pending":
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

const getDummyTimelineForTemplate = (templateName) => [
  {
    id: 1,
    type: "Logged In",
    letter: "L",
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    time: "Yesterday 10:49 AM",
    detail: "Template",
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

function getWorkflowStatusLabel(status) {
  if (!status) return "Pending";
  const s = String(status).toLowerCase();
  if (s === "approved") return "Approved";
  if (s === "reject") return "Rejected";
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function WorkflowStatusViewModal({
  isOpen,
  onClose,
  templateName,
  myWorkflow,
  WorkFlowDate,
  workflowName,
  ArrayOfWorkFlowData,
  filteredassigenData,
}) {
  const approvalDotRefs = useRef([]);
  const [approvalLineHeights, setApprovalLineHeights] = useState([]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const rafId = requestAnimationFrame(() => {
      const dots = approvalDotRefs.current;
      const heights = dots.map((dot, i) => {
        if (!dot || i === 0 || !dots[i - 1]) return 0;
        const curr = dot.getBoundingClientRect();
        const prev = dots[i - 1].getBoundingClientRect();
        return Math.max(0, curr.top - prev.top);
      });
      setApprovalLineHeights(heights);
    });
    return () => cancelAnimationFrame(rafId);
  }, [filteredassigenData, isOpen]);

  if (!isOpen) return null;

  // Use real workflow steps when available; approval length 0 => status "Pending"
  const workflowSteps =
    Array.isArray(ArrayOfWorkFlowData) && ArrayOfWorkFlowData.length > 0
      ? ArrayOfWorkFlowData
      : [];

  const getStepStatus = (step) => {
    if (!step.approvals || step.approvals.length === 0) return "Pending";
    const first = step.approvals[0];
    const status = first?.status;
    if (!status) return "Pending";
    return getWorkflowStatusLabel(status);
  };

  const getStepStatusBadgeClass = (step) => {
    if (!step.approvals || step.approvals.length === 0)
      return "bg-yellow-100 text-yellow-800";
    const status = (step.approvals[0]?.status || "").toLowerCase();
    if (status === "approved" || status === "approved")
      return "bg-green-100 text-green-800";
    if (status === "reject" || status === "rejected")
      return "bg-red-100 text-red-800";
    if (status === "re-assign") return "bg-orange-100 text-orange-800";
    if (status === "in-progress") return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStepStatusDot = (step) => {
    if (!step.approvals || step.approvals.length === 0)
      return "bg-yellow-400 text-yellow-800";
    const status = (step.approvals[0]?.status || "").toLowerCase();
    if (status === "approved" || status === "approved")
      return "bg-green-400 text-green-800";
    if (status === "reject" || status === "rejected" || status === "Rejected")
      return "bg-red-400 text-red-800";
    if (status === "re-assign") return "bg-orange-100 text-orange-800";
    if (status === "in-progress") return "bg-blue-100 text-blue-800";
    return "bg-gray-400 text-gray-800";
  };
  console.log(workflowSteps);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`
          relative w-full max-w-3xl max-h-[92vh]
          rounded-2xl border border-white/20
          bg-white/80 backdrop-blur-xl shadow-2xl
          transition-all duration-300 scale-100 opacity-100
          flex flex-col overflow-hidden
        `}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/50 bg-white/90 backdrop-blur-md px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Activity Timeline{" "}
              <span className="font-semibold text-gray-600">
                ({workflowName})
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-0.5 font-medium">
              {templateName || "Selected Template"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100/80 hover:text-gray-700"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="flex flex-col gap-8">
            {/* Top: Workflow steps (row with arrows) */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                Workflow Steps
              </h3>
              {workflowSteps.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">
                  No workflow steps to show.
                </p>
              ) : (
                <div className="flex items-center gap-4 overflow-x-auto pb-2">
                  {workflowSteps.map((step, index) => {
                    const stepStatus = getStepStatus(step);
                    const badgeClass = getStepStatusBadgeClass(step);
                    const DotClass = getStepStatusDot(step);
                    const label = step.group_name || step.group || "Stage";
                    const letter = (
                      step.groupDetail?.full_name?.charAt(0) ||
                      label?.charAt(0) ||
                      "?"
                    ).toLowerCase();
                    const isLast = index === workflowSteps.length - 1;

                    return (
                      <div
                        key={`${index}-${label}`}
                        className="flex items-center gap-4"
                      >
                        <div className="min-w-[120px] rounded-xl border border-gray-200/60 bg-white/80 backdrop-blur-sm shadow-sm p-4 transition-all duration-300 hover:shadow-md">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-green-400 text-green-800 text-white font-bold shadow-md`}
                              >
                                {letter}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {label}
                                </p>
                                {step.group_department && (
                                  <p className="text-xs text-gray-500">
                                    {step.group_department}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {!isLast && (
                          <ChevronRight
                            size={24}
                            className="text-gray-400 flex-shrink-0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative pl-12">
              <h3 className="mb-4 text-sm font-bold font-semibold text-gray-700">
                Approvals
              </h3>
              {filteredassigenData.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">
                  No approval steps to show.
                </p>
              ) : (
                filteredassigenData
                  .sort(
                    (a, b) => new Date(a?.createdAt) - new Date(b?.createdAt),
                  )
                  .map((step, index, array) => {
                    const data = step?.createdAt;
                    const date = new Date(data);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const year = date.getFullYear();
                    let hours = date.getHours();
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    const ampm = hours >= 12 ? "pm" : "am";
                    hours = hours % 12 || 12;
                    const formattedWorkflowDate = `${day}-${month}-${year}`;
                    const formattedWorkflowTime = `${hours}:${minutes} ${ampm}`;

                    const isFirst = index === 0;
                    const approval = step?.workflowWithoutApprovals || {};

                    const groupDetail = step?.approved_by_user || {};

                    const stepStatus = step.reassign_status
                      ? "REASSIGNED"
                      : (step.status || "PENDING").toLowerCase();

                    const badgeClass = step.reassign_status
                      ? "bg-orange-100 text-orange-800"
                      : step.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800";

                    const DotClass = step.reassign_status
                      ? "bg-orange-400"
                      : step.status === "approved"
                        ? "bg-green-400"
                        : "bg-red-500";

                    // Get previous step's color for the connecting line
                    const prevStep = index > 0 ? array[index - 1] : null;
                    const LineClass = prevStep
                      ? prevStep.reassign_status
                        ? "bg-orange-400"
                        : prevStep.status === "approved"
                          ? "bg-green-400"
                          : "bg-yellow-400"
                      : DotClass;

                    const approverName = groupDetail?.full_name || "Unknown";
                    const letter = approverName.charAt(0).toLowerCase();
                    const remarks = step?.remarks;
                    const lineHeight = approvalLineHeights[index] || 0;

                    return (
                      <div
                        key={step._id || index}
                        className="relative flex gap-6 pb-12 last:pb-0 group"
                      >
                        <div className="absolute left-0 w-10 h-10 flex items-center justify-center -translate-x-1/2 z-20">
                          <div
                            className={`w-5 h-5 rounded-full ${DotClass} ring-4 ring-white shadow-lg`}
                            ref={(el) => {
                              approvalDotRefs.current[index] = el;
                            }}
                          />
                        </div>

                        {!isFirst && lineHeight > 0 && (
                          <div
                            className={`absolute w-1 ${LineClass} z-10 rounded-full -translate-x-1/2`}
                            style={{
                              top: `-${lineHeight - 15}px`,
                              left: "0",
                              height: `${lineHeight}px`,
                            }}
                          />
                        )}

                        <div className="w-28 flex-shrink-0 text-right pt-2">
                          <p className="text-xs font-medium text-gray-500">
                            {formattedWorkflowDate}
                          </p>
                          <p className="text-sm font-semibold text-gray-700">
                            {formattedWorkflowTime}
                          </p>
                        </div>

                        <div className="flex-1 rounded-xl border border-gray-200/60 bg-white/80 backdrop-blur-sm shadow-sm p-5 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-0.5 group-hover:border-blue-200/50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-lg ${DotClass} text-white font-bold shadow-md`}
                              >
                                {letter}
                              </div>

                              <div>
                                <p className="font-semibold text-gray-800">
                                  {approverName}
                                </p>

                                <div className="flex flex-col gap-1">
                                  {approval?.group_name && (
                                    <p className="text-xs text-gray-400 font-medium">
                                      Group: {approval.group_name}
                                    </p>
                                  )}

                                  {groupDetail?.desigination && (
                                    <p className="text-xs text-gray-500 font-medium">
                                      Designation: {groupDetail.desigination}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
                            >
                              {stepStatus}
                            </span>
                          </div>

                          <div className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                            <FileText
                              size={14}
                              className="mt-0.5 flex-shrink-0 text-gray-500"
                            />
                            <p className="text-sm text-gray-700">
                              <span className="text-gray-600">Remarks: </span>
                              {remarks ? (
                                remarks
                              ) : (
                                <span className="italic text-gray-400">
                                  No remarks found
                                </span>
                              )}
                            </p>
                          </div>

                          {step.reassign_status && (
                            <p className="mt-2 text-xs font-medium text-orange-600">
                              Reassigned to user ID:{" "}
                              {step?.reassignUser?.full_name} (
                              {step?.reassignUser?.user_id})
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineViewModal({ isOpen, onClose, templateName }) {
  if (!isOpen) return null;

  const timeline = getDummyTimelineForTemplate(templateName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-3xl max-h-[92vh]
          rounded-2xl border border-white/20
          bg-white/80 backdrop-blur-xl shadow-2xl
          transition-all duration-300 scale-100 opacity-100
          flex flex-col overflow-hidden
        `}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/50 bg-white/90 backdrop-blur-md px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Activity Timeline
            </h2>
            <p className="text-sm text-gray-600 mt-0.5 font-medium">
              {templateName || "Selected Template"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100/80 hover:text-gray-700 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="relative pl-12">
            {timeline.map((event, index) => {
              const isFirst = index === 0;
              const isLast = index === timeline.length - 1;

              return (
                <div
                  key={event.id}
                  className="relative flex gap-6 pb-12 last:pb-0 group"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-0 w-10  h-10 flex items-center justify-center -translate-x-1/2 z-20">
                    <div
                      className={`w-5 h-5 rounded-full ${event.color} ring-4 ring-white shadow-lg group-hover:ring-blue-100/50 transition-all duration-300`}
                    />
                  </div>

                  {/* Vertical colored line - connects PREVIOUS dot to CURRENT dot */}
                  {!isFirst && (
                    <div
                      className={`absolute  w-1 ${event.color}  z-10 rounded-full`}
                      style={{
                        // Start from center of previous dot
                        top: "-160px",
                        // Go all the way to center of current dot
                        height: "calc(100% + 60px)",
                        // Use the COLOR OF THE CURRENT DOT (the one below)
                        // background: event.color.replace("bg-", ""),
                        // Optional: nice gradient effect
                        // background: `linear-gradient(to bottom, ${event.color.replace("bg-", "")}cc, ${event.color.replace("bg-", "")}66)`,
                      }}
                    />
                  )}

                  {/* Time Label */}
                  <div className="w-28 flex-shrink-0 text-right pt-2">
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
                      bg-white/80 backdrop-blur-sm shadow-sm
                      p-5 transition-all duration-300
                      group-hover:shadow-md group-hover:-translate-y-0.5
                      group-hover:border-blue-200/50 whitespace-nowrap
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${event.color} text-white font-bold shadow-md`}
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
                    </div>

                    {event.address && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                        <MapPin
                          size={16}
                          className="mt-0.5 flex-shrink-0 text-gray-500"
                        />
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplateStatus() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const { value: debouncedSearch } = useDebounce(searchQuery, 500);

  const {
    getTemplateStatusData,
    workflowStatusQuery,
    templateStatusListQuery,
  } = useTemplateMaster(
    "",
    selectedRow?.template_data?._id ?? null,
    selectedRow?.user_id ?? null,
    { page, search: debouncedSearch, status: statusFilter },
  );

  const response = getTemplateStatusData?.data;
  const tableData = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];
  const pagination = response?.pagination ?? response?.data?.pagination ?? {};
  const hasNextPage = Boolean(pagination?.hasNextPage);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const workflowData = workflowStatusQuery.data;

  const statusList = Array.isArray(templateStatusListQuery.data)
    ? templateStatusListQuery.data
    : Array.isArray(templateStatusListQuery.data)
      ? templateStatusListQuery.data
      : [];

  const selectedAssignment = statusList.find(
    (item) => item?._id === selectedRow?._id,
  );

  const filteredassigenData = Array.isArray(
    selectedAssignment?.mapWorkFlowApproval,
  )
    ? selectedAssignment?.mapWorkFlowApproval
    : Array.isArray(selectedAssignment?.approval)
      ? selectedAssignment?.approval
      : [];

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-full px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Template Status
        </h1>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by template, type, status, user, user ID, email, workflow..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[160px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {getTemplateStatusData.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : getTemplateStatusData.isError ? (
            <div className="px-8 py-12 text-center text-red-600">
              {getTemplateStatusData.error?.response?.data?.message ||
                getTemplateStatusData.error?.message ||
                "Failed to load template status data."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 whitespace-nowrap">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold  tracking-wider text-gray-700">
                      Template Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold  tracking-wider text-gray-700">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold  tracking-wider text-gray-700">
                      Assigned User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold  tracking-wider text-gray-700">
                      Plant Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold  tracking-wider text-gray-700">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold  tracking-wider text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold  tracking-wider text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold  tracking-wider text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tableData?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-gray-500"
                      >
                        No records found. Try a different search or status
                        filter.
                      </td>
                    </tr>
                  ) : (
                    tableData?.map((r) => (
                      <tr key={r?._id} className="hover:bg-gray-50 ">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {r?.template_data?.template_name || "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {r?.template_data?.template_type || "—"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {r.user?.full_name || "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {r.plant?.plant_name || "—"} ({r.plant?.plant_code})
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {r?.user?.user_id || "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {r?.user?.email || "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge?.(r.template_status) || "bg-gray-100 text-gray-800"}`}
                          >
                            {formatStatusDisplay?.(
                              r.template_status || "pending",
                            ) || "Pending"}

                            {console.log("this is my status", r)}
                            {/* { r.template_status === "rejected" ?(""): "no datra "} */}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedRow(r);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <WorkflowStatusViewModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  setSelectedRow(null);
                }}
                filteredassigenData={filteredassigenData}
                templateName={selectedRow?.template_data?.template_name ?? "—"}
                WorkFlowDate={
                  selectedRow?.template_data?.workflow?.createdAt ?? "-"
                }
                myWorkflow={selectedRow?.template_data?.workflow}
                workflowName={selectedRow?.template_data?.workflow?.name ?? "—"}
                ArrayOfWorkFlowData={
                  selectedRow?.template_data?.workflow?.workflow ?? "-"
                }
                chain={workflowData?.chain ?? []}
                isLoading={workflowStatusQuery.isLoading}
                isError={workflowStatusQuery.isError}
                errorMessage={
                  workflowStatusQuery.error?.response?.data?.message ||
                  workflowStatusQuery.error?.message ||
                  "Failed to load workflow details."
                }
              />
            </div>
          )}
        </div>
        {tableData?.length > 0 && (
          <Pagination
            page={page}
            setPage={setPage}
            hasNextpage={tableData?.length === 10}
          />
        )}
      </div>
    </div>
  );
}
