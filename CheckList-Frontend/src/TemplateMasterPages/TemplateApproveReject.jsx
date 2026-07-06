

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  X,
  Pencil,
  UserPlus,
  Plus,
  History,
  Save,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { RegisterEmployee } from "../hooks/useRegisterEmployee";
import { useTemplateSubmission } from "../hooks/Template Hooks/useTemplateSubmission";
import { useFormik } from "formik";
import { useLogin } from "../hooks/useLogin";
import { useMyStatusHistory } from "../hooks/useStatusHistory";
import { Clock, User, MessageSquareText, ChevronRight } from "lucide-react";

const InfoItem = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
    <p className="text-xs font-semibold  text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value || "-"}</p>
  </div>
);

/* -------------------- Main Component -------------------- */
export default function TemplateApproveReject() {
  const queryClient = useQueryClient();
  const { getAllAssignedTemp, PostHistorTem } = RegisterEmployee();
  const { updateSubmission } = useTemplateSubmission();
  const [approvalTemplate, setApprovalTemplate] = useState(null);
  const [rejectionTemplate, setRejectionTemplate] = useState(null);
  const [reassignTemplate, setReassignTemplate] = useState(null);
  const { logedinUser } = useLogin();
  const [searchText, setSearchText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [openFillModal, setOpenFillModal] = useState(false);
  const [dynamicFields, setDynamicFields] = useState({});

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { historyQuery } = useMyStatusHistory(1, 20, "");

  const [viewModalMode, setViewModalMode] = useState("view");
  const [isHistoryDetailOpen, setIsHistoryDetailOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  // ── Inline-edit state for View modal ──
  const [viewEditData, setViewEditData] = useState({});
  const [isViewEditing, setIsViewEditing] = useState(false);

  const isTemplateFormComplete = (template) => {
    if (!template?.workflow?.workflow) return false;
    const stage =
      template?.current_approver_stage ?? template?.approvals?.length ?? 0;
    const stageFields = template.workflow.workflow?.[stage]?.fields || [];
    if (stageFields.length === 0) return false;
    const formData = template?.submission?.form_data || {};
    return stageFields.every((field) => {
      if (!field?.is_mandatory) return true;
      const value = formData[field._id];
      if (field.field_type === "CHECKBOX") return value === true || value === "true";
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && String(value).trim() !== "";
    });
  };

  const getMissingMandatoryFields = (template, data) => {
    if (!template?.workflow?.workflow) return [];
    const stage =
      template?.current_approver_stage ?? template?.approvals?.length ?? 0;
    const stageFields = template.workflow.workflow?.[stage]?.fields || [];
    const isEmpty = (val) => {
      if (val === undefined || val === null) return true;
      if (typeof val === "string" && String(val).trim() === "") return true;
      if (Array.isArray(val) && val.length === 0) return true;
      return val === false || val === "false";
    };
    const hasAnyValueForKey = (baseKey) => {
      const direct = data[baseKey];
      if (!isEmpty(direct)) return true;
      const suffixKeys = Object.keys(data).filter((k) => {
        const m = k.match(/^(.+)_\d+$/);
        return m && m[1] === baseKey;
      });
      return suffixKeys.some((k) => !isEmpty(data[k]));
    };
    return stageFields
      .filter((f) => f?.is_mandatory)
      .filter((f) => {
        const key = f?._id || f?.field_name;
        return !hasAnyValueForKey(key);
      })
      .map((f) => f?.field_name || f?._id || "—");
  };

  const assignedTemplates =
    getAllAssignedTemp?.data?.flatMap(
      (user) =>
        user?.submissions?.map((submission) => ({
          ...submission,
          ...submission?.template,
          submission: submission,
          user_id: user?.user_id,
          user_db_id: user?._id,
          full_name: user?.full_name,
          email: user?.email,
          employee_plant: user?.employee_plant,
          hod_id: user?.hod_id,
        })) || [],
    ) || [];

  const filteredTemplates = assignedTemplates.filter((t) =>
    t?.template_name?.toLowerCase().includes(searchText.toLowerCase()),
  );

  const selectedHistoryTemplate = React.useMemo(() => {
    const id = selectedHistory?.template?._id || selectedHistory?.template_id;
    if (!id) return null;
    return (
      assignedTemplates.find(
        (t) =>
          String(t?.template_id) === String(id) || String(t?._id) === String(id),
      ) || null
    );
  }, [selectedHistory, assignedTemplates]);

  const selectedHistoryApprovals = React.useMemo(() => {
    if (!selectedHistoryTemplate) return [];
    const a1 = Array.isArray(selectedHistoryTemplate?.approvals)
      ? selectedHistoryTemplate.approvals : [];
    const a2 = Array.isArray(selectedHistoryTemplate?.approval)
      ? selectedHistoryTemplate.approval : [];
    return a1.length ? a1 : a2;
  }, [selectedHistoryTemplate]);

  const formik = useFormik({
    initialValues: {
      current_stage: 0, reassign_stage: null, workflow_id: "",
      status: "", remarks: "", user_id: "", template_id: "",
      reassign_user_id: "", submission_id: "", edit_count: "",
    },
    onSubmit: (values) => {
      PostHistorTem.mutate(values, {
        onSuccess: () => {
          setIsApprovalOpen(false); setIsRejectionOpen(false);
          setApprovalTemplate(null); setRejectionTemplate(null);
          setIsReassignOpen(false); formik.resetForm();
        },
      });
    },
  });

  useEffect(() => {
    if (approvalTemplate) {
      formik.setValues({
        current_stage: approvalTemplate?.current_approver_stage ?? approvalTemplate?.approvals?.length ?? 0,
        reassign_stage: null,
        workflow_id: approvalTemplate?.workflow?.workflow_id || "",
        status: "approved", remarks: "",
        user_id: approvalTemplate?.user_db_id || "",
        template_id: approvalTemplate?.template_id || "",
        reassign_user_id: "",
        submission_id: approvalTemplate?.submission_id,
        edit_count: approvalTemplate?.submission_edit_count,
      });
    }
  }, [approvalTemplate]);

  useEffect(() => {
    if (rejectionTemplate) {
      formik.setValues({
        current_stage: rejectionTemplate?.current_approver_stage ?? rejectionTemplate?.approvals?.length ?? 0,
        reassign_stage: null,
        workflow_id: rejectionTemplate?.workflow?.workflow_id || "",
        status: "rejected", remarks: "",
        user_id: rejectionTemplate?.user_db_id || "",
        template_id: rejectionTemplate?.template_id || "",
        reassign_user_id: "",
        submission_id: rejectionTemplate?.submission_id ?? rejectionTemplate?.submission?.submission_id ?? rejectionTemplate?.submission?._id,
        edit_count: rejectionTemplate?.submission_edit_count ?? rejectionTemplate?.submission?.edit_count,
      });
    }
  }, [rejectionTemplate]);

  useEffect(() => {
    if (reassignTemplate) {
      formik.setValues({
        current_stage: reassignTemplate?.current_approver_stage ?? reassignTemplate?.approvals?.length ?? 0,
        reassign_stage: null,
        workflow_id: reassignTemplate?.workflow?.workflow_id || "",
        status: "reassigned", remarks: "",
        user_id: reassignTemplate?.user_db_id || "",
        template_id: reassignTemplate?.template_id || "",
        reassign_user_id: "",
        submission_id: reassignTemplate?.submission_id ?? reassignTemplate?.submission?.submission_id ?? reassignTemplate?.submission?._id,
        edit_count: reassignTemplate?.submission_edit_count ?? reassignTemplate?.submission?.edit_count,
      });
    }
  }, [reassignTemplate]);

  const handleReassign = (id) => {
    const tpl = assignedTemplates.find((t) => t.template_id === id);
    if (tpl) { setReassignTemplate(tpl); setIsReassignOpen(true); setApprovalTemplate(tpl); }
  };

  const getReassignOptions = (template) => {
    const users = template?.allowed_reassign_users || [];
    return users.map((u) => ({ value: u.user_id, label: u.full_name || u.user_id || "—" }));
  };

  // ── UPDATED: openViewModal pre-fills viewEditData ──
  const openViewModal = (template) => {
    setSelectedTemplate(template);
    setIsViewModalOpen(true);
    setViewModalMode("view");
    setViewEditData({ ...(template.submission?.prev || template.submission?.form_data || {}) });
    setIsViewEditing(false);
    setEditFormData({ ...(template.submission?.prev || template.submission?.form_data || {}) });
    setEditTemplate(template);
    setApprovalTemplate(template);
  };

  // ── UPDATED: closeViewModal resets inline-edit state ──
  const closeViewModal = () => {
    setSelectedTemplate(null); setIsViewModalOpen(false);
    setViewModalMode("view"); setViewEditData({}); setIsViewEditing(false);
    setEditFormData({}); setEditTemplate(null);
  };

  // ── Inline field change for View modal ──
  const handleViewFieldChange = (key, value) => {
    setViewEditData((prev) => ({ ...prev, [key]: value }));
    setIsViewEditing(true);
  };

  // ── Stage field IDs for VIEW modal's selected template ──
  const viewStageFields = React.useMemo(() => {
    if (!selectedTemplate?.workflow?.workflow) return [];
    const stage = selectedTemplate?.current_approver_stage ?? selectedTemplate?.approvals?.length ?? 0;
    return selectedTemplate.workflow.workflow?.[stage]?.fields || [];
  }, [selectedTemplate]);

  const viewStageFieldIds = React.useMemo(() => {
    const ids = new Set();
    viewStageFields.forEach((f) => {
      if (f?._id) ids.add(f._id);
      if (f?.field_name) ids.add(f.field_name);
    });
    return ids;
  }, [viewStageFields]);

  const isViewStageKey = (key) => {
    if (viewStageFieldIds.has(key)) return true;
    const m = key.match(/^(.+)_(\d+)$/);
    if (m && viewStageFieldIds.has(m[1])) return true;
    return false;
  };

  const getViewStageFieldDef = (key) => {
    const base = key.match(/^(.+)_(\d+)$/) ? key.match(/^(.+)_(\d+)$/)[1] : key;
    return viewStageFields.find((f) => f._id === base || f.field_name === base) || null;
  };

  // ── Save inline edits (only stage fields, merged with existing) ──
  const handleViewSave = () => {
    if (!selectedTemplate?.submission?.submission_id) return;
    const existingFormData = selectedTemplate?.submission?.prev || selectedTemplate?.submission?.form_data || {};
    const mergedFormData = { ...existingFormData };
    Object.keys(viewEditData).forEach((key) => {
      if (isViewStageKey(key)) mergedFormData[key] = viewEditData[key];
    });
    updateSubmission.mutate(
      { id: selectedTemplate.submission.submission_id, payload: { form_data: mergedFormData, status: selectedTemplate.submission?.status || "SUBMITTED" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["get-assign-template"] });
          setIsViewEditing(false);
          setSelectedTemplate((prev) =>
            prev ? { ...prev, submission: { ...prev.submission, form_data: mergedFormData, prev: mergedFormData } } : null,
          );
        },
      },
    );
  };

  // ── Render: editable input for stage fields, plain text for others ──
  const renderViewCell = (key, rawValue) => {
    const displayVal = rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== "" ? String(rawValue) : "—";
    if (!isViewStageKey(key)) return <span className="text-sm text-gray-900">{displayVal}</span>;

    const fieldDef = getViewStageFieldDef(key);
    const fieldType = fieldDef?.field_type || "TEXT";
    const currentVal = viewEditData[key] !== undefined ? viewEditData[key] : rawValue ?? "";

    const baseClass =
      "w-full bg-transparent text-sm text-gray-900 rounded px-1.5 py-1 border border-transparent " +
      "hover:border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-400 focus:outline-none focus:bg-white transition-all cursor-text";

    switch (fieldType) {
      case "NUMBER":
        return <input type="number" value={currentVal} onChange={(e) => handleViewFieldChange(key, e.target.value)} className={baseClass} />;
      case "DATE":
        return <input type="date" value={currentVal} onChange={(e) => handleViewFieldChange(key, e.target.value)} className={baseClass} />;
      case "CHECKBOX":
        return <input type="checkbox" checked={currentVal === true || currentVal === "true"} onChange={(e) => handleViewFieldChange(key, e.target.checked)} className="h-4 w-4 text-amber-600 rounded cursor-pointer" />;
      case "TEXTAREA":
        return <textarea value={currentVal} onChange={(e) => handleViewFieldChange(key, e.target.value)} rows={2} className={`${baseClass} resize-y`} />;
      case "DROPDOWN": {
        const opts = Array.isArray(fieldDef?.options) ? fieldDef.options : [];
        return (
          <select value={currentVal} onChange={(e) => handleViewFieldChange(key, e.target.value)} className={baseClass}>
            <option value="">Select...</option>
            {opts.map((o, i) => <option key={i} value={o}>{o}</option>)}
          </select>
        );
      }
      case "RADIO": {
        const opts = Array.isArray(fieldDef?.options) ? fieldDef.options : [];
        return (
          <div className="flex flex-wrap gap-2">
            {opts.map((o, i) => (
              <label key={i} className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="radio" value={o} checked={currentVal === o} onChange={() => handleViewFieldChange(key, o)} className="text-amber-600" />
                {o}
              </label>
            ))}
          </div>
        );
      }
      default:
        return <input type="text" value={currentVal} onChange={(e) => handleViewFieldChange(key, e.target.value)} className={baseClass} />;
    }
  };

  const openEditModal = (template) => {
    if (!template?.submission?.submission_id) return;
    setEditTemplate(template); setApprovalTemplate(template);
    setEditFormData({ ...(template.submission?.prev || template.submission?.form_data || {}) });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setEditTemplate(null); setEditFormData({}); setIsEditOpen(false); setDynamicFields({});
  };

  const handleEditFieldChange = (fieldKey, value) => {
    setEditFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleEditSave = () => {
    if (!editTemplate?.submission?.submission_id) return;
    updateSubmission.mutate(
      { id: editTemplate.submission.submission_id, payload: { form_data: editFormData, status: editTemplate.submission?.status || "SUBMITTED" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["get-assign-template"] });
          closeEditModal();
          if (selectedTemplate?.template_id === editTemplate?.template_id) {
            setSelectedTemplate((prev) => prev ? { ...prev, submission: { ...prev.submission, form_data: editFormData } } : null);
          }
        },
      },
    );
    closeViewModal();
  };

  const current_stage = approvalTemplate?.current_approver_stage ?? 0;
  const fields = approvalTemplate?.workflow?.workflow?.[current_stage]?.fields || [];

  const parentGroups = React.useMemo(() => {
    if (!Array.isArray(fields) || fields.length === 0) return [];
    const idToField = {};
    fields.forEach((field) => { if (field?._id) idToField[field._id] = { ...field, children: [] }; });
    const roots = [];
    fields.forEach((field) => {
      if (!field?._id) return;
      const node = idToField[field._id];
      if (field.parent_id && idToField[field.parent_id]) idToField[field.parent_id].children.push(node);
      else roots.push(node);
    });
    const sortByOrder = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
    roots.sort(sortByOrder);
    roots.forEach((r) => { if (Array.isArray(r.children)) r.children.sort(sortByOrder); });
    return roots;
  }, [fields]);

  const allFieldsForMap = [
    ...(selectedTemplate?.workflow?.workflow?.flatMap((s) => s?.fields || []) || []),
    ...(selectedTemplate?.fields || []),
  ];
  const fieldMap = allFieldsForMap.reduce((acc, field) => {
    if (field?._id && field?.field_name) acc[field._id] = field.field_name;
    return acc;
  }, {});

  const getFieldDisplayName = (formKey) => {
    if (fieldMap[formKey]) return fieldMap[formKey];
    if (formKey.includes("~")) return formKey.split("~")[0];
    const m = formKey.match(/^(.+)_(\d+)$/);
    if (m && fieldMap[m[1]]) {
      const idx = parseInt(m[2], 10) + 1;
      return idx > 1 ? `${fieldMap[m[1]]} (${idx})` : fieldMap[m[1]];
    }
    return formKey;
  };

  const getWorkflowFormData = (formData) => { if (!formData) return {}; return formData; };

  const viewParentGroups = React.useMemo(() => {
    const list = selectedTemplate?.fields || allFieldsForMap || [];
    if (!Array.isArray(list) || !list.length) return [];
    const idToNode = {};
    list.forEach((f) => { if (f?._id) idToNode[f._id] = { ...f, children: [] }; });
    const roots = [];
    list.forEach((f) => {
      if (!f?._id) return;
      const node = idToNode[f._id];
      if (f.parent_id && idToNode[f.parent_id]) idToNode[f.parent_id].children.push(node);
      else roots.push(node);
    });
    const sortByOrder = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
    roots.sort(sortByOrder);
    roots.forEach((r) => { if (Array.isArray(r.children)) r.children.sort(sortByOrder); });
    return roots;
  }, [selectedTemplate?.fields, allFieldsForMap]);

  const previousSubmissionData = approvalTemplate?.submission?.prev || {};
  const stageFieldIds = React.useMemo(() => new Set(fields.map((f) => f?._id || f?.field_name)), [fields]);

  const initialValues = React.useMemo(() => {
    const acc = {};
    const data = previousSubmissionData || {};
    if (Array.isArray(fields)) {
      fields.forEach((field) => {
        const key = field._id || field.field_name;
        acc[key] = data[key] !== undefined ? data[key] : field.field_type === "CHECKBOX" ? false : "";
      });
    }
    Object.keys(data).forEach((k) => {
      const m = k.match(/^(.+)_(\d+)$/);
      if (m && stageFieldIds.has(m[1])) acc[k] = data[k];
    });
    return acc;
  }, [fields, previousSubmissionData, stageFieldIds]);

  const formikForForm = useFormik({
    initialValues, enableReinitialize: true,
    onSubmit: (values) => {
      const previousFormData = approvalTemplate?.submission?.prev || {};
      const newFormData = {};
      Object.keys(values).forEach((fieldKey) => {
        if (stageFieldIds.has(fieldKey)) { newFormData[fieldKey] = values[fieldKey]; return; }
        const m = fieldKey.match(/^(.+)_(\d+)$/);
        if (m && stageFieldIds.has(m[1])) newFormData[fieldKey] = values[fieldKey];
      });
      const cleanedPrev = { ...previousFormData };
      Object.keys(cleanedPrev).forEach((k) => {
        if (stageFieldIds.has(k)) { delete cleanedPrev[k]; return; }
        const m = k.match(/^(.+)_(\d+)$/);
        if (m && stageFieldIds.has(m[1])) delete cleanedPrev[k];
      });
      const mergedData = { ...cleanedPrev, ...newFormData };
      updateSubmission.mutate(
        { id: approvalTemplate?.submission?.submission_id, payload: { form_data: mergedData, status: "SUBMITTED" } },
        {
          onSuccess: () => {
            setOpenFillModal(false);
            formikForForm.resetForm();
            queryClient.invalidateQueries({ queryKey: ["get-assign-template"] });
            setApprovalTemplate((prev) =>
              prev ? { ...prev, submission: { ...prev.submission, form_data: mergedData } } : prev,
            );
            setSelectedTemplate((prev) =>
              prev ? { ...prev, submission: { ...prev.submission, form_data: mergedData } } : prev,
            );
          },
        },
      );
    },
  });

  const getFieldOptions = (field) => {
    if (Array.isArray(field?.options)) return field.options;
    if (field?.dropdown_options) {
      let opts = field.dropdown_options;
      if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = []; } }
      return Array.isArray(opts) ? opts : [];
    }
    return [];
  };

  const renderFormInput = (f) => {
    const key = f?._id || f?.field_name;
    const commonClass = "w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500";
    switch (f.field_type) {
      case "NUMBER": return <input type="number" name={key} value={formikForForm.values[key] ?? ""} onChange={formikForForm.handleChange} className={commonClass} />;
      case "TEXTAREA": return <textarea name={key} value={formikForForm.values[key] ?? ""} onChange={formikForForm.handleChange} rows={4} className={`${commonClass} resize-y`} />;
      case "DATE": return <input type="date" name={key} value={formikForForm.values[key] ?? ""} onChange={formikForForm.handleChange} className={commonClass} />;
      case "CHECKBOX": return <div className="flex items-center"><input type="checkbox" name={key} checked={Boolean(formikForForm.values[key])} onChange={formikForForm.handleChange} className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" /></div>;
      case "DROPDOWN": return <select name={key} value={formikForForm.values[key] ?? ""} onChange={formikForForm.handleChange} className={commonClass}><option value="">Select an option</option>{getFieldOptions(f).map((o, i) => <option key={i} value={o}>{o}</option>)}</select>;
      case "RADIO": return <div className="space-y-2">{getFieldOptions(f).map((o, i) => <label key={i} className="flex items-center gap-2 text-xs sm:text-sm"><input type="radio" name={key} value={o} checked={formikForForm.values[key] === o} onChange={formikForForm.handleChange} className="h-4 w-4 text-blue-600" /><span className="break-words">{o}</span></label>)}</div>;
      case "IMAGE": return <input type="file" name={key} onChange={(e) => formikForForm.setFieldValue(key, e.currentTarget.files[0])} className="w-full text-xs sm:text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />;
      default: return <input type="text" name={key} value={formikForForm.values[key] ?? ""} onChange={formikForForm.handleChange} className={commonClass} />;
    }
  };

  const renderEditInput = (f) => {
    const key = f?._id || f?.field_name;
    const commonClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500";
    switch (f.field_type) {
      case "NUMBER": return <input type="number" value={editFormData[key] ?? ""} onChange={(e) => handleEditFieldChange(key, e.target.value)} className={commonClass} />;
      case "TEXTAREA": return <textarea value={editFormData[key] ?? ""} onChange={(e) => handleEditFieldChange(key, e.target.value)} rows={4} className={commonClass} />;
      case "DATE": return <input type="date" value={editFormData[key] ?? ""} onChange={(e) => handleEditFieldChange(key, e.target.value)} className={commonClass} />;
      case "CHECKBOX": return <input type="checkbox" checked={editFormData[key] === true || editFormData[key] === "true"} onChange={(e) => handleEditFieldChange(key, e.target.checked)} className="h-4 w-4 text-amber-600" />;
      case "DROPDOWN": return <select value={editFormData[key] ?? ""} onChange={(e) => handleEditFieldChange(key, e.target.value)} className={commonClass}><option value="">Select an option</option>{getFieldOptions(f).map((o, i) => <option key={i} value={o}>{o}</option>)}</select>;
      case "RADIO": return <div className="space-y-2">{getFieldOptions(f).map((o, i) => <label key={i} className="flex items-center gap-2 text-sm"><input type="radio" name={key} value={o} checked={editFormData[key] === o} onChange={(e) => handleEditFieldChange(key, e.target.value)} className="text-amber-600" />{o}</label>)}</div>;
      default: return <input type="text" value={editFormData[key] ?? ""} onChange={(e) => handleEditFieldChange(key, e.target.value)} className={commonClass} />;
    }
  };

  const editDynamicCounts = React.useMemo(() => {
    if (!editFormData || !parentGroups?.length) return {};
    const parsed = {};
    Object.keys(editFormData).forEach((k) => {
      const m = k.match(/^(.+)_(\d+)$/);
      if (m && stageFieldIds.has(m[1])) { const i = parseInt(m[2], 10); parsed[m[1]] = Math.max(parsed[m[1]] ?? -1, i) + 1; }
    });
    const byParent = {};
    parentGroups.forEach((group) => {
      const parentId = group._id || group.field_name;
      let maxCount = parsed[parentId] ?? 0;
      (group.children || []).forEach((ch) => { const cid = ch._id || ch.field_name; maxCount = Math.max(maxCount, parsed[cid] ?? 0); });
      if (maxCount > 0) byParent[parentId] = maxCount;
    });
    return byParent;
  }, [editFormData, parentGroups, stageFieldIds]);

  const handleAddDynamicField = (parentField) => {
    const parentId = parentField._id || parentField.field_name;
    const newCount = (dynamicFields[parentId] || 0) + 1;
    const rowIndex = newCount - 1;
    const group = parentGroups.find((g) => (g._id || g.field_name) === parentId) || { children: [] };
    const allInGroup = [parentField, ...(group.children || [])];
    const newValues = { ...formikForForm.values };
    allInGroup.forEach((f) => { const fid = f._id || f.field_name; newValues[`${fid}_${rowIndex}`] = f.field_type === "CHECKBOX" ? false : ""; });
    setDynamicFields((prev) => ({ ...prev, [parentId]: newCount }));
    formikForForm.setValues(newValues);
  };

  const handleRemoveDynamicField = (group, index) => {
    const parentId = group._id || group.field_name;
    const count = dynamicFields[parentId] || 0;
    const allInGroup = [group, ...(group.children || [])];
    const newValues = { ...formikForForm.values };
    allInGroup.forEach((f) => {
      const fid = f._id || f.field_name;
      for (let i = index; i < count - 1; i++) newValues[`${fid}_${i}`] = newValues[`${fid}_${i + 1}`];
      delete newValues[`${fid}_${count - 1}`];
    });
    formikForForm.setValues(newValues);
    setDynamicFields((prev) => {
      const newCount = (prev[parentId] || 0) - 1;
      if (newCount <= 0) { const { [parentId]: _, ...rest } = prev; return rest; }
      return { ...prev, [parentId]: newCount };
    });
  };

  const areCountsEqual = (a, b) => {
    if (a === b) return true;
    if (!a || !b) return false;
    const aKeys = Object.keys(a); const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) => a[k] === b[k]);
  };

  useEffect(() => {
    if (!openFillModal) { setDynamicFields((prev) => (Object.keys(prev).length ? {} : prev)); return; }
    if (!fields?.length) { setDynamicFields((prev) => (Object.keys(prev).length ? {} : prev)); return; }
    const parsed = {};
    Object.keys(previousSubmissionData || {}).forEach((k) => {
      const m = k.match(/^(.+)_(\d+)$/);
      if (m && stageFieldIds.has(m[1])) { const i = parseInt(m[2], 10); parsed[m[1]] = Math.max(parsed[m[1]] ?? -1, i) + 1; }
    });
    const byParent = {};
    parentGroups.forEach((group) => {
      const parentId = group._id || group.field_name;
      let maxCount = parsed[parentId] ?? 0;
      (group.children || []).forEach((ch) => { const cid = ch._id || ch.field_name; maxCount = Math.max(maxCount, parsed[cid] ?? 0); });
      if (maxCount > 0) byParent[parentId] = maxCount;
    });
    setDynamicFields((prev) => areCountsEqual(prev, byParent) ? prev : byParent);
  }, [openFillModal, previousSubmissionData, parentGroups, stageFieldIds, fields?.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="mx-auto max-w-full px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-gray-200">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Template Approval</h1>
            <p className="mt-1.5 text-sm text-gray-600">Review, validate, and manage all submitted templates</p>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-300 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
          >
            <History size={20} className="text-green-600" />
            View History
          </button>
        </div>

        {/* History Modal */}
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full mx-4 max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm"><History size={18} /></div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Your Template Actions</h2>
                    <p className="text-xs text-gray-500">Recent approvals, rejections and reassignments</p>
                  </div>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none focus:outline-none rounded" aria-label="Close">×</button>
              </div>
              <div className="p-5 overflow-y-auto flex-1 bg-white">
                {historyQuery.isLoading && (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-50 border border-gray-100 animate-pulse" />)}
                  </div>
                )}
                {!historyQuery.isLoading && (historyQuery.data || []).length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"><Clock className="text-gray-400" size={18} /></div>
                      <p className="text-sm text-gray-600">No history yet</p>
                    </div>
                  </div>
                )}
                {!historyQuery.isLoading && (historyQuery.data || []).length > 0 && (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-200 via-gray-200 to-transparent" />
                    <ul className="space-y-3">
                      {(historyQuery.data || []).map((row, idx) => {
                        const action = (row?.status || "").toLowerCase();
                        const ts = row?.createdAt ? new Date(row.createdAt).toLocaleString() : "—";
                        const templateName = row?.template?.template_name || "—";
                        const assignee = row?.user?.full_name || row?.user?.user_id || "—";
                        const remarks = row?.remarks || "";
                        const stage = row?.current_stage ?? "—";
                        const iconBg = action === "approved" ? "bg-emerald-500" : action === "rejected" ? "bg-rose-500" : action === "reassigned" ? "bg-violet-500" : "bg-gray-400";
                        const badge = action === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : action === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200" : action === "reassigned" ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-gray-50 text-gray-700 border-gray-200";
                        const actionLabel = action === "approved" ? "Approved" : action === "rejected" ? "Rejected" : action === "reassigned" ? "Reassigned" : row?.status || "—";
                        return (
                          <li key={row?._id || idx} className="relative pl-10">
                            <div className={`absolute left-0 top-2 h-8 w-8 rounded-xl ${iconBg} flex items-center justify-center shadow text-white`}>
                              {action === "approved" && <CheckCircle2 size={16} />}
                              {action === "rejected" && <XCircle size={16} />}
                              {action === "reassigned" && <User size={16} />}
                              {!["approved","rejected","reassigned"].includes(action) && <Clock size={16} />}
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
                              <div className="p-4 flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center flex-wrap gap-2">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge}`}>{actionLabel}</span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 border-gray-200">Stage {stage}</span>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-900 font-semibold">{templateName}</div>
                                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                                    <span className="inline-flex items-center gap-1"><User size={14} className="text-gray-400" />{assignee}</span>
                                    <span className="inline-flex items-center gap-1"><Clock size={14} className="text-gray-400" />{ts}</span>
                                  </div>
                                  {remarks && (
                                    <div className="mt-2 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
                                      <MessageSquareText size={14} className="text-gray-400" />{remarks}
                                    </div>
                                  )}
                                </div>
                                <div className="pt-1 pr-1 text-green-600 cursor-pointer" onClick={() => { setSelectedHistory(row); setIsHistoryDetailOpen(true); }}>
                                  <Eye size={20} />
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-right">
                <button onClick={() => setIsHistoryOpen(false)} className="px-5 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-400">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* History Detail Modal */}
        {isHistoryDetailOpen && selectedHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(8,112,184,0.1)]">
              <div className={
                "px-6 py-5 flex items-center justify-between " +
                (String(selectedHistory?.status||"").toLowerCase()==="approved" ? "bg-gradient-to-r from-emerald-500 to-green-600" :
                 String(selectedHistory?.status||"").toLowerCase()==="rejected" ? "bg-gradient-to-r from-rose-500 to-red-500" :
                 String(selectedHistory?.status||"").toLowerCase()==="reassigned" ? "bg-gradient-to-r from-violet-500 to-purple-600" :
                 "bg-gradient-to-r from-gray-500 to-gray-700")
              }>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/90 flex items-center justify-center shadow">
                    {String(selectedHistory?.status||"").toLowerCase()==="approved" ? <CheckCircle2 className="text-emerald-600" size={22}/> :
                     String(selectedHistory?.status||"").toLowerCase()==="rejected" ? <XCircle className="text-rose-600" size={22}/> :
                     String(selectedHistory?.status||"").toLowerCase()==="reassigned" ? <UserPlus className="text-violet-600" size={22}/> :
                     <Clock className="text-gray-700" size={22}/>}
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold tracking-wide">History Details</h3>
                    <p className="text-white/80 text-xs">{(selectedHistory?.template?.template_name||"—")+" • Stage "+(selectedHistory?.current_stage??"—")}</p>
                  </div>
                </div>
                <button onClick={() => { setIsHistoryDetailOpen(false); setSelectedHistory(null); }} className="rounded-lg bg-white/90 hover:bg-white text-gray-800 px-3 py-1.5 text-sm shadow">Close</button>
              </div>
              <div className="bg-white">
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Status", val: <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border "+(String(selectedHistory?.status||"").toLowerCase()==="approved"?"bg-emerald-50 text-emerald-700 border-emerald-200":String(selectedHistory?.status||"").toLowerCase()==="rejected"?"bg-rose-50 text-rose-700 border-rose-200":String(selectedHistory?.status||"").toLowerCase()==="reassigned"?"bg-violet-50 text-violet-700 border-violet-200":"bg-gray-50 text-gray-700 border-gray-200")}>{String(selectedHistory?.status||"—")}</span> },
                    { label: "Stage", val: selectedHistory?.current_stage??"—" },
                    { label: "Template", val: selectedHistory?.template?.template_name||"—" },
                    { label: "User", val: selectedHistory?.user?.full_name||selectedHistory?.user?.user_id||"—" },
                    { label: "Time", val: selectedHistory?.createdAt ? new Date(selectedHistory.createdAt).toLocaleString() : "—" },
                  ].map(({ label, val }) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                      <div className="mt-1 text-sm font-medium text-gray-900">{val}</div>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Remarks</p>
                  <div className="mt-2 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm text-sm text-gray-800">
                    {selectedHistory?.remarks ? <div className="flex gap-2"><span className="text-xl leading-none text-gray-400">"</span><span>{selectedHistory.remarks}</span><span className="text-xl leading-none text-gray-400">"</span></div> : "—"}
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Template Status History</h3>
                  {selectedHistoryApprovals?.length > 0 ? (
                    <div className="overflow-auto whitespace-nowrap rounded-xl max-h-64 border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>{["Date","Stage","Action","By","Reassign","Remarks"].map(h => <th key={h} className="px-4 py-2 text-left font-semibold text-gray-600">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {selectedHistoryApprovals.map((a, idx) => {
                            const act = (a?.status||"").toLowerCase();
                            const cls = act==="approved"?"text-emerald-600":act==="rejected"?"text-rose-600":act==="reassigned"?"text-violet-600":"text-gray-700";
                            return (
                              <tr key={a?.approval_id||idx} className="border-b border-gray-100">
                                <td className="px-4 py-2 text-gray-700">{a?.approved_at||a?.createdAt ? new Date(a?.approved_at||a?.createdAt).toLocaleString() : "—"}</td>
                                <td className="px-4 py-2 text-gray-700">{a?.current_stage??"—"}</td>
                                <td className={`px-4 py-2 font-medium ${cls}`}>{a?.status||"—"}</td>
                                <td className="px-4 py-2 text-gray-700">{a?.approved_by_user?.full_name||a?.approved_by_user?.user_id||a?.approved_by||"—"}</td>
                                <td className="px-4 py-2 text-gray-700">{a?.reassign_status?"Yes":"—"}</td>
                                <td className="px-4 py-2 text-gray-700 max-w-[320px] overflow-hidden text-ellipsis">{a?.remarks||"—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">No template status history available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-8 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search templates..." className="w-full rounded-xl border border-indigo-100 bg-white px-10 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400" />
        </div>

        {/* Template Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates?.map((template) => (
            <div key={template?.template_id} className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex justify-between">
                <p className="rounded-3xl bg-sky-100 px-4 py-[10px] text-[13px] font-[600] text-sky-700">{template?.template_name}</p>
                <button onClick={() => { setOpenFillModal(true); setApprovalTemplate(template); }} className="rounded-xl border bg-amber-400 cursor-pointer text-white py-2.5 px-2 text-sm font-medium hover:bg-amber-300">Fill Form</button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{template?.template_type}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">{Object.keys(template?.submission?.form_data||{}).length} fields</span>
              </div>
              <div className="mt-2 mb-3 space-y-1">
                <p className="text-xs text-gray-700"><span className="font-medium">Employee:</span> {template?.full_name||"N/A"} ({template?.user_id})</p>
                <p className="text-xs text-gray-700"><span className="font-medium">Email:</span> {template?.email||"N/A"}</p>
                <p className="text-xs text-gray-700"><span className="font-medium">Plant Name:</span> {template.plant_detail?.plant_name} ({template.plant_detail?.plant_code})</p>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium text-gray-800">Status:</span> <span className="capitalize rounded-full bg-emerald-100 px-2 py-1 text-xs font-[600] text-emerald-700">{template?.submission?.status}</span></p>
                <p><span className="font-medium text-gray-800">Submitted:</span> {new Date(template?.submission?.submitted_at).toLocaleString()}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => openViewModal(template)} className="flex-1 min-w-[80px] flex items-center justify-center gap-2 rounded-xl border border-gray-400 cursor-pointer bg-white py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"><Eye size={16}/>View</button>
                <button onClick={() => openEditModal(template)} className="flex-1 min-w-[80px] flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 hover:border-amber-300"><Pencil size={16}/>Edit</button>
                <button
                  onClick={() => {
                    const data = getWorkflowFormData(template?.submission?.prev || template?.submission?.form_data || {});
                    const missing = getMissingMandatoryFields(template, data);
                    if (missing.length > 0) {
                      alert(`Please fill all mandatory fields: ${missing.join(", ")}`);
                      return;
                    }
                    setIsApprovalOpen(true);
                    setApprovalTemplate(template);
                  }}
                  className="flex-1 min-w-[80px] flex items-center justify-center gap-1 cursor-pointer rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-2 px-2 text-sm font-medium text-white hover:from-emerald-600 hover:to-green-700"
                >
                  <CheckCircle2 size={16}/>Approve
                </button>
                <button
                  onClick={() => {
                    const data = getWorkflowFormData(template?.submission?.prev || template?.submission?.form_data || {});
                    const missing = getMissingMandatoryFields(template, data);
                    if (missing.length > 0) {
                      alert(`Please fill all mandatory fields: ${missing.join(", ")}`);
                      return;
                    }
                    setIsRejectionOpen(true);
                    setRejectionTemplate(template);
                  }}
                  className="flex-1 min-w-[80px] flex items-center justify-center gap-1 cursor-pointer rounded-xl bg-gradient-to-r from-rose-500 to-red-600 py-2 px-2 text-sm font-medium text-white hover:from-rose-600 hover:to-red-700"
                >
                  <XCircle size={16}/>Reject
                </button>
                {template?.allowed_reassign_user_ids?.length > 0 && (
                  <button onClick={() => handleReassign(template.template_id)} className="flex-1 min-w-[80px] flex items-center justify-center gap-1 cursor-pointer rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-2 px-2 text-sm font-medium text-white hover:from-violet-600 hover:to-purple-700"><UserPlus size={16}/>Reassign</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates?.length === 0 && <div className="mt-16 text-center text-gray-500">No templates found</div>}

        {/* ─────────── VIEW MODAL (inline editing for stage fields only) ─────────── */}
        {isViewModalOpen && selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">{selectedTemplate?.template_name}</h2>
                  {/* {viewStageFieldIds.size > 0 && (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs text-amber-700 font-medium">
                      Stage fields editable
                    </span>
                  )} */}
                </div>
                <button onClick={closeViewModal} className="rounded-lg p-1 cursor-pointer text-gray-500 hover:bg-gray-100"><X size={22}/></button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem label="Template Type" value={selectedTemplate?.template_type}/>
                  <InfoItem label="Submission Status" value={selectedTemplate?.submission?.status}/>
                  <InfoItem label="Submitted At" value={new Date(selectedTemplate?.submission?.submitted_at).toLocaleString()}/>
                  <InfoItem label="Workflow" value={selectedTemplate?.workflow?.workflow_name}/>
                </div>

                {/* ── Inline-editable Form Data ── */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Submitted Form Data</h3>
                  {(() => {
                    const rawFormData = selectedTemplate?.submission?.prev;
                    const convertedFormData = selectedTemplate?.submission?.form_data;
                    const formData = getWorkflowFormData(rawFormData ?? convertedFormData) || {};
                    const entries = Object.entries(formData);
                    if (!entries.length) return <p className="text-sm text-gray-500 italic">No data submitted.</p>;

                    const renderFlatList = () => (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {entries.map(([key, value]) => (
                          <div key={key} className={`rounded-xl border p-4 ${isViewStageKey(key) ? "border-amber-200 bg-amber-50/50" : "border-gray-100 bg-gray-50/60"}`}>
                            <p className={`text-xs font-semibold mb-1.5 ${isViewStageKey(key) ? "text-amber-700" : "text-gray-500"}`}>
                              {getFieldDisplayName(key)}
                              {isViewStageKey(key) && <span className="ml-1 text-amber-400 font-normal">(editable)</span>}
                            </p>
                            {renderViewCell(key, value)}
                          </div>
                        ))}
                      </div>
                    );

                    if (viewParentGroups.length === 0) return renderFlatList();

                    const groupTables = [];
                    viewParentGroups.forEach((group) => {
                      const cols = [group, ...(Array.isArray(group.children) ? group.children : [])].filter((f) => f && f._id);
                      if (!cols.length) return;
                      let maxRowIndex = -1;
                      cols.forEach((f) => {
                        const id = f._id;
                        if (formData[id] !== undefined && formData[id] !== null && formData[id] !== "") maxRowIndex = Math.max(maxRowIndex, 0);
                        Object.keys(formData).forEach((k) => {
                          if (k.startsWith(`${id}_`) && /^\d+$/.test(k.slice(id.length + 1)))
                            maxRowIndex = Math.max(maxRowIndex, parseInt(k.slice(id.length + 1), 10) + 1);
                        });
                      });
                      const rowCount = maxRowIndex < 0 ? 0 : maxRowIndex + 1;
                      if (rowCount === 0) return;

                      groupTables.push(
                        <div key={group._id} className="rounded-2xl border border-indigo-100 bg-indigo-50/40 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs sm:text-sm">
                              <thead>

                                <tr className={"bg-indigo-100/60"}>
                                  {cols.map((f) => (
                                    <th key={f._id} className={`px-3 py-2 text-left font-semibold border-b ${viewStageFieldIds.has(f._id) ? "border-amber-200 text-amber-700" : "border-indigo-200 text-indigo-800"}`}>
                                      {f.field_name}
                                      {viewStageFieldIds.has(f._id) && <span className="ml-1 text-xs font-normal text-amber-500">(editable)</span>}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {Array.from({ length: rowCount }).map((_, rowIdx) => {
                                  const suffix = rowIdx === 0 ? "" : `_${rowIdx - 1}`;
                                  return (
                                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-amber-100/10" : "bg-amber-200/40"}>
                                      {cols.map((f) => {
                                        const cellKey = `${f._id}${suffix}`;
                                        return (
                                          <td key={cellKey} className={`px-3 py-2 border-t ${isViewStageKey(cellKey) ? "border-amber-100 bg-amber-50/30" : "border-indigo-100"}`}>
                                            {renderViewCell(cellKey, formData[cellKey])}
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
                    });

                    if (groupTables.length === 0) return renderFlatList();
                    return <div className="space-y-6">{groupTables}</div>;
                  })()}
                </div>

                {/* Approval History */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Template Status History</h3>
                  {selectedTemplate?.approvals?.length > 0 ? (
                    <div className="overflow-auto whitespace-nowrap rounded-xl h-64 border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>{["Date","Stage","Action","Approved By","Reassign Status","Remarks"].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 whitespace-nowrap">
                          {selectedTemplate.approvals.sort((a, b) => new Date(a?.approved_at) - new Date(b?.approved_at)).map((a, idx) => {
                            const actionLabel = (a.status||"").toLowerCase()==="reassigned" ? `Reassigned to ${a.reassign_to_name||a.reassign_user_id||"—"}` : (a.status||"").toLowerCase()==="rejected" ? "Rejected" : (a.status||"").toLowerCase()==="approved" ? "Approved" : a.status||"—";
                            const reassignStatusLabel = a.status==="reassigned" ? (a.reassign_status ? "Approved by HOD/approver" : "Pending") : "—";
                            return (
                              <tr key={a.approval_id||idx} className="hover:bg-gray-50/50">
                                <td className="px-4 py-2 text-gray-700">{a.approved_at ? new Date(a.approved_at).toLocaleString() : "—"}</td>
                                <td className="px-4 py-2 text-gray-700">{a.current_stage??"—"}</td>
                                <td className="px-4 py-2"><span className={a.status==="approved"?"text-green-600 font-medium":a.status==="rejected"?"text-red-600 font-medium":a.status==="reassigned"?"text-violet-600 font-medium":"text-gray-700"}>{actionLabel}</span></td>
                                <td className="px-4 py-2 text-gray-700">{a.approved_by_name||"—"}</td>
                                <td className="px-4 py-2 text-center text-gray-600">{reassignStatusLabel}</td>
                                <td className="px-4 py-2 text-gray-600 max-w-[200px] truncate" title={a.remarks}>{a.remarks||"—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-sm text-gray-500 italic">No approval history yet.</p>}
                </div>

                {/* Footer */}
                <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4">
                  <button onClick={closeViewModal} className="rounded-xl border cursor-pointer border-gray-400 px-4 py-2 text-sm hover:bg-gray-50">Close</button>

                  {/* Save Changes — appears only when a stage field is edited */}
                  {isViewEditing && (
                    <button onClick={handleViewSave} disabled={updateSubmission.isPending} className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50">
                      <Save size={16}/>
                      {updateSubmission.isPending ? "Saving..." : "Save Changes"}
                    </button>
                  )}

                  <button onClick={() => { closeViewModal(); setIsRejectionOpen(true); setRejectionTemplate(selectedTemplate); }} className="flex items-center gap-2 cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"><XCircle size={16}/>Reject</button>
                  <button
                    onClick={() => {
                      const data = getWorkflowFormData(selectedTemplate?.submission?.prev || selectedTemplate?.submission?.form_data || {});
                      const missing = getMissingMandatoryFields(selectedTemplate, data);
                      if (missing.length > 0) {
                        alert(`Please fill all mandatory fields: ${missing.join(", ")}`);
                        return;
                      }
                      closeViewModal();
                      setIsApprovalOpen(true);
                      setApprovalTemplate(selectedTemplate);
                    }}
                    className="flex items-center gap-2 cursor-pointer rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                  >
                    <CheckCircle2 size={16}/>Approve
                  </button>
                  {selectedTemplate?.allowed_reassign_user_ids?.length > 0 && (
                    <button onClick={() => { closeViewModal(); handleReassign(selectedTemplate?.template_id); }} className="flex items-center gap-2 cursor-pointer rounded-xl bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700"><UserPlus size={16}/>Reassign</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {isApprovalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6">
              <h2 className="text-xl font-semibold text-green-600 mb-4">Approval Remarks</h2>
              <form onSubmit={formik.handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Remarks</label>
                  <textarea name="remarks" value={formik.values.remarks} onChange={formik.handleChange} rows={4} placeholder="Enter your remarks here..." className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsApprovalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
                  <button
                    type="submit"
                    onClick={(e) => {
                      const tpl = approvalTemplate;
                      const data = getWorkflowFormData(tpl?.submission?.prev || tpl?.submission?.form_data || {});
                      const missing = getMissingMandatoryFields(tpl, data);
                      if (missing.length > 0) {
                        e.preventDefault();
                        alert(`Please fill all mandatory fields: ${missing.join(", ")}`);
                        return false;
                      }
                      return true;
                    }}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Fill Form Modal */}
        {openFillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
            <div className="w-full max-w-lg sm:max-w-2xl lg:max-w-3xl max-h-[90vh] rounded-xl sm:rounded-2xl bg-white shadow-2xl p-4 sm:p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-[#ffb900]">Fill Out the Form</h2>
                <button onClick={() => setOpenFillModal(false)} className="rounded-lg p-1 cursor-pointer text-gray-500 hover:bg-gray-100"><X size={20}/></button>
              </div>
              <form onSubmit={formikForForm.handleSubmit} className="space-y-4 sm:space-y-6">
                {parentGroups?.length === 0 ? (
                  <div className="flex h-full min-h-[200px] sm:min-h-[300px] items-center justify-center bg-gray-50 rounded-lg">
                    <div className="flex flex-col items-center rounded-xl bg-white px-4 sm:px-8 py-6 sm:py-10 shadow-md">
                      <h2 className="mb-2 text-lg sm:text-xl font-semibold text-gray-800">No Data Found</h2>
                      <p className="mb-6 text-center text-xs sm:text-sm text-gray-500">We couldn't find any records to display.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {parentGroups.map((group) => {
                      const parentId = group._id || group.field_name;
                      const addedCount = dynamicFields[parentId] || 0;
                      return (
                        <div key={group._id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm min-w-0 overflow-x-auto">
                          <div className="flex gap-4 min-w-max">
                            <div className="flex flex-col">
                              <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">{group.field_name}{group.is_mandatory && <span className="text-red-500"> *</span>}</label>
                              {renderFormInput(group)}
                            </div>
                            {(group.children || []).map((child) => (
                              <div key={child._id||child.field_name} className="ml-3 flex flex-col">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">{child.field_name}{child.is_mandatory && <span className="text-red-500"> *</span>}</label>
                                {renderFormInput(child)}
                              </div>
                            ))}
                          </div>
                          {Array.from({ length: addedCount }).map((_, index) => {
                            const suffix = `_${index}`;
                            const parentKey = `${parentId}${suffix}`;
                            const virtualParent = { ...group, _id: parentKey };
                            return (
                              <div key={parentKey} className="mt-2 flex gap-4 overflow-x-auto">
                                <div className="flex items-start gap-2 min-w-max">
                                  <div className="flex-1 flex gap-4">
                                    <div className="flex flex-col">{renderFormInput(virtualParent)}</div>
                                    {(group.children || []).map((child) => {
                                      const cKey = `${child._id||child.field_name}${suffix}`;
                                      return <div key={cKey} className="ml-3 flex flex-col">{renderFormInput({ ...child, _id: cKey })}</div>;
                                    })}
                                  </div>
                                  <button type="button" onClick={() => handleRemoveDynamicField(group, index)} className="rounded p-1.5 text-red-500 hover:bg-red-50 shrink-0" title="Remove"><X size={16}/></button>
                                </div>
                              </div>
                            );
                          })}
                          <button type="button" onClick={() => handleAddDynamicField(group)} className="mt-4 flex items-center justify-center gap-2 rounded-lg border-2 border-blue-300 bg-blue-50 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-colors">
                            <Plus size={16}/>Add More
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setOpenFillModal(false)} className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                  <button
                    type="submit"
                    onClick={(e) => {
                      const tpl = approvalTemplate;
                      const values = formikForForm.values || {};
                      const missing = getMissingMandatoryFields(tpl, values);
                      if (missing.length > 0) {
                        e.preventDefault();
                        alert(`Please fill all mandatory fields: ${missing.join(", ")}`);
                        return false;
                      }
                      return true;
                    }}
                    className="w-full sm:w-auto rounded-lg bg-blue-600 px-5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {isRejectionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6">
              <h2 className="text-xl font-semibold text-red-600 mb-4">Rejection Remarks</h2>
              <form onSubmit={formik.handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Remarks</label>
                  <textarea name="remarks" value={formik.values.remarks} onChange={formik.handleChange} rows={4} placeholder="Enter your remarks here..." className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsRejectionOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
                  <button
                    type="submit"
                    onClick={(e) => {
                      const tpl = rejectionTemplate;
                      const data = getWorkflowFormData(tpl?.submission?.prev || tpl?.submission?.form_data || {});
                      const missing = getMissingMandatoryFields(tpl, data);
                      if (missing.length > 0) {
                        e.preventDefault();
                        alert(`Please fill all mandatory fields: ${missing.join(", ")}`);
                        return false;
                      }
                      return true;
                    }}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reassign Modal */}
        {isReassignOpen && reassignTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6">
              <h2 className="text-xl font-semibold text-violet-600 mb-4">Reassign to</h2>
              <form onSubmit={formik.handleSubmit}>
                <input type="hidden" name="status" value="reassigned"/>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Reassign to user</label>
                  <select name="reassign_user_id" value={formik.values.reassign_user_id} onChange={formik.handleChange} required className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                    <option value="">Select user...</option>
                    {getReassignOptions(reassignTemplate).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Remarks (optional)</label>
                  <textarea name="remarks" value={formik.values.remarks} onChange={formik.handleChange} rows={2} placeholder="Optional remarks..." className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"/>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsReassignOpen(false); setReassignTemplate(null); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
                  <button type="submit" className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700">Reassign</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit submission modal */}
        {isEditOpen && editTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl p-6">
              <div className="flex justify-between items-center pb-4 mb-4">
                <h2 className="text-xl font-semibold text-amber-800">Edit submission — {editTemplate?.template_name}</h2>
                <button onClick={closeEditModal} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"><X size={22}/></button>
              </div>
              <div className="space-y-4">
                {!parentGroups?.length ? <p className="text-sm text-gray-500">No form fields to edit.</p> : (
                  <div className="space-y-6">
                    {parentGroups.map((group) => {
                      const parentId = group._id || group.field_name;
                      const addedCount = editDynamicCounts[parentId] || 0;
                      return (
                        <div key={group._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm min-w-0 overflow-x-auto">
                          <div className="flex gap-4 min-w-max">
                            <div className="flex flex-col">
                              <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">{group.field_name}{group.is_mandatory && <span className="text-red-500"> *</span>}</label>
                              {renderEditInput(group)}
                            </div>
                            {(group.children || []).map((child) => (
                              <div key={child._id||child.field_name} className="ml-3 flex flex-col">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">{child.field_name}{child.is_mandatory && <span className="text-red-500"> *</span>}</label>
                                {renderEditInput(child)}
                              </div>
                            ))}
                          </div>
                          {Array.from({ length: addedCount }).map((_, index) => {
                            const suffix = `_${index}`;
                            const parentKey = `${parentId}${suffix}`;
                            const virtualParent = { ...group, _id: parentKey };
                            return (
                              <div key={parentKey} className="mt-2 flex gap-4 overflow-x-auto">
                                <div className="flex items-start gap-2 min-w-max">
                                  <div className="flex-1 flex gap-4">
                                    <div className="flex flex-col">{renderEditInput(virtualParent)}</div>
                                    {(group.children || []).map((child) => {
                                      const cKey = `${child._id||child.field_name}${suffix}`;
                                      return <div key={cKey} className="ml-3 flex flex-col">{renderEditInput({ ...child, _id: cKey })}</div>;
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4">
                <button type="button" onClick={closeEditModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="button" onClick={handleEditSave} disabled={updateSubmission.isPending} className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">{updateSubmission.isPending ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


