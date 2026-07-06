// =============================================================================
// SINGLE SOURCE OF TRUTH for RBAC page -> route-path mapping.
//
// WHY THIS FILE EXISTS:
// The label->path map used to be hand-written in THREE places that drifted apart:
//   1. AddUserRoleModal.jsx  (PERMISSION_MODULES)  -> what gets SAVED
//   2. utils/auth.js         (ROLE_PERMISSION_PATH_MAP) -> how it's READ
//   3. Components/Sidebar.jsx (allMenu paths)       -> what is MATCHED
// When any of them disagreed (e.g. Plc Dashboard / Live Data swapped), a granted
// permission silently failed to appear in the sidebar.
//
// RULE: a child shows in the sidebar only when
//       permissions.includes(child.path) is an EXACT string match.
// So every path here MUST be byte-identical to the route path in AppRoute.jsx
// AND to the path used in the Sidebar menu.
//
// Keys are the human labels shown as checkboxes/chips in the Edit Role drawer.
// Values are the exact route paths (must match routes/AppRoute.jsx).
// =============================================================================

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
    // NOTE: /plc-data/dashboard renders the PlcDashboard page,
    //       /plc-data/live      renders the PlcLiveData page (see AppRoute.jsx).
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

// Flat { label: path } for backward compatibility.
export const PERMISSION_MAP = Object.values(PERMISSION_MODULES).reduce(
  (acc, module) => ({ ...acc, ...module }),
  {},
);

// Reverse { path: label } — used by the modal to render saved paths as chips.
export const PATH_TO_KEY_MAP = Object.fromEntries(
  Object.entries(PERMISSION_MAP).map(([key, value]) => [value, key]),
);

// Every valid permission path (handy for validation / "select all").
export const ALL_PERMISSION_PATHS = Object.values(PERMISSION_MAP);

// Top-level modules a NON-admin is allowed to see in the sidebar.
// Children inside them are still gated per-role by granted permissions.
export const USER_ALLOWED_TOP_LEVEL_MODULES = [
  "Dashboard",
  "Checklist Module",
  "Template Module",
  "Plc-Data",
  "Cylinder",
];