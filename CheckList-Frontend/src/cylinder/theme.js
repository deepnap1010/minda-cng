// Cylinder module status → Minda light-theme styling. Tailwind classes for pills,
// hex for SVG gauges / charts. Semantics: emerald = pass/ok, amber = live/in-process,
// rose = fail/reject, slate = pending/idle.

export const STAGE_STATE = {
  done: { label: "Passed", pill: "text-emerald-700 bg-emerald-50 ring-emerald-200", dot: "bg-emerald-500", hex: "#10b981" },
  live: { label: "In process", pill: "text-amber-700 bg-amber-50 ring-amber-200", dot: "bg-amber-500", hex: "#f59e0b" },
  fail: { label: "Failed", pill: "text-rose-700 bg-rose-50 ring-rose-200", dot: "bg-rose-500", hex: "#ef4444" },
  pend: { label: "Pending", pill: "text-slate-500 bg-slate-100 ring-slate-200", dot: "bg-slate-400", hex: "#94a3b8" },
};

// Cylinder lifecycle status → stage-state styling + label
export function cylStatusMeta(status) {
  if (status === "accepted") return { ...STAGE_STATE.done, label: "Accepted" };
  if (status === "rejected") return { ...STAGE_STATE.fail, label: "Rejected" };
  return { ...STAGE_STATE.live, label: "In process" };
}

// Machine status → styling + label
export function machineStatusMeta(status) {
  if (status === "run") return { label: "Running", pill: "text-emerald-700 bg-emerald-50 ring-emerald-200", dot: "bg-emerald-500", hex: "#10b981" };
  if (status === "error") return { label: "Error", pill: "text-rose-700 bg-rose-50 ring-rose-200", dot: "bg-rose-500", hex: "#ef4444" };
  return { label: "Idle", pill: "text-slate-500 bg-slate-100 ring-slate-200", dot: "bg-slate-400", hex: "#94a3b8" };
}

export const GAUGE_TRACK = "#e2e8f0"; // slate-200
