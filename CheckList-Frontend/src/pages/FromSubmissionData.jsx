import React, { useState } from "react";
import { useTemplateSubmission } from "../hooks/Template Hooks/useTemplateSubmission";
import {
  Eye,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  User,
  Building,
  Calendar,
  Filter,
  Search,
  Download,
} from "lucide-react";
import Pagination from "../Components/Pagination/Pagination";
import { useFormik } from "formik";

const FormSubmissionData = () => {
  const [page, setPage] = useState(1);
  const { getAllSubmissionData } = useTemplateSubmission("", "", page);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const submissions = getAllSubmissionData?.data || [];

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.template?.template_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.user?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.plant?.plant_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const StatusBadge = ({ status, processApproved }) => {
    const statusConfig = {
      SUBMITTED: {
        bg: processApproved ? "bg-green-100" : "bg-blue-100",
        text: processApproved ? "text-green-700" : "text-blue-700",
        icon: processApproved ? CheckCircle : Clock,
        label: processApproved ? "Approved" : "Submitted",
      },
      DRAFT: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: Clock,
        label: "Draft",
      },
      REJECTED: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: XCircle,
        label: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-medium`}
      >
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const buildParentGroups = (assignedFields) => {
    if (!Array.isArray(assignedFields) || !assignedFields.length) return [];
    const idToNode = {};
    assignedFields.forEach((f) => {
      if (f?._id) idToNode[f._id] = { ...f, children: [] };
    });
    const roots = [];
    assignedFields.forEach((f) => {
      if (!f?._id) return;
      const node = idToNode[f._id];
      if (f.parent_id && idToNode[f.parent_id]) {
        idToNode[f.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    });
    const sortByOrder = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
    roots.sort(sortByOrder);
    roots.forEach((r) => {
      if (Array.isArray(r.children)) r.children.sort(sortByOrder);
    });
    return roots;
  };

  const ViewModal = ({ submission, onClose }) => {
    if (!submission) return null;

    const formData = submission.form_data || submission.filled_data || {};
    const assignedFields = submission.assigned_fields || [];
   
    const viewParentGroups = buildParentGroups(assignedFields);
    const entries = Object.entries(formData);
    const hasData = entries.length > 0;

    const renderFormDataSection = () => {
      if (!hasData) {
        return (
          <p className="text-sm text-gray-500 italic">No data submitted</p>
        );
      }

      if (viewParentGroups.length === 0) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4"
              >
                <p className="text-xs font-semibold text-indigo-600 mb-1">
                  {key.includes("~") ? key.split("~")[0] : key} :
                  <span className="text-sm pl-2 font-medium text-gray-900">
                    {value !== undefined && value !== null ? String(value) : "—"}
                  </span>
                </p>
              </div>
            ))}
          </div>
        );
      }

      const groupTables = [];
      viewParentGroups.forEach((group) => {
        const cols = [
          group,
          ...(Array.isArray(group.children) ? group.children : []),
        ].filter((f) => f && f._id);
        if (!cols.length) return;

        let maxRowIndex = -1;
        cols.forEach((f) => {
          const id = f._id;
          if (formData[id] !== undefined && formData[id] !== null && formData[id] !== "")
            maxRowIndex = Math.max(maxRowIndex, 0);
          Object.keys(formData).forEach((k) => {
            if (k.startsWith(`${id}_`) && /^\d+$/.test(k.slice(id.length + 1)))
              maxRowIndex = Math.max(maxRowIndex, parseInt(k.slice(id.length + 1), 10) + 1);
          });
        });
        const rowCount = maxRowIndex < 0 ? 0 : maxRowIndex + 1;
        if (rowCount === 0) return;

        groupTables.push(
          <div
            key={group._id}
            className="rounded-2xl border border-indigo-100 bg-indigo-50/40 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-indigo-100/60 text-indigo-800">
                    {cols.map((f) => (
                      <th
                        key={f._id}
                        className="px-3 py-2 text-left font-semibold border-b border-indigo-200"
                      >
                        {f.field_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: rowCount }).map((_, rowIdx) => {
                    const suffix = rowIdx === 0 ? "" : `_${rowIdx - 1}`;
                    return (
                      <tr
                        key={rowIdx}
                        className={
                          rowIdx % 2 === 0 ? "bg-white" : "bg-indigo-50/30"
                        }
                      >
                        {cols.map((f) => {
                          const key = `${f._id}${suffix}`;
                          const val = formData[key];
                          const display =
                            val !== undefined &&
                            val !== null &&
                            String(val).trim() !== ""
                              ? String(val)
                              : "—";
                          return (
                            <td
                              key={key}
                              className="px-3 py-2 border-t border-indigo-100 text-gray-900"
                            >
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>,
        );
      });

      if (groupTables.length === 0) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4"
              >
                <p className="text-xs font-semibold text-indigo-600 mb-1">
                  {key.includes("~") ? key.split("~")[0] : key} :
                  <span className="text-sm pl-2 font-medium text-gray-900">
                    {value !== undefined && value !== null ? String(value) : "—"}
                  </span>
                </p>
              </div>
            ))}
          </div>
        );
      }
      return <div className="space-y-6">{groupTables}</div>;
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl m-4">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {submission.template?.template_name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Submission Details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <User size={18} />
                  <span className="text-sm font-semibold">Submitted By</span>
                </div>
                <p className="text-gray-900 font-medium">
                  {submission.user?.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  {submission.user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  ID: {submission.user?.user_id}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <Building size={18} />
                  <span className="text-sm font-semibold">Plant</span>
                </div>
                <p className="text-gray-900 font-medium">
                  {submission.plant?.plant_name}
                </p>
                <p className="text-sm text-gray-600">
                  Code: {submission.plant?.plant_code}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 shadow-sm">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Calendar size={18} />
                  <span className="text-sm font-semibold">Created</span>
                </div>
                <p className="text-gray-900 text-sm">
                  {new Date(submission.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100 shadow-sm">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <Calendar size={18} />
                  <span className="text-sm font-semibold">Last Updated</span>
                </div>
                <p className="text-gray-900 text-sm">
                  {new Date(submission.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-700 mb-2">
                <FileText size={18} />
                <span className="text-sm font-semibold">
                  Template Information
                </span>
              </div>
              <p className="text-gray-900 font-medium">
                {submission.template?.template_name}
              </p>
              <p className="text-sm text-gray-600">
                Type: {submission.template?.template_type}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Submitted Form Data
              </h3>
              {renderFormDataSection()}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditModal = ({ submission, onClose }) => {
    const { updateSubmission } = useTemplateSubmission();
    const formData = submission?.form_data || {};
    const assignedFields = submission?.assigned_fields || [];
    const editParentGroups = buildParentGroups(assignedFields);

    const getFieldConfig = (formKey) => {
      const baseId = formKey.includes("_") && /^(.+)_\d+$/.test(formKey)
        ? formKey.replace(/_\d+$/, "")
        : formKey;
      return assignedFields.find((f) => f?._id === baseId);
    };

    const editFormik = useFormik({
      initialValues: {
        form_data: formData,
      },
      onSubmit: (values) => {
        const payload = { ...values.form_data };
        const isConfirmed = window.confirm(
          "If you update your form, the entire process will restart from the beginning. Do you want to continue?",
        );
        if (!isConfirmed) return;
        if (!submission?._id) {
          console.error("Submission ID is missing.");
          return;
        }
        updateSubmission.mutate({
          id: submission._id,
          payload: {
            form_data: payload,
            status: "SUBMITTED",
            edit_count: (submission?.edit_count ?? 0) + 1,
          },
        });
        onClose();
      },
    });

    const renderEditCell = (formKey, config, fieldType) => {
      const val = editFormik.values.form_data?.[formKey] ?? "";
      let opts = [];
      if (
        (fieldType === "DROPDOWN" || fieldType === "RADIO") &&
        config?.dropdown_options
      ) {
        try {
          opts =
            typeof config.dropdown_options === "string"
              ? JSON.parse(config.dropdown_options)
              : config.dropdown_options;
        } catch {
          opts = [];
        }
      }
      const setVal = (v) => editFormik.setFieldValue(`form_data.${formKey}`, v);
      const inputClass =
        "w-full text-sm text-gray-600 font-medium border border-indigo-200 rounded-md px-2 py-1.5 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none";

      if (fieldType === "NUMBER")
        return (
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className={inputClass}
          />
        );
      if (fieldType === "DATE")
        return (
          <input
            type="date"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className={inputClass}
          />
        );
      if (fieldType === "TEXTAREA")
        return (
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            rows={2}
            className={inputClass}
          />
        );
      if (fieldType === "CHECKBOX")
        return (
          <input
            type="checkbox"
            checked={val === true || val === "true"}
            onChange={(e) => setVal(e.target.checked)}
            className="h-4 w-4 text-indigo-600"
          />
        );
      if (fieldType === "DROPDOWN")
        return (
          <select
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className={inputClass}
          >
            <option value="">Select</option>
            {(opts || []).map((o, i) => (
              <option key={i} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      if (fieldType === "RADIO")
        return (
          <div className="space-y-1">
            {(opts || []).map((o, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={formKey}
                  value={o}
                  checked={val === o}
                  onChange={(e) => setVal(e.target.value)}
                  className="text-indigo-600"
                />
                {o}
              </label>
            ))}
          </div>
        );
      return (
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={inputClass}
          placeholder={`Enter ${config?.field_name || ""}`}
        />
      );
    };

    const hasFormData = Object.keys(formData).length > 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl m-4">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Edit: {submission?.template?.template_name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Update form data</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <XCircle size={24} />
            </button>
          </div>

          <form onSubmit={editFormik.handleSubmit}>
            <div className="px-6 py-4 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Submitted Form Data
              </h3>
              {!hasFormData ? (
                <p className="text-sm text-gray-500 italic">No data to edit</p>
              ) : editParentGroups.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData).map(([formKey, value]) => {
                    const config = getFieldConfig(formKey);
                    const fieldType = config?.field_type || "TEXT";
                    return (
                      <div
                        key={formKey}
                        className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4"
                      >
                        <label className="block text-xs font-semibold text-indigo-600 mb-2">
                          {config?.field_name || formKey}
                        </label>
                        {renderEditCell(formKey, config, fieldType)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-6">
                  {editParentGroups.map((group) => {
                    const cols = [
                      group,
                      ...(Array.isArray(group.children) ? group.children : []),
                    ].filter((f) => f && f._id);
                    if (!cols.length) return null;

                    let maxRowIndex = -1;
                    cols.forEach((f) => {
                      const id = f._id;
                      if (formData[id] !== undefined) maxRowIndex = Math.max(maxRowIndex, 0);
                      Object.keys(formData).forEach((k) => {
                        if (
                          k.startsWith(`${id}_`) &&
                          /^\d+$/.test(k.slice(id.length + 1))
                        )
                          maxRowIndex = Math.max(
                            maxRowIndex,
                            parseInt(k.slice(id.length + 1), 10) + 1,
                          );
                      });
                    });
                    const rowCount = maxRowIndex < 0 ? 0 : maxRowIndex + 1;
                    if (rowCount === 0) return null;

                    return (
                      <div
                        key={group._id}
                        className="rounded-2xl border border-indigo-100 bg-indigo-50/40 overflow-hidden"
                      >
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-indigo-100/60 text-indigo-800">
                                {cols.map((f) => (
                                  <th
                                    key={f._id}
                                    className="px-3 py-2 text-left font-semibold border-b border-indigo-200"
                                  >
                                    {f.field_name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: rowCount }).map(
                                (_, rowIdx) => {
                                  const suffix =
                                    rowIdx === 0 ? "" : `_${rowIdx - 1}`;
                                  return (
                                    <tr
                                      key={rowIdx}
                                      className={
                                        rowIdx % 2 === 0
                                          ? "bg-white"
                                          : "bg-indigo-50/30"
                                      }
                                    >
                                      {cols.map((f) => {
                                        const formKey = `${f._id}${suffix}`;
                                        const fieldType =
                                          f.field_type || "TEXT";
                                        return (
                                          <td
                                            key={formKey}
                                            className="px-3 py-2 border-t border-indigo-100 align-top"
                                          >
                                            {renderEditCell(
                                              formKey,
                                              f,
                                              fieldType,
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                },
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition"
                >
                  Update
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-lg">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Form Submissions
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage all template form submissions
          </p>
        </div>

        <div className="bg-gradient-to-r from-white to-blue-50/50 rounded-xl shadow-lg border border-blue-100 p-5 mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-2">
                <Search className="inline mr-2" size={16} />
                Search
              </label>
              <input
                type="text"
                placeholder="Search by template, user, or plant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-blue-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              Showing{" "}
              <span className="font-bold">{filteredSubmissions.length}</span> of{" "}
              <span className="font-bold">{submissions.length}</span>{" "}
              submissions
            </span>
          </div>
        </div>

        {getAllSubmissionData?.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading submissions...</p>
            </div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No submissions found
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "Try adjusting your search"
                : "No form submissions yet"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 whitespace-nowrap">
                <thead className="bg-gradient-to-r from-blue-500 to-indigo-500">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white  tracking-wider">
                      Submission Id
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white  tracking-wider">
                      Template Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white  tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white  tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white  tracking-wider">
                      Plant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white  tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white  tracking-wider">
                      Created Date
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-semibold text-white  tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission, index) => (
                    <tr
                      key={submission._id}
                      className={`${
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-gradient-to-r from-blue-50/30 to-indigo-50/30"
                      } hover:bg-blue-50 transition-colors duration-150`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {submission?.submission_id || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {submission.template?.template_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {submission.template?.template_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {submission.user?.full_name} (
                            {submission.user?.user_id})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {submission.plant?.plant_name} ({" "}
                            {submission.plant?.plant_code})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={submission.status}
                          processApproved={submission.process_approved}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(submission.createdAt).toLocaleTimeString()}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap  text-center">
                        <div className="flex gap-5">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setIsEditOpen(true);
                            }}
                            className="inline-flex items-center p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all duration-300"
                            title="View Details"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setIsViewModalOpen(true);
                            }}
                            className="inline-flex items-center p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all duration-300"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
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
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedSubmission(null);
          }}
        />
      )}
      {isEditOpen && (
        <EditModal
          submission={selectedSubmission}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedSubmission(null);
          }}
        />
      )}

      <Pagination
        page={page}
        setPage={setPage}
        hasNextpage={submissions?.length == 10}
      />
    </div>
  );
};

export default FormSubmissionData;
