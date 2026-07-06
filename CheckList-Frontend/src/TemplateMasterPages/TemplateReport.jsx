import React, { useState } from "react";
import { useTemplateSubmission } from "../hooks/Template Hooks/useTemplateSubmission";
import {
  CheckCircle, Clock, XCircle, FileText, Search, Eye,
  User, Building, Calendar, Shield, RotateCcw, GitBranch,
} from "lucide-react";
import Pagination from "../Components/Pagination/Pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-emerald-500","bg-blue-500","bg-violet-500",
  "bg-rose-500","bg-amber-500","bg-teal-500","bg-cyan-500","bg-pink-500",
];
const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];
const getInitial  = (name = "") => name.charAt(0).toUpperCase();
const formatDate  = (iso) => iso ? new Date(iso).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : null;

// ─── Build parent-child tree from assigned_fields ─────────────────────────────
const buildParentGroups = (assignedFields = []) => {
  const idToNode = {};
  assignedFields.forEach((f) => { if (f?._id) idToNode[f._id] = { ...f, children: [] }; });
  const roots = [];
  assignedFields.forEach((f) => {
    if (!f?._id) return;
    if (f.parent_id && idToNode[f.parent_id]) idToNode[f.parent_id].children.push(idToNode[f._id]);
    else roots.push(idToNode[f._id]);
  });
  const sort = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
  roots.sort(sort);
  roots.forEach((r) => r.children?.sort(sort));
  return roots;
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, processApproved }) => {
  const cfg = {
    SUBMITTED: { bg: processApproved ? "bg-green-100" : "bg-blue-100", text: processApproved ? "text-green-700" : "text-blue-700", icon: processApproved ? CheckCircle : Clock, label: processApproved ? "Approved" : "Submitted" },
    DRAFT:     { bg: "bg-gray-100",  text: "text-gray-700",  icon: Clock,    label: "Draft"    },
    REJECTED:  { bg: "bg-red-100",   text: "text-red-700",   icon: XCircle,  label: "Rejected" },
  }[status] || { bg: "bg-gray-100", text: "text-gray-700", icon: Clock, label: status };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${cfg.bg} ${cfg.text} px-3 py-1 text-xs font-medium`}>
      <Icon size={13} />{cfg.label}
    </span>
  );
};

// ─── Workflow Timeline ────────────────────────────────────────────────────────
// approvals = [{ approved_by, current_stage, createdAt, status, remarks, approvedBy: { full_name, user_id } }]
const WorkflowTimeline = ({ submission }) => {
  const approvals = submission?.approvals || [];
  if (!approvals.length) return null;

  // sort by current_stage asc
  const sorted = [...approvals].sort((a, b) => a.current_stage - b.current_stage);

  // HOD is stage 0 (user's hod), rest are approvers
  const hod = submission?.user?.hod;

  // Stage label helper
  const stageLabel = (stage) => {
    if (stage === 0) return "HOD";
    return `Approver ${stage}`;
  };

  const approvedCount = sorted.filter(a => a.status === "approved").length;
  const total = sorted.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-slate-500" />
          <p className="text-sm font-bold text-slate-700">Approval Workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">{approvedCount}/{total} approved</span>
          {/* mini progress */}
          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${total > 0 ? (approvedCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 py-4">
        {sorted.map((approval, i) => {
          const isLast  = i === sorted.length - 1;
          const name    = approval.approvedBy?.full_name || "—";
          const userId  = approval.approvedBy?.user_id   || "";
          const status  = approval.status || "pending";
          const dotColor =
            status === "approved"   ? "#10b981" :
            status === "rejected"   ? "#ef4444" :
            status === "reassigned" ? "#8b5cf6" : "#f59e0b";
          const badgeCfg =
            status === "approved"   ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
            status === "rejected"   ? "bg-red-100 text-red-700 border-red-200" :
            status === "reassigned" ? "bg-violet-100 text-violet-700 border-violet-200" :
                                      "bg-amber-100 text-amber-700 border-amber-200";
          const BadgeIcon =
            status === "approved"   ? CheckCircle :
            status === "rejected"   ? XCircle     :
            status === "reassigned" ? RotateCcw   : Clock;

          return (
            <div key={i} className="flex gap-4">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center pt-1">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md flex-shrink-0 z-10"
                  style={{ background: dotColor }}
                />
                {!isLast && (
                  <div
                    className="w-0.5 flex-1 mt-1 min-h-[2rem]"
                    style={{ background: `linear-gradient(to bottom, ${dotColor}70, #e2e8f0)` }}
                  />
                )}
              </div>

              {/* Card */}
              <div className={`flex-1 mb-4 rounded-2xl border bg-white shadow-sm overflow-hidden ${
                status === "approved" ? "border-emerald-100" :
                status === "rejected" ? "border-red-100"     : "border-slate-200"
              }`}>
                {/* Card top row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl ${avatarColor(i)} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>
                      {getInitial(name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 capitalize">{name}</p>
                      <p className="text-xs text-slate-500">
                        ID: {userId}
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="font-medium text-slate-600">{stageLabel(approval.current_stage)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeCfg}`}>
                    <BadgeIcon size={11} />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>

                {/* Date + Remarks */}
                <div className="px-4 pb-3 border-t border-slate-50 space-y-2 pt-2.5">
                  {/* Date */}
                  {approval.createdAt && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar size={11} />
                      {formatDate(approval.createdAt)}
                    </div>
                  )}
                  {/* Remarks */}
                  {approval.remarks ? (
                    <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                      <FileText size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">Remarks</p>
                        <p className="text-sm text-slate-700">{approval.remarks}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No remarks</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── View Modal ───────────────────────────────────────────────────────────────
const ViewModal = ({ submission, onClose }) => {
  if (!submission) return null;

  const formData      = submission.form_data || {};
  const assignedFields = submission.assigned_fields || [];
  const allGroups     = buildParentGroups(assignedFields);

  // Approvals ko stage wise map banao
const approvalsByStage = {};
(submission.approvals || []).forEach((a) => {
  approvalsByStage[a.current_stage] = a;
});

const approverNames = (submission.approvals || [])
  .filter(a => a.current_stage > 0)  
  .map(a => a.approvedBy?.full_name || "Approver")
  .join(", ");

const fillerNameMap = {
  User:     submission.user?.full_name 
              ? `${submission.user.full_name} (${submission.user.user_id})` 
              : "User",
  HOD:      submission.user?.hod?.full_name 
              ? `${submission.user.hod.full_name} (${submission.user.hod.user_id || "—"})` 
              : "HOD",
  Approval: approverNames || "Approver",
};
console.log(submission.approvals[0])
console.log("rokflow",submission.workflow) 
  const fillerBadge = {
    User:     { bg: "bg-blue-100",  text: "text-blue-700"  },
    HOD:      { bg: "bg-amber-100", text: "text-amber-700" },
    Approval: { bg: "bg-teal-100",  text: "text-teal-700"  },
  };

  const countRows = (cols) => {
    let max = -1;
    cols.forEach((f) => {
      if (formData[f._id] !== undefined && formData[f._id] !== null && formData[f._id] !== "") max = Math.max(max, 0);
      Object.keys(formData).forEach((k) => {
        if (k.startsWith(`${f._id}_`) && /^\d+$/.test(k.slice(f._id.length + 1)))
          max = Math.max(max, parseInt(k.slice(f._id.length + 1), 10) + 1);
      });
    });
    return max < 0 ? 1 : max + 1;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              {submission.template?.template_name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Submission ID: {submission.submission_id} · {submission.template?.template_type}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <XCircle size={24} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">

          {/* Meta cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700 mb-2"><User size={15} /><span className="text-xs font-semibold">Submitted By</span></div>
              <p className="text-sm font-semibold text-gray-900">{submission.user?.full_name}</p>
              <p className="text-xs text-gray-500">{submission.user?.email}</p>
              <p className="text-xs text-gray-400">ID: {submission.user?.user_id}</p>
              <p className="text-xs text-gray-400">Role: {submission.user?.userRole?.name || "—"}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 shadow-sm">
              <div className="flex items-center gap-2 text-amber-700 mb-2"><Shield size={15} /><span className="text-xs font-semibold">HOD</span></div>
              {submission.user?.hod?.full_name
                ? <><p className="text-sm font-semibold text-gray-900">{submission.user.hod.full_name}</p><p className="text-xs text-gray-400">ID: {submission.user.hod.user_id || "—"}</p></>
                : <p className="text-sm text-gray-400 italic">Not assigned</p>
              }
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center gap-2 text-purple-700 mb-2"><Building size={15} /><span className="text-xs font-semibold">Plant</span></div>
              <p className="text-sm font-semibold text-gray-900">{submission.plant?.plant_name}</p>
              <p className="text-xs text-gray-500">Code: {submission.plant?.plant_code}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 text-green-700 mb-2"><Calendar size={15} /><span className="text-xs font-semibold">Submitted At</span></div>
              <p className="text-sm font-semibold text-gray-900">{new Date(submission.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-gray-500">{new Date(submission.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>

          {/* ── Workflow Timeline ── */}
          <WorkflowTimeline submission={submission} />

          {/* ── Form Data Table ── */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Submitted Form Data</h3>
            {allGroups.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No data submitted</p>
            ) : (
              <div className="space-y-4">
                {allGroups.map((group) => {
                  const cols = [group, ...(group.children || [])].filter((f) => f?._id);
                  if (!cols.length) return null;
                  const rowCount = countRows(cols);
                  if (rowCount === 0) return null;
                  return (
                    <div key={group._id} className="rounded-2xl border border-indigo-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-indigo-100/60 text-indigo-800">
                              {rowCount > 1 && <th className="px-3 py-2 text-left font-semibold border-b border-indigo-200 w-10">#</th>}
                              {cols.map((f) => {
                                const type  = f.type || "User";
                                const badge = fillerBadge[type] || fillerBadge.User;
                                const name  = fillerNameMap[type] || type;
                                return (
                                  <th key={f._id} className="px-3 py-2 text-left font-semibold border-b border-indigo-200">
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                      <span>{f.field_name}</span>
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                                        <User size={9} />{name}
                                      </span>
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: rowCount }).map((_, rowIdx) => {
                              const suffix = rowIdx === 0 ? "" : `_${rowIdx - 1}`;
                              return (
                                <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-indigo-50/30"}>
                                  {rowCount > 1 && <td className="px-3 py-2 text-xs text-slate-400 border-t border-indigo-100">{rowIdx + 1}</td>}
                                  {cols.map((f) => {
                                    const val = formData[`${f._id}${suffix}`];
                                    return (
                                      <td key={f._id + suffix} className="px-3 py-2 border-t border-indigo-100 text-gray-900">
                                        {val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : "—"}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const TemplateReport = () => {
  const [page, setPage] = useState(1);
  const { getAllSubmissionData } = useTemplateSubmission("", "", page);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const submissions = getAllSubmissionData?.data || [];

  const filteredSubmissions = submissions.filter((s) => {
    const t = searchTerm.toLowerCase();
    return (
      s.template?.template_name?.toLowerCase().includes(t) ||
      s.user?.full_name?.toLowerCase().includes(t) ||
      s.user?.user_id?.toLowerCase().includes(t) ||
      s.user?.userRole?.name?.toLowerCase().includes(t) ||
      s.user?.hod?.full_name?.toLowerCase().includes(t) ||
      s.plant?.plant_name?.toLowerCase().includes(t)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        <div className="mb-6 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-lg">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Template Report</h1>
          <p className="mt-2 text-sm text-gray-700">View and manage all template form submissions</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-5 mb-6">
          <label className="block text-sm font-semibold text-blue-700 mb-2">
            <Search className="inline mr-2" size={16} />Search
          </label>
          <input
            type="text"
            placeholder="Search by template, user, HOD or plant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-blue-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all"
          />
          <p className="mt-3 text-sm font-semibold text-blue-600">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </p>
        </div>

        {getAllSubmissionData?.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600">{searchTerm ? "Try adjusting your search" : "No form submissions yet"}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 whitespace-nowrap">
                <thead className="bg-gradient-to-r from-blue-500 to-indigo-500">
                  <tr>
                    {["Submission Id","Template","Type","Submitted By","Role","HOD","Plant","Status","Date","Actions"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-white tracking-wider last:text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission, index) => (
                    <tr key={submission._id} className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50/20"} hover:bg-blue-50 transition-colors`}>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{submission?.submission_id || "N/A"}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{submission.template?.template_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{submission.template?.template_type}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{submission.user?.full_name} ({submission.user?.user_id})</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{submission.user?.userRole?.name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {submission.user?.hod?.full_name ? `${submission.user.hod.full_name} (${submission.user.hod.user_id || "—"})` : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{submission.plant?.plant_name} ({submission.plant?.plant_code})</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={submission.status} processApproved={submission.process_approved} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{new Date(submission.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(submission.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => { setSelectedSubmission(submission); setIsViewModalOpen(true); }}
                          className="inline-flex items-center p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-md transition-all"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isViewModalOpen && (
        <ViewModal
          submission={selectedSubmission}
          onClose={() => { setIsViewModalOpen(false); setSelectedSubmission(null); }}
        />
      )}

      <Pagination page={page} setPage={setPage} hasNextpage={submissions?.length === 10} />
    </div>
  );
};

export default TemplateReport;