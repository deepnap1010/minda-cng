import React, { useState, useMemo, useEffect } from "react";
import {
  Eye,
  RefreshCw,
  Save,
  Send,
  Edit,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { useAssignedTemplates } from "../hooks/Template Hooks/useAssignedTemplates";
import { isAdminUser } from "../utils/auth";
import { useTemplateMaster } from "../hooks/Template Hooks/useTemplateMaster";
import { useTemplateSubmission } from "../hooks/Template Hooks/useTemplateSubmission";
import { useLogin } from "../hooks/useLogin";
import Select from "react-select";
import Pagination from "../Components/Pagination/Pagination";
import SearchableSelect from "../Components/SearchableDropDown/SearchableDropdown";

const FIELD_TYPES = {
  TEXT: "Text Input",
  NUMBER: "Number",
  CHECKBOX: "Checkbox",
  DROPDOWN: "Dropdown",
  RADIO: "Radio Buttons",
  DATE: "Date",
  TEXTAREA: "Text Area",
  IMAGE: "Image Uploader",
};

export default function AssignedTemplates() {
  const { logedinUser } = useLogin();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { assignedTemplatesQuery } = useAssignedTemplates(page);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingTemplateId, setViewingTemplateId] = useState("");
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [dynamicFields, setDynamicFields] = useState({});
  const { templateQuery } = useTemplateMaster(viewingTemplateId);
  const [assigned_user_id, setAssignedUser_id] = useState(null);
  const [User_plant_id, selectUser_Plant_id] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // Fetch all submissions for the user (not filtered by template_id initially)
  const {
    getUserSubmissions,
    createSubmission,
    updateSubmission,
    submitSubmission,
  } = useTemplateSubmission(selectedTemplateId);

  // Redirect admin users
  useEffect(() => {
    if (isAdminUser(logedinUser?.data)) {
      navigate("/");
    }
  }, [logedinUser, navigate]);

  const templates = assignedTemplatesQuery.data || [];
  const selectedTemplate = templateQuery.data;
  const existingSubmissions = getUserSubmissions.data || [];

  const fields = useMemo(() => {
    const f = selectedTemplate?.fields || [];
    // Exclude is_submission_only - added fields should not show on reopen
    return [...f]
      .filter((field) => !field.is_submission_only)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [selectedTemplate]);

  // Parent–child groups: each root (no parent_id) is a "group" with its children nested
  const parentGroups = useMemo(() => {
    const idToField = {};
    fields.forEach((field) => {
      idToField[field._id] = { ...field, children: [] };
    });
    const roots = [];
    fields.forEach((field) => {
      const node = idToField[field._id];
      if (field.parent_id && idToField[field.parent_id]) {
        idToField[field.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [fields]);

  // Initialize formik with existing submission data or empty
  const getInitialFormValues = () => {
    if (viewingTemplateId && existingSubmissions.length > 0) {
      const draftSubmission = existingSubmissions.find(
        (sub) =>
          sub.template_id === viewingTemplateId && sub.status === "DRAFT",
      );
      if (draftSubmission?.form_data) {
        return { ...draftSubmission.form_data };
      }
    }
    // Initialize with empty values for each field
    const initialValues = {};
    if (fields.length > 0) {
      fields.forEach((field) => {
        const key = field._id || field.field_name;
        if (field.field_type === "CHECKBOX") {
          initialValues[key] = false;
        } else {
          initialValues[key] = "";
        }
      });
    }
    return initialValues;
  };

  const formik = useFormik({
    initialValues: getInitialFormValues(),
    enableReinitialize: true,
    onSubmit: async (values) => {
      const { ...formData } = values;
      if (currentSubmissionId) {
        await updateSubmission.mutateAsync({
          id: currentSubmissionId,
          payload: {
            form_data: formData,
          },
        });
      } else {
        const result = await createSubmission.mutateAsync({
          template_id: viewingTemplateId,
          form_data: formData,
        });
        if (result?.data?._id) {
          setCurrentSubmissionId(result.data._id);
        }
      }
      setAssignedUser_id(null);
    },
  });

  // Load existing submission when template changes
  useEffect(() => {
    if (viewingTemplateId && selectedTemplate) {
      // Refetch submissions when template opens
      getUserSubmissions.refetch();
    }
  }, [viewingTemplateId, selectedTemplate]);

  // Update form when submissions are loaded
  // Only load DRAFT (to continue). For SUBMITTED we start fresh so employee can submit same template again.
  useEffect(() => {
    if (
      viewingTemplateId &&
      existingSubmissions.length > 0 &&
      fields.length > 0
    ) {
      const draftSubmission = existingSubmissions.find(
        (sub) =>
          sub.template_id === viewingTemplateId && sub.status === "DRAFT",
      );
      const submission = draftSubmission;

      if (submission) {
        setCurrentSubmissionId(submission._id);
        setViewingSubmission(submission);
        // Set form values from existing submission
        if (submission.form_data) {
          formik.setValues({
            ...submission.form_data,
          });
          if (submission.status === "SUBMITTED") {
            setDynamicFields({}); // Don't show added fields when viewing submitted
          }
          // Init dynamicFields from form_data for DRAFT (per parent group: whole parent+children add count)
          else if (submission.status === "DRAFT") {
            const validFieldIds = new Set(
              fields.map((f) => f._id || f.field_name),
            );
            const parsed = {};
            Object.keys(submission.form_data || {}).forEach((k) => {
              const m = k.match(/^(.+)_(\d+)$/);
              if (m && validFieldIds.has(m[1])) {
                const [, fid, idx] = m;
                const i = parseInt(idx, 10);
                parsed[fid] = Math.max(parsed[fid] ?? -1, i) + 1;
              }
            });
            // Key dynamicFields by parent (group root): count = max index across parent + all children
            const byParent = {};
            parentGroups.forEach((group) => {
              const parentId = group._id;
              let maxCount = parsed[parentId] ?? 0;
              (group.children || []).forEach((ch) => {
                maxCount = Math.max(maxCount, parsed[ch._id] ?? 0);
              });
              if (maxCount > 0) byParent[parentId] = maxCount;
            });
            setDynamicFields(byParent);
          }
        }
        // Set edit mode based on submission status
        setIsEditMode(submission.status === "DRAFT");
      } else {
        setCurrentSubmissionId(null);
        setViewingSubmission(null);
        setIsEditMode(false);
        setDynamicFields({});
        // Reset form when no existing submission
        const initialValues = {};
        fields.forEach((field) => {
          const key = field._id || field.field_name;
          if (field.field_type === "CHECKBOX") {
            initialValues[key] = false;
          } else {
            initialValues[key] = "";
          }
        });
        formik.setValues(initialValues);
      }
    } else if (
      viewingTemplateId &&
      fields.length > 0 &&
      existingSubmissions.length === 0
    ) {
      setCurrentSubmissionId(null);
      setViewingSubmission(null);
      setIsEditMode(false);
      setDynamicFields({});
      // Initialize empty form
      const initialValues = {};
      fields.forEach((field) => {
        const key = field._id || field.field_name;
        if (field.field_type === "CHECKBOX") {
          initialValues[key] = false;
        } else {
          initialValues[key] = "";
        }
      });

      formik.setValues(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingTemplateId, existingSubmissions.length, fields.length]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await assignedTemplatesQuery.refetch();
    await getUserSubmissions.refetch();
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const openView = (template) => {
    setViewingTemplateId(template._id);
    setIsViewOpen(true);
    setIsEditMode(false);
    setSelectedTemplateId(template?._id);
    setAssignedUser_id(template?.assigned_users?.user_id);
  };

  const closeView = () => {
    setIsViewOpen(false);
    selectUser_Plant_id(null);
    setViewingTemplateId("");
    setCurrentSubmissionId(null);
    setViewingSubmission(null);
    setIsEditMode(false);
    setDynamicFields({});
    formik.resetForm();
  };

  // const handleEdit = async () => {

  //   console.log(viewingSubmission);
  //   if (
  //     viewingSubmission &&
  //     viewingSubmission.status === "SUBMITTED" &&
  //     currentSubmissionId
  //   ) {
  //     try {
  //       await updateSubmission.mutateAsync({
  //         id: currentSubmissionId,
  //         payload: {
  //           form_data: viewingSubmission.form_data,
  //           status: "SUBMITTED",
  //           edit_count: viewingSubmission?.edit_count + 1,
  //         },
  //       });

  //       getUserSubmissions.refetch();
  //     } catch (error) {
  //       console.error("Error updating submission:", error);
  //     }
  //   }
  // };

  // Add entire parent group (parent + all children) - one card/row, then save draft via API
  const handleAddDynamicField = async (parentField) => {
    if (parentField?.type === "HOD" || parentField?.type === "Approval") {
      return;
    }
    if (!User_plant_id) {
      alert("Please select a plant");
      return;
    }
    const parentId = parentField._id || parentField.field_name;
    const newCount = (dynamicFields[parentId] || 0) + 1;
    const rowIndex = newCount - 1; // 0-based suffix for new row
    const group = parentGroups.find(
      (g) => (g._id || g.field_name) === parentId,
    ) || { children: [] };
    const allInGroup = [parentField, ...(group.children || [])];

    const newValues = { ...formik.values };
    allInGroup.forEach((f) => {
      const fid = f._id || f.field_name;
      const key = rowIndex === 0 ? `${fid}_0` : `${fid}_${rowIndex}`;
      newValues[key] = f.field_type === "CHECKBOX" ? false : "";
    });

    setDynamicFields((prev) => ({
      ...prev,
      [parentId]: newCount,
    }));
    formik.setValues(newValues);

    const formData = { ...newValues };
    delete formData.plant_id;
    delete formData.plant_name;

    // try {
    //   if (currentSubmissionId) {
    //     await updateSubmission.mutateAsync({
    //       id: currentSubmissionId,
    //       payload: { form_data: formData, status: "DRAFT" },
    //     });
    //   } else {
    //     const result = await createSubmission.mutateAsync({
    //       template_id: viewingTemplateId,
    //       form_data: formData,
    //       status: "DRAFT",
    //       user_id: assigned_user_id || undefined,
    //       plant_id: User_plant_id || undefined,
    //     });
    //     if (result?.data?._id) setCurrentSubmissionId(result.data._id);
    //   }
    // } catch (e) {
    //   console.error("Failed to save draft on Add More:", e);
    // }
  };

  const handleRemoveDynamicField = async (group, index) => {
    const parentId = group._id || group.field_name;
    const count = dynamicFields[parentId] || 0;
    const allInGroup = [group, ...(group.children || [])];

    const newValues = { ...formik.values };
    allInGroup.forEach((f) => {
      const fid = f._id || f.field_name;
      for (let i = index; i < count - 1; i++) {
        newValues[`${fid}_${i}`] = newValues[`${fid}_${i + 1}`];
      }
      delete newValues[`${fid}_${count - 1}`];
    });
    formik.setValues(newValues);

    setDynamicFields((prev) => {
      const newCount = (prev[parentId] || 0) - 1;
      if (newCount <= 0) {
        const { [parentId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [parentId]: newCount };
    });

    const formData = { ...newValues };
    delete formData.plant_id;
    delete formData.plant_name;
    try {
      if (currentSubmissionId) {
        await updateSubmission.mutateAsync({
          id: currentSubmissionId,
          payload: { form_data: formData, status: "DRAFT" },
        });
      }
    } catch (e) {
      console.error("Failed to save draft on Remove:", e);
    }
  };

  const handleSubmit = async () => {
    if (!User_plant_id) {
      alert("Please select a plant");
      return;
    }

    const mandatoryFields = fields.filter(
      (f) => f.is_mandatory && f?.type !== "HOD" && f?.type !== "Approval",
    );
    const missingFields = mandatoryFields.filter((field) => {
      const key = field._id || field.field_name;
      const value = formik.values[key];
      if (field.field_type === "CHECKBOX") {
        return !(value === true || value === "true");
      }
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    });

    if (missingFields.length > 0) {
      alert(
        `Please fill all mandatory fields: ${missingFields.map((f) => f.field_name).join(", ")}`,
      );
      return;
    }

    try {
      let submissionId = currentSubmissionId;

      const { ...formData } = formik.values;
      const result = await createSubmission.mutateAsync({
        template_id: viewingTemplateId,
        form_data: formData,
        status: "SUBMITTED",
        user_id: assigned_user_id,
        plant_id: User_plant_id,
      });
      setIsViewOpen(false);
      submissionId = result?.data?._id;
      if (submissionId) {
        setCurrentSubmissionId(submissionId);
      }

      // // Submit the form
      // if (submissionId) {
      //   await submitSubmission.mutateAsync(submissionId);
      //   // Refetch submissions to get updated status
      //   await getUserSubmissions.refetch();
      //
      // }
      setAssignedUser_id(null);
      closeView();
      setIsViewOpen(false);
    } catch (error) {
      console.error("Error submitting template:", error);
    }
  };

  const renderPreviewInput = (f, readOnly = false) => {
    const key = f?._id || f?.field_name;
    const isHod = f?.type === "HOD";
    const isApproval = f?.type === "Approval";
    const isReadOnly = readOnly || isHod || isApproval;
    const commonClass = `mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""}`;

    switch (f.field_type) {
      case "NUMBER":
        return (
          <input
            type="number"
            name={key}
            value={formik.values[key] ?? ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={commonClass}
            placeholder={`Enter ${f.field_name}`}
            disabled={isReadOnly}
            readOnly={isReadOnly}
          />
        );
      case "CHECKBOX":
        return (
          <label
            className={`mt-2 inline-flex items-center gap-2 text-sm text-gray-700 ${isReadOnly ? "cursor-not-allowed opacity-70" : ""}`}
          >
            <input
              type="checkbox"
              name={key}
              checked={Boolean(formik.values[key])}
              onChange={formik.handleChange}
              disabled={isReadOnly}
            />
            {f.field_name}
            {f.is_mandatory && <span className="text-red-500">*</span>}
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
            isDisabled={isReadOnly}
            value={
              options.find((opt) => opt.value === formik.values[key]) || null
            }
            onChange={(selected) =>
              formik.setFieldValue(key, selected ? selected.value : "")
            }
            onBlur={() => formik.setFieldTouched(key, true)}
            className="mt-1 text-sm "
            classNamePrefix="react-select scrollbar-custom"
            menuPortalTarget={document.body}
            maxMenuHeight={120}
            menuPosition="fixed"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
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
                className={`flex items-center gap-2 text-sm text-gray-700 ${isReadOnly ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <input
                  type="radio"
                  name={key}
                  value={o}
                  checked={formik.values[key] === o}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  disabled={isReadOnly}
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
            name={key}
            value={formik.values[key] ?? ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={commonClass}
            disabled={isReadOnly}
            readOnly={isReadOnly}
          />
        );
      case "TEXTAREA":
        return (
          <textarea
            name={key}
            value={formik.values[key] ?? ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={commonClass}
            rows={3}
            placeholder={`Enter ${f.field_name}`}
            disabled={isReadOnly}
            readOnly={isReadOnly}
          />
        );
      case "IMAGE":
        return isReadOnly ? (
          formik.values[key] ? (
            <div className="mt-2">
              <img
                src={formik.values[key]}
                alt={f.field_name}
                className="max-w-xs rounded-lg border border-gray-300"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No image uploaded</p>
          )
        ) : (
          <input
            type="file"
            accept="image/*"
            name={key}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  formik.setFieldValue(key, reader.result);
                };
                reader.readAsDataURL(file);
              }
            }}
            className={commonClass}
          />
        );
      case "TEXT":
      default:
        return (
          <input
            type="text"
            name={key}
            value={formik.values[key] ?? ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={commonClass}
            placeholder={`Enter ${f.field_name}`}
            disabled={isReadOnly}
            readOnly={isReadOnly}
          />
        );
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              My Assigned Templates
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Templates assigned to you for review and completion.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            disabled={assignedTemplatesQuery.isLoading}
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="min-h-[100px] flex justify-center gap-2 items-center border-2 border-gray-100 rounded-2xl mt-5">
            <Loader2 size={24} className="animate-spin" />
            <p>Refreshing...</p>
          </div>
        ) : (
          ""
        )}

        <div className="mt-6">
          {assignedTemplatesQuery.isLoading ? (
            <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
              <p className="text-gray-500">Loading templates...</p>
            </div>
          ) : assignedTemplatesQuery.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-red-600">
                Error loading templates:{" "}
                {assignedTemplatesQuery.error?.response?.data?.message ||
                  assignedTemplatesQuery.error?.message ||
                  "Unknown error"}
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
              <p className="text-gray-500">No templates assigned to you yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
              {[...templates]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((template) => (
                  <div
                    key={template._id}
                    className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.template_name}
                        </h3>
                        {template.template_type && (
                          <p className="mt-1 text-sm text-gray-500">
                            Type: {template.template_type}
                          </p>
                        )}
                        {template.fields && (
                          <p className="mt-1 text-xs text-gray-500">
                            Total Field: {template.fields.length}
                          </p>
                        )}
                        {template && (
                          <p className="mt-1 text-xs font-bold text-gray-600">
                            Created Date:{" "}
                            <span className="font-normal">
                              {new Date(template?.createdAt).toDateString()}
                            </span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => openView(template)}
                        className="ml-2 rounded-lg mt-4 p-2 border bg-green-50 border-green-300 flex items-center cursor-pointer text-green-600 hover:bg-blue-50 transition-colors"
                        title="View Template"
                      >
                        <Eye size={20} /> &nbsp;View
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* View Modal - Full Page */}
        {isViewOpen && selectedTemplate && (
          <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
            <div className="min-h-full bg-white">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between w-full gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedTemplate?.template_name}
                  </h2>
                  <button
                    onClick={closeView}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Template Name:
                    </span>{" "}
                    <span className="text-sm text-gray-900">
                      {selectedTemplate.template_name}
                    </span>
                  </div>
                  {selectedTemplate.template_type && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Type:
                      </span>{" "}
                      <span className="text-sm text-gray-900">
                        {selectedTemplate.template_type}
                      </span>
                    </div>
                  )}
                </div>

                <form onSubmit={formik.handleSubmit}>
                  <div className="mt-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                      <h3 className="text-base font-semibold text-gray-800 mb-4">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-600 uppercase">
                            Template Name
                          </label>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {selectedTemplate?.template_name}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 uppercase">
                            Template Type
                          </label>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {selectedTemplate?.template_type || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 uppercase">
                            Total Fields
                          </label>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {fields.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {parentGroups?.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No fields added yet.
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {/* Plant Selector */}
                        <div className="bg-white border border-gray-200 rounded-lg">
                          <div className="bg-blue-600 px-4 py-3 rounded-t-md">
                            <h4 className="text-sm font-semibold text-white uppercase">
                              Plant Selection{" "}
                              <span className="text-red-300">*</span>
                            </h4>
                          </div>
                          <div className="p-4 ">
                            <SearchableSelect
                              id="plant-select"
                              placeholder="Search & select plant"
                              options={selectedTemplate?.plant_option || []}
                              value={formik.values.plant_name}
                              onChange={(val) => {
                                selectUser_Plant_id(val);
                              }}
                              getOptionLabel={(c) =>
                                `${c?.plant_name} (${c?.plant_code})`
                              }
                              getOptionValue={(c) => c?._id}
                              className="w-full"
                            />
                          </div>
                        </div>

                        {/* Parent groups: side by side in grid */}
                        <div className="space-y-6">
                          {parentGroups.map((group, groupIndex) => {
                            const parentId = group._id || group.field_name;
                            const addedCount = dynamicFields[parentId] || 0;
                            const readOnly =
                              !isEditMode &&
                              viewingSubmission?.status === "SUBMITTED";
                            const canAdd =
                              (isEditMode ||
                                !viewingSubmission ||
                                viewingSubmission?.status === "DRAFT") &&
                              group?.type !== "HOD" &&
                              group?.type !== "Approval";

                            return (
                              <div
                                key={group._id}
                                className="bg-white border border-gray-200 rounded-lg "
                              >
                                {/* Table Header */}
                                <div className="bg-blue-600 px-4 py-3 rounded-t-md flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <h4 className="text-sm font-semibold text-white uppercase">
                                    {group.field_name}{" "}
                                    {group.is_mandatory && (
                                      <span className="text-red-300">*</span>
                                    )}
                                  </h4>
                                </div>

                                {/* Table Content */}
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                          {group.field_name}
                                        </th>
                                        {(group.children || []).map((child) => (
                                          <th
                                            key={child._id}
                                            className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                                          >
                                            {child.field_name}{" "}
                                            {child.is_mandatory && (
                                              <span className="text-red-500">
                                                *
                                              </span>
                                            )}
                                          </th>
                                        ))}
                                        {canAdd && addedCount > 0 && (
                                          <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase w-20">
                                            Action
                                          </th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {/* Row 0: original parent + children */}
                                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-2 py-2 sm:px-4 sm:py-3">
                                          {renderPreviewInput(group, readOnly)}
                                          {formik.touched[parentId] &&
                                            formik.errors[parentId] && (
                                              <p className="text-red-500 text-xs mt-1">
                                                {formik.errors[parentId]}
                                              </p>
                                            )}
                                        </td>
                                        {(group.children || []).map((child) => {
                                          const cKey =
                                            child._id || child.field_name;
                                          return (
                                            <td
                                              key={child._id}
                                              className="px-2 py-2 sm:px-4 sm:py-3"
                                            >
                                              {renderPreviewInput(
                                                child,
                                                readOnly,
                                              )}
                                              {formik.touched[cKey] &&
                                                formik.errors[cKey] && (
                                                  <p className="text-red-500 text-xs mt-1">
                                                    {formik.errors[cKey]}
                                                  </p>
                                                )}
                                            </td>
                                          );
                                        })}
                                        {canAdd && addedCount > 0 && (
                                          <td className="px-2 py-2 sm:px-4 sm:py-3 text-center"></td>
                                        )}
                                      </tr>

                                      {/* Dynamic rows: full parent+children per index */}
                                      {Array.from({ length: addedCount }).map(
                                        (_, index) => {
                                          const suffix = `_${index}`;
                                          const parentKey = `${parentId}${suffix}`;
                                          const virtualParent = {
                                            ...group,
                                            _id: parentKey,
                                          };
                                          return (
                                            <tr
                                              key={parentKey}
                                              className="border-b border-gray-100 hover:bg-gray-50"
                                            >
                                              <td className="px-2 py-2 sm:px-4 sm:py-3">
                                                {renderPreviewInput(
                                                  virtualParent,
                                                  readOnly,
                                                )}
                                                {formik.touched[parentKey] &&
                                                  formik.errors[parentKey] && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                      {formik.errors[parentKey]}
                                                    </p>
                                                  )}
                                              </td>
                                              {(group.children || []).map(
                                                (child) => {
                                                  const cKey = `${child._id || child.field_name}${suffix}`;
                                                  const virtualChild = {
                                                    ...child,
                                                    _id: cKey,
                                                  };
                                                  return (
                                                    <td
                                                      key={cKey}
                                                      className="px-2 py-2 sm:px-4 sm:py-3"
                                                    >
                                                      {renderPreviewInput(
                                                        virtualChild,
                                                        readOnly,
                                                      )}
                                                      {formik.touched[cKey] &&
                                                        formik.errors[cKey] && (
                                                          <p className="text-red-500 text-xs mt-1">
                                                            {
                                                              formik.errors[
                                                                cKey
                                                              ]
                                                            }
                                                          </p>
                                                        )}
                                                    </td>
                                                  );
                                                },
                                              )}
                                              {canAdd && (
                                                <td className="px-2 py-2 sm:px-4 sm:py-3 text-center">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleRemoveDynamicField(
                                                        group,
                                                        index,
                                                      )
                                                    }
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Remove"
                                                  >
                                                    <X size={16} />
                                                  </button>
                                                </td>
                                              )}
                                            </tr>
                                          );
                                        },
                                      )}
                                    </tbody>
                                  </table>
                                  {canAdd && (
                                    <div className="flex justify-center sm:justify-end px-4 sm:px-6 py-4 border-blue-100">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAddDynamicField(group)
                                        }
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                      >
                                        <Plus size={18} className="font-bold" />
                                        Add More Row
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {isEditMode ||
                  !viewingSubmission ||
                  viewingSubmission.status === "DRAFT" ? (
                    <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 bg-white px-4 sm:px-6 py-4 rounded-lg">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                          createSubmission.isPending ||
                          updateSubmission.isPending ||
                          submitSubmission.isPending
                        }
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                      >
                        <Send size={18} />
                        {submitSubmission.isPending
                          ? "Submitting..."
                          : "Submit"}
                      </button>
                    </div>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      <Pagination
        page={page}
        setPage={setPage}
        hasNextpage={templates?.length === 10}
      />
    </div>
  );
}
