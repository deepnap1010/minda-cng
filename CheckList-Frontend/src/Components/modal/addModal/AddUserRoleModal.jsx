import React, { useEffect, useRef, useState } from "react";
import { X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useUserRole } from "../../../hooks/useUserRole";

export const PERMISSION_MODULES = {
  Administration: {
    Dashboard: "/",
    "User Role": "/user-role",
    Employee: "/employee",
  },
  "Master Data": {
    Company: "/company",
    "Plant Name": "/plant-name",
    Part: "/parts",
    Process: "/process",
  },
  "CheckItem Module": {
    "Check Item": "/checkitem",
    "Inspection Data": "/checkitem-data",
  },
  "Assembly Line Module": {
    "Assembly Line": "/assembly-line",
    "Assembly Line Status": "/assembly-line-status",
    "Assigned Assembly Lines": "/assigned-assembly-lines",
    "Daily Assembly Check": "/daily-assembly-check",
    "Assembly Line Error": "/assembly-line/error",
  },
  "Template Module": {
    "Manage Template": "/template-master",
    "Template Status": "/template-status",
    "Template Approval": "/template-approve-reject",
    "Template Report": "/template-report",
    "Form Submission": "/form-submission",
    "Manage Release Group": "/release-group",
    "Manage Workflow": "/workflow",
    "Manage Documents": "/document-management",
    "My Templates": "/assigned-templates",
  },
  "Plc-Data": {
    "Plc Dashboard": "/plc-data/dashboard",
    "Live Data": "/plc-data/live",
    Stoppage: "/plc-data/stoppage",
    Report: "/plc-data/report",
    "QC Check": "/plc-data/qc-check",
  },
  Cylinder: {
    "Cylinder Live Ops": "/cylinder",
    "Cylinder Pipe Cutting": "/cylinder/pipe-cutting",
    "Cylinder Trace": "/cylinder/trace",
    "Cylinder Machines": "/cylinder/machines",
    "Cylinder History": "/cylinder/history",
    "Cylinder Defects": "/cylinder/defects",
  },
};

// Flatten for backward compatibility
export const PERMISSION_MAP = Object.values(PERMISSION_MODULES).reduce(
  (acc, module) => ({ ...acc, ...module }),
  {},
);

const SIDEBAR_PAGES = Object.keys(PERMISSION_MAP);

const PATH_TO_KEY_MAP = Object.fromEntries(
  Object.entries(PERMISSION_MAP).map(([key, value]) => [value, key]),
);

const validationSchema = Yup.object({
  name: Yup.string().required("Role name is required"),
  description: Yup.string(),
  permissions: Yup.array()
    .min(1, "At least one permission is required")
    .required("Permission is required"),
});

const ModuleSection = ({
  moduleName,
  permissions,
  selectedPermissions,
  onToggle,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-2">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-lg"
      >
        <span className="text-sm font-semibold text-gray-700">
          {moduleName}
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {expanded && (
        <div className="ml-4 mt-1 space-y-1">
          {Object.entries(permissions).map(([permName, path]) => (
            <label
              key={permName}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer rounded"
            >
              <input
                type="checkbox"
                checked={selectedPermissions.includes(permName)}
                onChange={() => onToggle(permName)}
              />
              <span className="text-sm">{permName}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function UserRoleModal({
  open,
  onClose,
  mode = "add",
  initialData = null,
}) {
  const isView = mode === "view";
  const { createUser, updateUser } = useUserRole();

  const [permOpen, setPermOpen] = useState(false);
  const [searchPage, setSearchPage] = useState("");
  const permRef = useRef(null);

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      permissions: initialData?.permissions
        ? initialData.permissions.map((path) => PATH_TO_KEY_MAP[path])
        : [],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const backendPermissions = values.permissions.map(
        (key) => PERMISSION_MAP[key],
      );

      const payload = {
        ...values,
        permissions: backendPermissions,
      };

      if (mode === "edit") {
        updateUser.mutate({
          id: initialData?._id,
          data: payload,
        });
      } else {
        createUser.mutate(payload);
      }

      formik.resetForm();
      onClose();
    },
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (permOpen && permRef.current && !permRef.current.contains(e.target)) {
        setPermOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [permOpen]);

  // ESC key close
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setPermOpen(false);
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // Click outside close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (permOpen && permRef.current && !permRef.current.contains(e.target)) {
        setPermOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [permOpen]);

  if (!open) return null;

  const togglePermission = (key) => {
    const permissions = formik.values.permissions;

    if (permissions.includes(key)) {
      formik.setFieldValue(
        "permissions",
        permissions.filter((p) => p !== key),
      );
    } else {
      formik.setFieldValue("permissions", [...permissions, key]);
    }
  };

  const removePermission = (page) => {
    if (isView) return;
    formik.setFieldValue(
      "permissions",
      formik.values.permissions.filter((p) => p !== page),
    );
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white h-full w-[420px] shadow-xl p-6 relative animate-slideLeft overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {mode === "add"
              ? "Add New Role"
              : mode === "edit"
                ? "Edit Role"
                : "View Role"}
          </h2>

          <button
            onClick={() => {
              onClose();
              formik.resetForm();
            }}
          >
            <X size={22} className="text-gray-500 hover:text-black" />
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={formik.handleSubmit}>
          <div>
            <label className="text-sm font-medium">
              Role <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              disabled={isView}
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full border border-gray-300 rounded-xl px-3 py-2 mt-1 
                ${
                  isView
                    ? "bg-gray-100 border border-gray-300 cursor-not-allowed"
                    : "focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                }`}
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-red-500 text-sm">{formik.errors.name}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <input
              name="description"
              disabled={isView}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full border border-gray-300 rounded-xl px-3 py-2 mt-1
                ${
                  isView
                    ? "bg-gray-100 cursor-not-allowed"
                    : "focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                }`}
            />
          </div>

          {/* PERMISSIONS */}
          <div className="relative mt-2" ref={permRef}>
            <label className="text-sm font-medium">
              Permissions <span className="text-red-500">*</span>
            </label>

            {/* SELECT BOX */}
            <div
              onClick={() => {
                if (isView) return;
                setPermOpen(!permOpen);
                formik.setFieldTouched("permissions", true);
              }}
              className={`border rounded-xl px-3 py-2 mt-1 min-h-[52px] cursor-pointer
  ${permOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300"}
  ${isView && "bg-gray-100 cursor-not-allowed"}
`}
            >
              <div className="flex flex-wrap gap-2">
                {formik.values.permissions.length === 0 && (
                  <span className="text-gray-400 text-sm">Select pages</span>
                )}

                {formik.values.permissions.map((page) => (
                  <span
                    key={page}
                    className="group flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border"
                  >
                    {page}
                    {!isView && (
                      <X
                        size={14}
                        onClick={(e) => {
                          e.stopPropagation();
                          removePermission(page);
                          formik.setFieldTouched("permissions", true);
                        }}
                        className="opacity-0 group-hover:opacity-100 cursor-pointer"
                      />
                    )}
                  </span>
                ))}
              </div>

              <div className="absolute right-4 top-[65%] -translate-y-1/2">
                {permOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {formik.touched.permissions && formik.errors.permissions && (
              <p className="text-red-500 text-sm mt-1">
                {formik.errors.permissions}
              </p>
            )}

            {/* DROPDOWN */}
            {permOpen && !isView && (
              <div className="absolute z-50 mt-2 w-full rounded-xl border bg-white shadow-xl">
                <div className="p-3 border-b flex items-center gap-2">
                  <Search size={16} />
                  <input
                    value={searchPage}
                    onChange={(e) => setSearchPage(e.target.value)}
                    placeholder="Search pages..."
                    className="w-full text-sm outline-none"
                  />
                </div>

                <div className="max-h-56 overflow-auto p-2">
                  {Object.entries(PERMISSION_MODULES)
                    .filter(([moduleName]) =>
                      moduleName
                        .toLowerCase()
                        .includes(searchPage.toLowerCase()),
                    )
                    .map(([moduleName, permissions]) => (
                      <ModuleSection
                        key={moduleName}
                        moduleName={moduleName}
                        permissions={permissions}
                        selectedPermissions={formik.values.permissions}
                        onToggle={(page) => {
                          togglePermission(page);
                          formik.setFieldTouched("permissions", true);
                        }}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          {!isView && (
            <button
              type="submit"
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
            >
              {mode === "add" ? "Create Role" : "Update Role"}
            </button>
          )}
          {isView && (
            <>
              {/* CREATED ON */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Created On
                </label>
                <div className="w-full border border-gray-300 rounded-xl px-3 py-2 mt-1 bg-gray-100 text-gray-800 cursor-not-allowed">
                  {formatDate(initialData?.createdAt)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Last Updated
                </label>
                <div className="w-full border border-gray-300 rounded-xl px-3 py-2 mt-1 bg-gray-100 text-gray-800 cursor-not-allowed">
                  {formatDate(initialData?.updatedAt)}
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}