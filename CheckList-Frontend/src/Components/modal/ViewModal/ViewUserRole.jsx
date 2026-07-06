import { X, ShieldCheck, Calendar, Layers } from "lucide-react";
import { PERMISSION_MAP, PERMISSION_MODULES } from "../addModal/AddUserRoleModal";

const ViewUserRole = ({ open, onClose, data }) => {
  if (!open || !data) return null;

  const permissions =
    data.permissions?.map(
      (path) =>
        Object.keys(PERMISSION_MAP).find(
          (key) => PERMISSION_MAP[key] === path
        ) || path
    ) || [];

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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      {/* PANEL */}
      <div className="bg-white h-screen w-full sm:w-[720px] xl:w-[820px] shadow-2xl animate-slideLeft flex flex-col">
        {/* HEADER */}
        <div className="px-8 py-6 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              User role Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Read-only user-role information
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          {/* BASIC INFO */}
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold">
              <ShieldCheck size={18} />
              Role Information
            </div>

            <InfoRow label="Role Name" value={data.name} />
            <InfoRow label="Description" value={data.description || "—"} />
          </section>

          {/* PERMISSIONS */}
          <section className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
              <Layers size={18} />
              Permissions
            </div>

            {permissions.length ? (
              <div className="flex flex-wrap gap-2">
                {permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-white border text-green-700"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No permissions assigned</p>
            )}
          </section>

          {/* METADATA */}
          <section className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-3 text-red-700 font-semibold">
              <Calendar size={18} />
              Metadata
            </div>

            <InfoRow label="Created On" value={formatDate(data.createdAt)} />
            <InfoRow label="Last Updated" value={formatDate(data.updatedAt)} />
          </section>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between text-sm py-1">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 text-right max-w-[60%] break-words">
      {value}
    </span>
  </div>
);

export default ViewUserRole;
