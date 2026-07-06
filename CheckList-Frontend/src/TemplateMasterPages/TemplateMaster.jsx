import React, { useMemo, useState } from "react";
import {
  Edit2,
  Eye,
  Plus,
  Trash2,
  X,
  WorkflowIcon,
  GripVertical,
} from "lucide-react";
import { useTemplateMaster } from "../hooks/Template Hooks/useTemplateMaster";
import { RegisterEmployee } from "../hooks/useRegisterEmployee";
import { useWorkflow } from "../hooks/useWorkflow";
import SearchableDropdown from "../Components/SearchableDropDown/SearchableDropdown";
import MultiSelectDropdown from "../Components/SearchableDropDown/MultiSelectDropdown";
import AssignWorkflowModal from "../Components/modal/addModal/AssignWorkflowModal";
import Select from "react-select";
import { useReleaseGroup } from "../hooks/Template Hooks/useReleaseGroup";
import Pagination from "../Components/Pagination/Pagination";

const FIELD_TYPES = [
  { label: "Text Input", value: "TEXT" },
  { label: "Number", value: "NUMBER" },
  { label: "Checkbox", value: "CHECKBOX" },
  { label: "Dropdown", value: "DROPDOWN" },
  { label: "Date", value: "DATE" },
  { label: "Text Area", value: "TEXTAREA" },
  { label: "Attach File", value: "IMAGE" },
  { label: "Radio Buttons", value: "RADIO" },
];

const TEMPLATE_TYPES = [
  { label: "New", value: "NEW" },
  { label: "Amendment", value: "AMENDMENT" },
];

export default function TemplateMaster() {
  const { getAllReleaseGroup } = useReleaseGroup();
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTemplateForAssign, setSelectedTemplateForAssign] =
    useState(null);
  const [viewingTemplateId, setViewingTemplateId] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState("");
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateType, setEditTemplateType] = useState("");
  const [editAssignedUser, setEditAssignedUser] = useState([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateType, setNewTemplateType] = useState("");
  const [assignedUser, setAssignedUser] = useState([]);

  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("TEXT");
  const [newIsMandatory, setNewIsMandatory] = useState(false);
  const [newDropdownOptions, setNewDropdownOptions] = useState("");
  const [draftFields, setDraftFields] = useState([]);
  const [parentFieldId, setParentFieldId] = useState(null);
  const [draftPreviewValues, setDraftPreviewValues] = useState({});
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [newTypefiled, setNewTypeField] = useState("User");
  const [approval_id, setApprovalId] = useState(null);
  // Edit modal field states
  const [editTypefiled, setEditTypeField] = useState("User");
  const [editFieldName, setEditFieldName] = useState("");
  const [editFieldType, setEditFieldType] = useState("TEXT");
  const [editIsMandatory, setEditIsMandatory] = useState(false);
  const [editDropdownOptions, setEditDropdownOptions] = useState("");
  const [editingFieldId, setEditingFieldId] = useState("");

  // pagination
  const [page, setPgae] = useState(1);
  const [limit, setLimit] = useState(10);
  const getDropdownOptions = (options = []) =>
    options.map((opt) => ({
      label: opt,
      value: opt,
    }));

  const {
    templatesQuery,
    templateQuery,
    createTemplate,
    addField,
    updateField,
    deleteField,
    updateTemplate,
    deleteTemplate,
    assignWorkflow,
  } = useTemplateMaster(selectedTemplateId, "", "", "", {
    pageData: page,
    limitData: limit,
  }, true);

  const { AllEmpData, WithoutHodEmpData } = RegisterEmployee();

  const { listQuery: workflowsQuery } = useWorkflow("", 1, 1000);

  const templates = templatesQuery?.data || [];
  const selectedTemplate = templateQuery?.data;

  const fields = useMemo(() => {
    let f = selectedTemplate?.fields || [];
    f = f.filter((field) => !field.is_submission_only);
    const sortedFields = [...f].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );

    // Build tree structure
    const fieldMap = {};
    sortedFields.forEach((field) => {
      fieldMap[field._id] = { ...field, children: [] };
    });

    const tree = [];
    sortedFields.forEach((field) => {
      if (field.parent_id && fieldMap[field.parent_id]) {
        fieldMap[field.parent_id].children.push(fieldMap[field._id]);
      } else {
        tree.push(fieldMap[field._id]);
      }
    });

    return tree;
  }, [selectedTemplate]);

  // Flattened fields list for Edit modal table (parent + children) so child names can be edited
  const fieldsFlat = useMemo(() => {
    const out = [];
    const walk = (list, depth = 0) => {
      (list || []).forEach((f) => {
        out.push({ field: f, depth });
        if (f.children?.length) walk(f.children, depth + 1);
      });
    };
    walk(fields);
    return out;
  }, [fields]);

  const [previewValues, setPreviewValues] = useState({});

  const setPreviewValue = (key, value) => {
    setPreviewValues((prev) => ({ ...prev, [key]: value }));
  };

  const renderPreviewInput = (f) => {
    const key = f?._id || f?.field_name;
    const commonClass =
      "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

    const input = (() => {
      switch (f.field_type) {
        case "NUMBER":
          return (
            <input
              type="number"
              value={previewValues[key] ?? ""}
              onChange={(e) => setPreviewValue(key, e.target.value)}
              className={commonClass}
              placeholder={`Enter ${f.field_name}`}
            />
          );
        case "CHECKBOX":
          return (
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(previewValues[key])}
                onChange={(e) => setPreviewValue(key, e.target.checked)}
              />
              {f.field_name}
            </label>
          );
        case "DROPDOWN": {
          let opts = [];
          try {
            opts = f?.dropdown_options ? JSON.parse(f.dropdown_options) : [];
          } catch {
            opts = [];
          }

          const options = opts.map((o) => ({
            label: o,
            value: o,
          }));

          return (
            <Select
              options={options}
              placeholder="Select"
              isSearchable
              value={
                options.find((opt) => opt.value === previewValues[key]) || null
              }
              onChange={(selected) =>
                setPreviewValue(key, selected ? selected.value : "")
              }
              className="mt-1 text-sm"
              classNamePrefix="react-select"
            />
          );
        }

        case "RADIO": {
          let opts = [];
          try {
            opts = f?.dropdown_options ? JSON.parse(f.dropdown_options) : [];
          } catch {
            opts = [];
          }
          return (
            <div className="mt-2 space-y-2">
              {opts.map((o) => (
                <label
                  key={o}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="radio"
                    name={key}
                    value={o}
                    checked={previewValues[key] === o}
                    onChange={(e) => setPreviewValue(key, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          );
        }
        case "DATE":
          return (
            <input
              type="date"
              value={previewValues[key] ?? ""}
              onChange={(e) => setPreviewValue(key, e.target.value)}
              className={commonClass}
            />
          );
        case "TEXTAREA":
          return (
            <textarea
              value={previewValues[key] ?? ""}
              onChange={(e) => setPreviewValue(key, e.target.value)}
              className={commonClass}
              rows={3}
              placeholder={`Enter ${f.field_name}`}
            />
          );
        case "IMAGE":
          const imageUrl = previewValues[key];
          return (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPreviewValue(key, reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className={commonClass}
              />
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          );
        case "TEXT":
        default:
          return (
            <input
              type="text"
              value={previewValues[key] ?? ""}
              onChange={(e) => setPreviewValue(key, e.target.value)}
              className={commonClass}
              placeholder={`Enter ${f.field_name}`}
            />
          );
      }
    })();

    return (
      <div className="flex flex-col gap-2">
        {input}
        {f.children && f.children.length > 0 && (
          <div className="ml-6 mt-2 space-y-4 border-l-2 border-gray-100 pl-4">
            {f.children.map((child, idx) => (
              <div key={child._id || idx}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {child.field_name}
                  {child.is_mandatory && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                {renderPreviewInput(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const setDraftPreviewValue = (key, value) => {
    setDraftPreviewValues((prev) => ({ ...prev, [key]: value }));
  };

  const renderDraftPreviewInput = (f) => {
    const key = f?._tmpId || f?.field_name;
    const commonClass =
      "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

    const input = (() => {
      switch (f.field_type) {
        case "NUMBER":
          return (
            <input
              type="number"
              value={draftPreviewValues[key] ?? ""}
              onChange={(e) => setDraftPreviewValue(key, e.target.value)}
              className={commonClass}
              placeholder={`Enter ${f.field_name}`}
            />
          );
        case "CHECKBOX":
          return (
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(draftPreviewValues[key])}
                onChange={(e) => setDraftPreviewValue(key, e.target.checked)}
              />
              {f.field_name}
              {f.is_mandatory && <span className="text-red-500">*</span>}
            </label>
          );
        case "DROPDOWN": {
          const options = (f.dropdown_options || []).map((o) => ({
            label: o,
            value: o,
          }));

          return (
            <Select
              options={options}
              placeholder="Select"
              isSearchable
              value={
                options.find((opt) => opt.value === draftPreviewValues[key]) ||
                null
              }
              onChange={(selected) =>
                setDraftPreviewValue(key, selected ? selected.value : "")
              }
              className="mt-1 text-sm"
              classNamePrefix="react-select"
            />
          );
        }

        case "RADIO":
          return (
            <div className="mt-2 space-y-2">
              {(f.dropdown_options || []).map((o) => (
                <label
                  key={o}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="radio"
                    name={key}
                    value={o}
                    checked={draftPreviewValues[key] === o}
                    onChange={(e) => setDraftPreviewValue(key, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          );
        case "DATE":
          return (
            <input
              type="date"
              value={draftPreviewValues[key] ?? ""}
              onChange={(e) => setDraftPreviewValue(key, e.target.value)}
              className={commonClass}
            />
          );
        case "TEXTAREA":
          return (
            <textarea
              value={draftPreviewValues[key] ?? ""}
              onChange={(e) => setDraftPreviewValue(key, e.target.value)}
              className={commonClass}
              rows={3}
              placeholder={`Enter ${f.field_name}`}
            />
          );
        case "IMAGE":
          const draftImageUrl = draftPreviewValues[key];
          return (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setDraftPreviewValue(key, reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className={commonClass}
              />
              {draftImageUrl && (
                <div className="mt-2">
                  <img
                    src={draftImageUrl}
                    alt="Preview"
                    className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          );
        case "TEXT":
        default:
          return (
            <input
              type="text"
              value={draftPreviewValues[key] ?? ""}
              onChange={(e) => setDraftPreviewValue(key, e.target.value)}
              className={commonClass}
              placeholder={`Enter ${f.field_name}`}
            />
          );
      }
    })();

    return (
      <div className="flex flex-col gap-2">
        {input}
        {f.children && f.children.length > 0 && (
          <div className="ml-6 mt-2 space-y-4 border-l-2 border-gray-100 pl-4">
            {f.children.map((child, idx) => (
              <div key={child._tmpId || idx}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {child.field_name}
                  {child.is_mandatory && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                {renderDraftPreviewInput(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const openCreate = () => {
    setIsCreateOpen(true);
    setNewTemplateName("");
    setNewTemplateType("");
    setAssignedUser([]);
    setDraftFields([]);
    setDraftPreviewValues({});
    setNewFieldName("");
    setNewFieldType("TEXT");
    setNewIsMandatory(false);
    setNewDropdownOptions("");
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
  };

  const openView = (template) => {
    setViewingTemplateId(template._id);
    setIsViewOpen(true);
    // Select template to load its fields
    setSelectedTemplateId(template._id);
  };

  const closeView = () => {
    setIsViewOpen(false);
    setViewingTemplateId("");
  };



  const openEdit = (template) => {
    setEditingTemplateId(template._id);
    setEditTemplateName(template.template_name);
    setEditTemplateType(template.template_type || "");
    // assigned_users: [{ user_id, status }] – extract user_ids for multiselect
    if (template.assigned_users && Array.isArray(template.assigned_users)) {
      const ids = template.assigned_users
        .map((a) =>
          a && typeof a === "object" && a.user_id != null
            ? a.user_id
            : typeof a === "string"
              ? a
              : null,
        )
        .filter(Boolean);
      setEditAssignedUser(ids);
    } else if (
      template.assignedUser?._id ||
      template.assigned_user?._id ||
      template.assigned_user
    ) {
      const userId =
        template.assignedUser?._id ||
        template.assigned_user?._id ||
        template.assigned_user;
      setEditAssignedUser([userId]);
    } else {
      setEditAssignedUser([]);
    }
    setParentFieldId(null);
    setIsEditOpen(true);
    // Select template to load its fields
    setSelectedTemplateId(template._id);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingTemplateId("");
    setEditTemplateName("");
    setEditTemplateType("");
    setEditAssignedUser([]);
    setEditingFieldId("");
    setEditFieldName("");
    setEditFieldType("TEXT");
    setEditIsMandatory(false);
    setEditDropdownOptions("");
    setParentFieldId(null);
  };

  const startEditField = (field) => {
   
    setEditingFieldId(field._id);
    setEditFieldName(field.field_name);
    setEditTypeField(field.newTypefiled);
    setEditFieldType(field.field_type);
    setEditIsMandatory(field.is_mandatory);
    setEditTypeField(field.type);
    setApprovalId(field.type === "Approval" ? field.group_id : null);
    let opts = "";
    if (
      (field.field_type === "DROPDOWN" || field.field_type === "RADIO") &&
      field.dropdown_options
    ) {
      try {
        const parsed = JSON.parse(field.dropdown_options);
        opts = Array.isArray(parsed) ? parsed.join(", ") : "";
      } catch {
        opts = "";
      }
    }
    setEditDropdownOptions(opts);
  };

  const cancelEditField = () => {
    setEditingFieldId("");
    setEditFieldName("");
    setEditTypeField("User");
    setEditFieldType("TEXT");
    setEditIsMandatory(false);
    setEditDropdownOptions("");
  };

  const handleAddFieldInEdit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const name = (newFieldName || "").trim();
    if (!name) return;

    let dropdownOpts = null;
    if (newFieldType === "DROPDOWN" || newFieldType === "RADIO") {
      dropdownOpts = (newDropdownOptions || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      if (dropdownOpts.length === 0) return;
    }

    await addField.mutateAsync({
      templateId: editingTemplateId,
      payload: {
        field_name: name,
        type: newTypefiled || "User",
        group_id: newTypefiled === "Approval" ? approval_id : null,
        field_type: newFieldType,
        is_mandatory: Boolean(newIsMandatory),
        sort_order: fields.length,
        parent_id: parentFieldId,
        dropdown_options:
          newFieldType === "DROPDOWN" || newFieldType === "RADIO"
            ? dropdownOpts
            : undefined,
      },
    });

    setApprovalId(null);
    setNewFieldName("");
    setNewFieldType("TEXT");
    setNewIsMandatory(false);
    setNewDropdownOptions("");
    setNewTypeField("User");
    setEditTypeField("User");
    setParentFieldId(null);
  };

  const handleUpdateField = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const name = (editFieldName || "").trim();
    if (!name) return;

    let dropdownOpts = null;
    if (editFieldType === "DROPDOWN" || editFieldType === "RADIO") {
      dropdownOpts = (editDropdownOptions || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      if (dropdownOpts.length === 0) return;
    }

    await updateField.mutateAsync({
      fieldId: editingFieldId,
      payload: {
        field_name: name,
        type: editTypefiled || "User",
        group_id: editTypefiled === "Approval" ? approval_id : null,
        field_type: editFieldType,
        is_mandatory: Boolean(editIsMandatory),
        dropdown_options:
          editFieldType === "DROPDOWN" || editFieldType === "RADIO"
            ? dropdownOpts
            : undefined,
      },
    });
    setApprovalId(null);
    cancelEditField();
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();

    await updateTemplate.mutateAsync({
      templateId: editingTemplateId,
      payload: {
        template_name: editTemplateName,
        template_type: editTemplateType || null,
        assigned_users:
          Array.isArray(editAssignedUser) && editAssignedUser.length > 0
            ? editAssignedUser
            : null,
      },
    });
    closeEdit();
  };

  const addDraftField = (e) => {
    e.preventDefault();
    const name = (newFieldName || "").trim();
    if (!name) return;

    let dropdownOpts = null;
    if (newFieldType === "DROPDOWN" || newFieldType === "RADIO") {
      dropdownOpts = (newDropdownOptions || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      if (dropdownOpts.length === 0) return;
    }

    const newField = {
      _tmpId: crypto?.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      field_name: name,
      type: newTypefiled,
      field_type: newFieldType,
      group_id: approval_id,
      is_mandatory: Boolean(newIsMandatory),
      dropdown_options: dropdownOpts,
      children: [],
    };

    if (parentFieldId) {
      const addChildToParent = (fields) => {
        return fields.map((f) => {
          if (f._tmpId === parentFieldId) {
            return { ...f, children: [...(f.children || []), newField] };
          }
          if (f.children && f.children.length > 0) {
            return { ...f, children: addChildToParent(f.children) };
          }
          return f;
        });
      };
      setDraftFields((prev) => addChildToParent(prev));
    } else {
      setDraftFields((prev) => [...prev, newField]);
    }

    setParentFieldId(null);
    setNewFieldName("");
    setNewFieldType("TEXT");
    setNewIsMandatory(false);
    setNewDropdownOptions("");
    setNewTypeField("User");
  };

  const removeDraftField = (tmpId) => {
    setDraftFields((prev) => prev.filter((f) => f._tmpId !== tmpId));
    setDraftPreviewValues((prev) => {
      const next = { ...prev };
      delete next[tmpId];
      return next;
    });
  };

  const reorderDraftFields = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setDraftFields((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
    setDragOverIndex(null);
  };

  const saveNewTemplateWithFields = async (e) => {
    e.preventDefault();

    const res = await createTemplate.mutateAsync({
      template_name: newTemplateName,
      template_type: newTemplateType || null,
      assigned_users:
        Array.isArray(assignedUser) && assignedUser.length > 0
          ? assignedUser
          : null,
    });

    const createdId = res?.data?._id;
    if (!createdId) return;

    const saveFieldsRecursive = async (fields, parentId = null) => {

       console.log(fields );
      for (let i = 0; i < fields.length; i += 1) {
        const f = fields[i];
        const payload = {
          field_name: f.field_name,
          field_type: f.field_type,
          type: f.type || "User",
          group_id: f.type === "Approval" ? f.group_id : null,
          is_mandatory: f.is_mandatory,
          sort_order: i,
          parent_id: parentId,
        };
        if (
          (f.field_type === "DROPDOWN" || f.field_type === "RADIO") &&
          f.dropdown_options &&
          f.dropdown_options.length > 0
        ) {
          payload.dropdown_options = f.dropdown_options;
        }
        const fieldRes = await addField.mutateAsync({
          templateId: createdId,
          payload,
        });

        if (f.children && f.children.length > 0) {
          await saveFieldsRecursive(f.children, fieldRes.data._id);
        }
      }
    };

    await saveFieldsRecursive(draftFields);

    setApprovalId(null);
    setSelectedTemplateId(createdId);
    closeCreate();
  };


  return (
    <div className="min-h-full bg-gray-50 ">
      <div className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Manage Template
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create templates and dynamically add fields for users to fill.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Create New Template
          </button>
        </div>

        <div className="mt-6 grid gap-4 ">
          {/* LEFT: Templates list */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-md font-semibold text-gray-800">
                  Templates
                </h2>
                {templatesQuery.isLoading && (
                  <span className="text-xs text-gray-400">Loading...</span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {templates.length === 0 && !templatesQuery.isLoading ? (
                  <div className="text-sm text-gray-500">No templates yet.</div>
                ) : (
                  templates.map((t) => (
                    <div
                      key={t._id}
                      className={`group flex items-start gap-2  rounded-lg border px-3 py-2 text-left text-sm ${
                        selectedTemplateId === t._id
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedTemplateId(t._id)}
                        className="flex-1 text-left  p-4 transition"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-[18px] text-gray-900">
                              {t.template_name}
                            </div>

                            <div className="text-[14px] font-medium text-gray-500">
                              {t.template_type || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="my-1 h-px bg-gray-100" />

                        <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-500">
                          <div>
                            <p className=" text-xs font-medium text-gray-500">
                              Created :
                              <span className="pl-2">
                                {t?.createdAt
                                  ? new Date(t.createdAt).toLocaleString()
                                  : "—"}
                              </span>
                            </p>

                            <p className=" text-xs font-medium text-gray-500">
                              Updated :
                              <span className="pl-2 ">
                                {t?.updatedAt
                                  ? new Date(t.updatedAt).toLocaleString()
                                  : "—"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-start gap-1 pt-5 ">
                        {t.workflow && (
                          <span className="shrink-0 rounded-full bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1">
                            {t.workflow.name}
                          </span>
                        )}
                        <div className="">
                          {" "}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openView(t);
                            }}
                            className="rounded p-1 hover:bg-green-100 text-green-600"
                            title="View Template"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(t);
                            }}
                            className="rounded p-1 hover:bg-blue-100 text-blue-600"
                            title="Edit Template"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemplateForAssign(t);
                              setIsAssignModalOpen(true);
                            }}
                            className="rounded p-1 hover:bg-purple-100 text-purple-600"
                            title="Assign Workflow"
                          >
                            <WorkflowIcon size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <Pagination
          page={page}
          setPage={setPgae}
          hasNextpage={templates?.length === 10}
        />
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeCreate} />
          <div className="absolute right-0 top-0 h-full w-full max-w-[90%] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b  border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Create New Template
                </h2>
                <p className="text-xs text-gray-500">
                  Fill Template details and add fields, then save.
                </p>
              </div>
              <button
                onClick={closeCreate}
                className="rounded-lg cursor-pointer p-2 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={saveNewTemplateWithFields}
              className="h-full pt-5 overflow-y-auto px-5 py-4"
            >
              <div className="space-y-4">
                {/* Two Column Layout: Template Fields + Add Field Section (Left) and Form Preview (Right) */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* LEFT: Template Name, Template Type, and Add Field Section */}
                  <div className="rounded-xl border border-gray-300 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-md font-semibold text-green-800">
                          Form Preview
                        </h3>
                      </div>
                    </div>

                    <div className="mt-4">
                      {/* Template Name & Type - Always visible */}
                      {(newTemplateName || newTemplateType) && (
                        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                          {/* <div className="text-xs font-semibold text-gray-700">
                            Template Name
                          </div> */}
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {newTemplateName || "—"}
                          </div>
                          {newTemplateType && (
                            <>
                              {/* <div className="mt-2 text-xs font-semibold text-gray-700">
                                Template Type
                              </div> */}
                              <div className="mt-1 text-sm text-gray-800">
                                {newTemplateType}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Fields Preview – drag handle se upar/neeche reorder */}
                      {draftFields.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          {newTemplateName
                            ? "Add fields to see the form preview."
                            : "Enter template name and add fields to see the form preview."}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {draftFields.map((f, index) => (
                            <div
                              key={f._tmpId}
                              className={`flex items-start gap-2 rounded-lg border p-3 transition-colors ${
                                dragOverIndex === index
                                  ? "border-blue-400 bg-blue-50/50"
                                  : "border-gray-200 bg-white"
                              }`}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                                setDragOverIndex(index);
                              }}
                              onDragLeave={() => setDragOverIndex(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                const fromIndex = parseInt(
                                  e.dataTransfer.getData("text/plain"),
                                  10,
                                );
                                if (Number.isNaN(fromIndex)) return;
                                reorderDraftFields(fromIndex, index);
                                setDragOverIndex(null);
                              }}
                            >
                              <div
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData(
                                    "text/plain",
                                    String(index),
                                  );
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragEnd={() => setDragOverIndex(null)}
                                className="cursor-grab active:cursor-grabbing mt-1 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                title="Drag to reorder field up/down"
                              >
                                <GripVertical size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                {f.field_type !== "CHECKBOX" && (
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium text-gray-600">
                                      {f.field_name}
                                      {f.is_mandatory && (
                                        <span className="text-red-500"> *</span>
                                      )}
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setParentFieldId(f._tmpId)}
                                      className={`text-[10px] px-2 py-0.5 rounded ${
                                        parentFieldId === f._tmpId
                                          ? "bg-blue-600 text-white"
                                          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                      }`}
                                    >
                                      {parentFieldId === f._tmpId
                                        ? "Adding Child..."
                                        : "+ Add Child"}
                                    </button>
                                  </div>
                                )}
                                {f.field_type === "CHECKBOX" && (
                                  <div className="flex items-center justify-between">
                                    <div />
                                    <button
                                      type="button"
                                      onClick={() => setParentFieldId(f._tmpId)}
                                      className={`text-[10px] px-2 py-0.5 rounded ${
                                        parentFieldId === f._tmpId
                                          ? "bg-blue-600 text-white"
                                          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                      }`}
                                    >
                                      {parentFieldId === f._tmpId
                                        ? "Adding Child..."
                                        : "+ Add Child"}
                                    </button>
                                  </div>
                                )}
                                {renderDraftPreviewInput(f)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Item Master – General"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Template Type
                      </label>
                      <input
                        type="text"
                        value={newTemplateType}
                        onChange={(e) => setNewTemplateType(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., New / Amendment / Item Master – General"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Assign User
                      </label>
                      <div className="mt-1">
                        <MultiSelectDropdown
                          placeholder="Search and select employees"
                          options={WithoutHodEmpData?.data || []}
                          value={assignedUser}
                          getOptionLabel={(emp) =>
                            `${emp.full_name} (${emp.user_id || emp.email || ""})`
                          }
                          getOptionValue={(emp) => emp._id}
                          onChange={(val) => setAssignedUser(val)}
                          searchFields={["full_name", "user_id", "email"]}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-800">
                          Add Field{" "}
                          {parentFieldId && (
                            <span className="text-blue-600">(As Child)</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2">
                          {parentFieldId && (
                            <button
                              type="button"
                              onClick={() => setParentFieldId(null)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Cancel Child Mode
                            </button>
                          )}
                          <span className="text-xs text-yellow-600">
                            Total: {draftFields.length}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-medium text-gray-600">
                            Field Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Part Number"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-medium text-gray-600">
                            Field Type
                          </label>
                          <select
                            value={newFieldType}
                            onChange={(e) => setNewFieldType(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {(newFieldType === "DROPDOWN" ||
                          newFieldType === "RADIO") && (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-600">
                              {newFieldType === "RADIO"
                                ? "Radio Options"
                                : "Dropdown Options"}{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              value={newDropdownOptions}
                              onChange={(e) =>
                                setNewDropdownOptions(e.target.value)
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="Comma separated e.g. OK,Not OK,NA"
                            />
                            <p className="mt-1 text-[11px] text-gray-500">
                              Example: <b>Yes, No, NA</b>
                            </p>
                          </div>
                        )}

                        <div className="w-full max-w-sm space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Type
                            </label>

                            <select
                              value={newTypefiled ?? "User"}
                              onChange={(e) => setNewTypeField(e.target.value)}
                              className="block w-full rounded-md border border-gray-300 bg-white
        px-3 py-2 text-sm text-gray-700 shadow-sm
        focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="User">User</option>
                              <option value="Approval">Approval</option>
                              <option value="HOD">HOD</option>
                            </select>
                          </div>
                        </div>
                        {newTypefiled === "Approval" && (
                          <div className="transition-all duration-200 ease-in-out">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Approval Group
                            </label>

                            <select
                              value={approval_id}
                              onChange={(e) => setApprovalId(e.target.value)}
                              className="block w-full rounded-md border border-gray-300 bg-white
          px-3 py-2 text-sm text-gray-700 shadow-sm
          focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Select group</option>
                              {getAllReleaseGroup?.data?.map((w) => (
                                <option key={w?._id} value={w?._id}>
                                  {w?.group_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="sm:col-span-1 flex items-end justify-between gap-3">
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={newIsMandatory}
                              onChange={(e) =>
                                setNewIsMandatory(e.target.checked)
                              }
                            />
                            Mandatory
                          </label>
                          <button
                            onClick={addDraftField}
                            type="button"
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm whitespace-nowrap">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                                Field
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                                Type
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                                Mandatory
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                                Fill From
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {draftFields.length === 0 ? (
                              <tr>
                                <td
                                  className="px-3 py-3 text-sm text-center text-gray-500"
                                  colSpan={4}
                                >
                                  No draft fields added.
                                </td>
                              </tr>
                            ) : (
                              draftFields.map((f) => (
                                <tr
                                  key={f?._tmpId}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-3 py-2 text-sm font-semibold text-gray-800">
                                    {f?.field_name}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {f?.field_type}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {f?.is_mandatory ? "Yes" : "No"}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {f?.type === "Approval"
                                      ? getAllReleaseGroup?.data?.find(
                                          (g) => g?._id === f?.group_id,
                                        )?.group_name || "—"
                                      : f?.type || "—"}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeDraftField(f?._tmpId)
                                      }
                                      className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                                    >
                                      <Trash2 size={14} />
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: LIVE FORM PREVIEW (DRAFT) */}
                </div>
              </div>

              <div className="sticky bottom-0 mt-6 mb-20  bg-white py-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTemplate.isPending || addField.isPending}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {createTemplate.isPending || addField.isPending
                      ? "Saving..."
                      : "Save Template"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RIGHT DRAWER: Edit Template */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
          <div className="absolute right-0 top-0 h-full w-full max-w-[90%] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Template
                </h2>
                <p className="text-xs text-gray-500">
                  Update template name, type and fields.
                </p>
              </div>
              <button
                onClick={closeEdit}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleUpdateTemplate}
              className="h-full overflow-y-auto px-5 py-4"
            >
              <div className="space-y-4">
                {/* Two Column Layout: Template Fields + Add Field Section (Left) and Form Preview (Right) */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* RIGHT: LIVE FORM PREVIEW (EDIT MODE) */}
                  <div className="rounded-xl border border-gray-300 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-md font-semibold text-green-800">
                          Form Preview
                        </h3>
                      </div>
                    </div>

                    <div className="mt-4">
                      {/* Template Name & Type */}
                      {(editTemplateName || editTemplateType) && (
                        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                          {/* <div className="text-xs font-semibold text-gray-700">
                            Template Name
                          </div> */}
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {editTemplateName || "—"}
                          </div>
                          {editTemplateType && (
                            <>
                              {/* <div className="mt-2 text-xs font-semibold text-gray-700">
                                Template Type
                              </div> */}
                              <div className="mt-1 text-sm text-gray-800">
                                {editTemplateType}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Fields Preview */}
                      {fields.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          No fields in this template yet. Add fields to see the
                          form preview.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {fields.map((f) => (
                            <div key={f._id}>
                              {f.field_type !== "CHECKBOX" && (
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  {f.field_name}
                                  {f.is_mandatory && (
                                    <span className="text-red-500"> *</span>
                                  )}
                                </label>
                              )}
                              {renderPreviewInput(f)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* LEFT: Template Name, Template Type, and Add/Edit Field Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={editTemplateName}
                        onChange={(e) => setEditTemplateName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Item Master – General"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Template Type
                      </label>
                      <input
                        type="text"
                        value={editTemplateType}
                        onChange={(e) => setEditTemplateType(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., New / Amendment / Item Master – General"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Assign User
                      </label>
                      <div className="mt-1">
                        <MultiSelectDropdown
                          placeholder="Search and select employees"
                          options={WithoutHodEmpData?.data || []}
                          value={editAssignedUser}
                          getOptionLabel={(emp) =>
                            `${emp.full_name} (${emp.user_id || emp.email || ""})`
                          }
                          getOptionValue={(emp) => emp._id}
                          onChange={(val) => setEditAssignedUser(val)}
                          searchFields={["full_name", "user_id", "email"]}
                        />
                      </div>
                    </div>

                    {/* Add/Edit Field Section */}
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-800">
                          {editingFieldId ? "Edit Field" : "Add  Field"}{" "}
                          {parentFieldId && (
                            <span className="text-blue-600">(As Child)</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2">
                          {parentFieldId && (
                            <button
                              type="button"
                              onClick={() => setParentFieldId(null)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Cancel Child Mode
                            </button>
                          )}
                          <span className="text-xs text-yellow-600">
                            Total: {fields.length}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3 pr-10">
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-medium text-gray-600">
                            Field Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={
                              editingFieldId ? editFieldName : newFieldName
                            }
                            onChange={(e) =>
                              editingFieldId
                                ? setEditFieldName(e.target.value)
                                : setNewFieldName(e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Part Number"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-medium text-gray-600">
                            Field Type
                          </label>
                          <select
                            value={
                              editingFieldId ? editFieldType : newFieldType
                            }
                            onChange={(e) =>
                              editingFieldId
                                ? setEditFieldType(e.target.value)
                                : setNewFieldType(e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full max-w-sm space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Type
                            </label>

                            <select
                              value={
                                editingFieldId ? editTypefiled : newTypefiled
                              }
                              onChange={(e) =>
                                editingFieldId
                                  ? setEditTypeField(e.target.value)
                                  : setNewTypeField(e.target.value)
                              }
                              className="block w-full rounded-md border border-gray-300 bg-white
        px-3 py-2 text-sm text-gray-700 shadow-sm
        focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="User">User</option>
                              <option value="Approval">Approval</option>
                              <option value="HOD">HOD</option>
                            </select>
                          </div>
                        </div>
                        {(editingFieldId ? editTypefiled : newTypefiled) ===
                          "Approval" && (
                          <div className="transition-all duration-200 ease-in-out">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Approval Group
                            </label>

                            <select
                              value={approval_id}
                              onChange={(e) => setApprovalId(e.target.value)}
                              className="block w-full rounded-md border border-gray-300 bg-white
          px-3 py-2 text-sm text-gray-700 shadow-sm
          focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Select group</option>
                              {getAllReleaseGroup?.data?.map((w) => (
                                <option key={w?._id} value={w?._id}>
                                  {w?.group_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="sm:col-span-1 flex items-end justify-between gap-3">
                          <label className="flex items-center gap-1 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={
                                editingFieldId
                                  ? editIsMandatory
                                  : newIsMandatory
                              }
                              onChange={(e) =>
                                editingFieldId
                                  ? setEditIsMandatory(e.target.checked)
                                  : setNewIsMandatory(e.target.checked)
                              }
                            />
                            Mandatory
                          </label>
                          {editingFieldId ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={cancelEditField}
                                className="rounded-lg border border-gray-300 px-1 py-1 text-xs font-small text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleUpdateField}
                                disabled={updateField.isPending}
                                className="rounded-lg bg-blue-600 px-2 py-2 text-xs font-small text-white hover:bg-blue-700 disabled:opacity-60"
                              >
                                {updateField.isPending
                                  ? "Updating..."
                                  : "Update"}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleAddFieldInEdit}
                              disabled={addField.isPending}
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {addField.isPending ? "Adding..." : "Add"}
                            </button>
                          )}
                        </div>

                        {((editingFieldId ? editFieldType : newFieldType) ===
                          "DROPDOWN" ||
                          (editingFieldId ? editFieldType : newFieldType) ===
                            "RADIO") && (
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-gray-600">
                              {(editingFieldId
                                ? editFieldType
                                : newFieldType) === "RADIO"
                                ? "Radio Options"
                                : "Dropdown Options"}{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              value={
                                editingFieldId
                                  ? editDropdownOptions
                                  : newDropdownOptions
                              }
                              onChange={(e) =>
                                editingFieldId
                                  ? setEditDropdownOptions(e.target.value)
                                  : setNewDropdownOptions(e.target.value)
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="Comma separated e.g. OK,Not OK,NA"
                            />
                            <p className="mt-1 text-[11px] text-gray-500">
                              Example: <b>Yes, No, NA</b>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Fields List */}
                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm whitespace-nowrap">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                                Field
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                                Type
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                                Mandatory
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                                Fill From
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {fieldsFlat.length === 0 ? (
                              <tr>
                                <td
                                  className="px-3 py-3 text-sm text-gray-500"
                                  colSpan={5}
                                >
                                  No fields in this template.
                                </td>
                              </tr>
                            ) : (
                              fieldsFlat.map(({ field: f, depth }) => (
                                <tr
                                  key={f._id}
                                  className={`hover:bg-gray-50 ${
                                    editingFieldId === f._id ? "bg-blue-50" : ""
                                  }`}
                                >
                                  <td
                                    className="px-3 py-2 text-sm font-semibold text-gray-800"
                                    style={{
                                      paddingLeft: `${12 + depth * 20}px`,
                                    }}
                                  >
                                    {depth > 0 && (
                                      <span className="text-gray-400 mr-1">
                                        └
                                      </span>
                                    )}
                                    {f.field_name}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {f.field_type}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {f.is_mandatory ? "Yes" : "No"}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {f.type === "Approval" ? (
                                      <p>{f?.groupDetail?.group_name}</p>
                                    ) : (
                                      f?.type
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-2 flex-wrap">
                                      {editingFieldId === f._id ? (
                                        <span className="text-xs text-blue-600">
                                          Editing...
                                        </span>
                                      ) : (
                                        <>
                                          <div className=" flex gap-2">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setParentFieldId(
                                                  parentFieldId === f._id
                                                    ? null
                                                    : f._id,
                                                )
                                              }
                                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                                parentFieldId === f._id
                                                  ? "bg-blue-600 text-white"
                                                  : "border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                              }`}
                                            >
                                              {parentFieldId === f._id
                                                ? "Adding Child..."
                                                : "+ Add Child"}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => startEditField(f)}
                                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                                            >
                                              <Edit2 size={12} />
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                deleteField.mutate({
                                                  fieldId: f._id,
                                                })
                                              }
                                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                                            >
                                              <Trash2 size={12} />
                                              Delete
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 mt-6 mb-20 border-t border-gray-200  bg-white py-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateTemplate.isPending}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {updateTemplate.isPending
                      ? "Updating..."
                      : "Update Template"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RIGHT DRAWER: View Template */}
      {isViewOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeView} />
          <div className="absolute right-0 top-0 h-full w-full max-w-[90%] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  View Template
                </h2>
              </div>
              <button
                onClick={closeView}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="h-full overflow-y-auto px-5 py-4">
              {templateQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-sm text-gray-500">
                    Loading template...
                  </span>
                </div>
              ) : selectedTemplate ? (
                <div className="space-y-4">
                  {/* Fields List */}
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">
                        Template Fields
                      </h3>
                      <span className="text-xs text-yellow-500">
                        Total: {fields.length}
                      </span>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                              Field Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                              Type
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                              Mandatory
                            </th>
                            {fields.some(
                              (f) => f.field_type === "DROPDOWN",
                            ) && (
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                                Options
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {fields.length === 0 ? (
                            <tr>
                              <td
                                className="px-3 py-3 text-sm text-gray-500"
                                colSpan={
                                  fields.some(
                                    (f) => f.field_type === "DROPDOWN",
                                  )
                                    ? 4
                                    : 3
                                }
                              >
                                No fields in this template.
                              </td>
                            </tr>
                          ) : (
                            fields.map((f) => {
                              let dropdownOpts = [];
                              if (
                                f.field_type === "DROPDOWN" &&
                                f.dropdown_options
                              ) {
                                try {
                                  dropdownOpts = JSON.parse(f.dropdown_options);
                                } catch {
                                  dropdownOpts = [];
                                }
                              }
                              return (
                                <tr key={f._id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-sm font-semibold text-gray-800">
                                    {f.field_name}
                                    {f.is_mandatory && (
                                      <span className="ml-1 text-red-500">
                                        *
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {f.field_type}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {f.is_mandatory ? "Yes" : "No"}
                                  </td>
                                  {fields.some(
                                    (f) => f.field_type === "DROPDOWN",
                                  ) && (
                                    <td className="px-3 py-2 text-sm text-gray-700">
                                      {f.field_type === "DROPDOWN" &&
                                      dropdownOpts.length > 0
                                        ? dropdownOpts.join(", ")
                                        : "—"}
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Form Preview (Read-only) */}
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-md font-semibold text-green-700">
                          Form Preview
                        </h3>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-gray-900">
                            {selectedTemplate.template_name || "—"}
                          </h3>

                          {selectedTemplate.template_type && (
                            <p className="text-sm text-gray-500">
                              {selectedTemplate.template_type}
                            </p>
                          )}
                        </div>

                        <div className="my-4 border-t border-gray-100" />

                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Assigned Users
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedTemplate.assigned_users?.length ? (
                              selectedTemplate.assigned_users.map((u) => (
                                <span
                                  key={u.id}
                                  className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm text-blue-600"
                                >
                                  <span className="font-medium">
                                    {u?.full_name}
                                  </span>
                                  <span className="ml-2 text-xs text-blue-600">
                                    ({u?.user_id})
                                  </span>
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                No users assigned
                              </span>
                            )}
                          </div>
                        </div>

                        {selectedTemplate.workflow && (
                          <>
                            <div className="my-4 border-t border-gray-100" />

                            <div>
                              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Workflow
                              </div>
                              <div className="mt-1 text-sm font-medium text-indigo-600">
                                {selectedTemplate.workflow.name}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {fields.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          No fields in this template.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          {fields.map((f) => (
                            <div key={f._id}>
                              {f.field_type !== "CHECKBOX" && (
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  {f.field_name}
                                  {f.is_mandatory && (
                                    <span className="text-red-500"> *</span>
                                  )}
                                </label>
                              )}
                              <div className="opacity-60 pointer-events-none">
                                {renderPreviewInput(f)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <span className="text-sm text-gray-500">
                    Template not found.
                  </span>
                </div>
              )}

              <div className="sticky bottom-0 mt-6 mb-20 border-t border-gray-200  bg-white py-4">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={closeView}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <AssignWorkflowModal
        openModal={isAssignModalOpen}
        setOpenModal={setIsAssignModalOpen}
        template={selectedTemplateForAssign}
        assignWorkflow={assignWorkflow}
        workflows={workflowsQuery?.data || []}
        isLoading={workflowsQuery?.isLoading}
      />
    </div>
  );
}
