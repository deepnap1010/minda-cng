import { fmt } from "../fields";
import { GAUGE_TRACK } from "../theme";

function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}
function arc(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const lg = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0} ${y0} A${r} ${r} 0 ${lg} 1 ${x1} ${y1}`;
}

export default function Gauge({ value, min, max, unit, label, color = "#10b981" }) {
  const cx = 100, cy = 92, r = 72;
  let f = (value - min) / (max - min);
  f = Math.max(0, Math.min(1, f));
  const aEnd = 180 - f * 180;
  const [nx, ny] = polar(cx, cy, r - 14, aEnd);
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
      <div className="mb-1 text-[11px] font-medium text-slate-500">{label}</div>
      <svg viewBox="0 0 200 110" className="mx-auto block w-full max-w-[170px]">
        <path d={arc(cx, cy, r, 180, 0)} stroke={GAUGE_TRACK} strokeWidth={11} fill="none" strokeLinecap="round" />
        <path d={arc(cx, cy, r, 180, aEnd)} stroke={color} strokeWidth={11} fill="none" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill={color} />
      </svg>
      <div className="-mt-7 font-mono text-2xl font-semibold tabular-nums" style={{ color }}>
        {fmt(value)}
      </div>
      <div className="mt-0.5 mb-1.5 text-[11px] text-slate-400">{unit}</div>
      <div className="-mt-1 flex justify-between px-4 font-mono text-[9.5px] text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function ProgressRing({ pct }) {
  const r = 30, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  const col = pct >= 100 ? "#10b981" : "#f59e0b";
  return (
    <svg width="78" height="78" viewBox="0 0 78 78">
      <circle cx="39" cy="39" r={r} stroke="#e2e8f0" strokeWidth="7" fill="none" />
      <circle cx="39" cy="39" r={r} stroke={col} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 39 39)" />
      <text x="39" y="44" textAnchor="middle" fontWeight="700" fontSize="18" fill="#0f172a">{pct}%</text>
    </svg>
  );
}
