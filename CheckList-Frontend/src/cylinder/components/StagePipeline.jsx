import { useEffect, useRef } from "react";
import { STAGE_STATE } from "../theme";

const BOX = {
  done: "border-emerald-200 bg-emerald-50",
  live: "border-amber-300 bg-amber-50",
  fail: "border-rose-200 bg-rose-50",
  pend: "border-slate-200 bg-white",
};
const RING = {
  done: "border-emerald-500",
  live: "border-amber-500 ring-4 ring-amber-100",
  fail: "border-rose-500",
  pend: "border-slate-300",
};
const DOT = { done: "bg-emerald-500", live: "bg-amber-500", fail: "bg-rose-500", pend: "bg-slate-300" };
const NAME = { done: "text-gray-800", live: "text-gray-900", fail: "text-rose-700", pend: "text-slate-500" };

export default function StagePipeline({ stages, done, selected, onSelect }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current?.querySelector(`[data-idx="${selected}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected, stages.length]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium text-gray-800">
          Stage pipeline
          <span className="ml-2 text-xs font-normal text-gray-400">{done}/{stages.length} cleared · ◇ = QA gate</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["done", "live", "fail", "pend"].map((s) => (
            <span key={s} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STAGE_STATE[s].pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STAGE_STATE[s].dot}`} />
              {STAGE_STATE[s].label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-custom pb-2" ref={ref}>
        <div className="flex min-w-max items-stretch pt-1">
          {stages.map((cell) => {
            const i = cell.station.index;
            const st = cell.state;
            const sel = i === selected;
            return (
              <div
                key={cell.station.key}
                data-idx={i}
                onClick={() => onSelect(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(i); } }}
                className="relative w-[120px] shrink-0 cursor-pointer pt-7"
              >
                <div className={`absolute top-[34px] left-0 right-0 h-[3px] ${st === "done" || st === "live" ? "bg-emerald-400" : "bg-slate-200"} ${i === 1 ? "left-1/2" : ""} ${i === stages.length ? "right-1/2" : ""}`} />
                <div className={`absolute top-[26px] left-1/2 z-10 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full border-[3px] bg-white ${RING[st]}`}>
                  <span className={`h-2 w-2 rounded-full ${DOT[st]} ${st === "live" ? "animate-pulse" : ""}`} />
                </div>
                <div className={`mt-7 rounded-lg border px-2 py-2.5 text-center transition ${BOX[st]} ${sel ? "outline outline-2 outline-blue-400" : ""}`}>
                  <div className="font-mono text-[10px] text-slate-400">
                    {String(i).padStart(2, "0")}{cell.station.isGate ? " ◇" : ""}
                  </div>
                  <div className={`mt-0.5 text-[11.5px] font-medium leading-tight ${NAME[st]}`}>{cell.station.name}</div>
                  <div className={`mt-1 text-[9.5px] font-semibold uppercase tracking-wide ${st === "done" ? "text-emerald-600" : st === "live" ? "text-amber-600" : st === "fail" ? "text-rose-600" : "text-slate-400"}`}>
                    {STAGE_STATE[st].label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
