import { useMemo } from "react";

// Status pill (uses a theme meta object: { pill, dot, label })
export function StatusPill({ meta, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${meta.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {children ?? meta.label}
    </span>
  );
}

// Minda-style KPI / summary card
export function KpiCard({ label, value, subtitle, accent = "text-gray-900", border = "border-gray-100", bg = "bg-white", icon }) {
  return (
    <div className={`rounded-xl border ${border} ${bg} px-4 py-3 shadow-sm`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-600">{label}</p>
        {icon ? <span className="text-gray-400">{icon}</span> : null}
      </div>
      <p className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
    </div>
  );
}

// Decorative sparkline (stable per seed)
export function Sparkline({ seed, color = "#10b981" }) {
  const pts = useMemo(() => {
    let v = 20;
    const a = [];
    for (let i = 0; i < 24; i++) {
      v += (Math.random() - 0.5) * 8;
      v = Math.max(6, Math.min(30, v));
      a.push(v);
    }
    const step = 240 / 23;
    return a.map((p, i) => `${i * step},${34 - p}`).join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
  return (
    <svg viewBox="0 0 240 34" preserveAspectRatio="none" className="h-8 w-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

// Page header bar matching Minda's report pages
export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}
