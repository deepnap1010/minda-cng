import React from "react";

const TEMPLATE_TYPES = [
  { label: "New", value: "NEW" },
  { label: "Amendment", value: "AMENDMENT" },
];

const TemplateBasicForm = ({
  values = { template_name: "", template_type: "" },
  errors = {},
  touched = {},
  onChange = () => { },
  onSubmit = () => { },
  loading = false,
}) => {

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">
          Template Master
        </h2>
        <p className="text-sm text-slate-500">
          Create a new checklist template
        </p>
      </div>

      {/* Template Name */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Template Name <span className="text-red-500">*</span>
        </label> 
        <input
          type="text"
          name="template_name"
          value={values.template_name}
          onChange={onChange}
          placeholder="e.g. Item Master"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        {touched?.template_name && errors?.template_name && (
          <p className="mt-1 text-xs text-red-500">
            {errors.template_name}
          </p>
        )}
      </div>

      {/* Template Type */}
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Template Type
        </label>
        <select
          name="template_type"
          value={values.template_type}  
          onChange={onChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select Type</option>
          {TEMPLATE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Action */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Template"}
        </button>
      </div>
    </form>
  );
};

export default TemplateBasicForm;
