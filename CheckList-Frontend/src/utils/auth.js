export const isAdminUser = (user) =>
  user?.is_admin === true ||
  user?.is_admin === 1 ||
  user?.is_admin === "1" ||
  user?.isAdmin === true ||
  String(user?.userRole?.name || "").toLowerCase() === "admin";

export const getUserPermissions = (user) => {
  const perms = user?.userRole?.permissions;
  if (Array.isArray(perms)) return perms;
  if (typeof perms === "string") {
    try {
      return JSON.parse(perms);
    } catch {
      return [];
    }
  }
  return [];
};

const ROLE_PERMISSION_PATH_MAP = {
  Dashboard: "/",
  "User Role": "/user-role",
  Employee: "/employee",
  Company: "/company",
  "Plant Name": "/plant-name",
  Part: "/parts",
  Process: "/process",
  "Check Item": "/checkitem",
  "Inspection Data": "/checkitem-data",
  "Assembly Line": "/assembly-line",
  "Assembly Line Status": "/assembly-line-status",
  "Assigned Assembly Lines": "/assigned-assembly-lines",
  "Daily Assembly Check": "/daily-assembly-check",
  "Assembly Line Error": "/assembly-line/error",
  "Manage Template": "/template-master",
  "Template Status": "/template-status",
  "Template Approval": "/template-approve-reject",
  "Template Report": "/template-report",
  "Form Submission": "/form-submission",
  "Manage Release Group": "/release-group",
  "Manage Workflow": "/workflow",
  "Manage Documents": "/document-management",
  "My Templates": "/assigned-templates",
  "Plc Dashboard": "/plc-data/dashboard",
  "PLC Dashboard": "/plc-data/dashboard",
  "Plc-Dashboard": "/plc-data/dashboard",
  "Live Data": "/plc-data/live",
  "Live-Data": "/plc-data/live",
  "PLC Live Data": "/plc-data/live",
  Stoppage: "/plc-data/stoppage",
  Report: "/plc-data/report",
  "QC Check": "/plc-data/qc-check",
  "Cylinder Live Ops": "/cylinder",
  "Cylinder Pipe Cutting": "/cylinder/pipe-cutting",
  "Cylinder Trace": "/cylinder/trace",
  "Cylinder Machines": "/cylinder/machines",
  "Cylinder History": "/cylinder/history",
  "Cylinder Defects": "/cylinder/defects",
};

export const getPermissionPaths = (user) => {
  const permissionList = getUserPermissions(user);

  const normalizePermissionKey = (value) =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[_\-\s]+/g, " ")
      .replace(/\s+/g, " ");

  return [...new Set(
    permissionList
      .map((item) => {
        if (typeof item !== "string") return "";
        const value = item.trim();
        if (!value) return "";
        if (value.startsWith("/")) return value;

        return (
          ROLE_PERMISSION_PATH_MAP[value] ||
          ROLE_PERMISSION_PATH_MAP[normalizePermissionKey(value)] ||
          ""
        );
      })
      .filter(Boolean),
  )];
};

export const getDefaultHomePath = (user) => {
  if (isAdminUser(user)) return "/";
  const permissions = getUserPermissions(user);
  return permissions.find((p) => typeof p === "string" && p.startsWith("/")) || "/";
};