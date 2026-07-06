import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Download, Loader2, Calendar } from "lucide-react";
import { useCylinder, useCylMachines } from "../hooks";
import { useFloat } from "../useFloat";
import Gauge, { ProgressRing } from "../components/Gauge";
import StagePipeline from "../components/StagePipeline";
import { StatusPill } from "../components/Bits";
import { cylStatusMeta, STAGE_STATE, machineStatusMeta } from "../theme";
import { buildStages, doneCount, fieldMeta, fmt, clockTime, dateTime, TOTAL_STAGES } from "../fields";

const DEFAULT_ID = "Pipecutting1-60-V48002";
const CHIPS = [
  { id: "Pipecutting1-60-V48002", label: "Pipecutting1-60-V48002 · live" },
  { id: "Pipecutting1-60-V48001", label: "Pipecutting1-60-V48001 · pass" },
  { id: "Pipecutting1-60-V40997", label: "Pipecutting1-60-V40997 · reject" },
];

function LiveGauges({ machine }) {
  const vals = useFloat(machine.gaugeTags, machine.live, true);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {machine.gaugeTags.map((g) => (
        <Gauge key={g.tag} value={vals[g.tag] ?? (g.min + g.max) / 2} min={g.min} max={g.max} unit={g.unit} label={g.label} color="#f59e0b" />
      ))}
    </div>
  );
}

function StageDetail({ cell, cyl, specs, machines, defectMachine }) {
  const { station, state, record } = cell;
  const badge = {
    done: "bg-emerald-50 text-emerald-600", live: "bg-amber-50 text-amber-600",
    fail: "bg-rose-50 text-rose-600", pend: "bg-slate-100 text-slate-500",
  }[state];

  const header = (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
      <div className={`grid h-9 w-9 place-items-center rounded-lg font-mono text-[13px] font-semibold ${badge}`}>
        {String(station.index).padStart(2, "0")}
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{station.name}</h3>
        <p className="text-xs text-gray-500">
          {station.isGate ? "QA gate · " : ""}{station.captureType === "auto" ? "Machine-captured" : "Operator entry"} · Stage {station.index} of {TOTAL_STAGES}
        </p>
      </div>
      <div className="ml-auto"><StatusPill meta={STAGE_STATE[state]} /></div>
    </div>
  );

  if (state === "pend") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {header}
        <div className="px-5 py-12 text-center text-gray-500">
          <Calendar size={36} className="mx-auto mb-3 text-gray-300" />
          <div className="text-sm font-medium text-gray-600">Not reached yet</div>
          <div className="mx-auto mt-1 max-w-sm text-[13px]">This cylinder hasn't arrived at <b>{station.name}</b>. No data exists for this stage against <span className="font-mono">{cyl.id}</span> until the machine reports it.</div>
        </div>
      </div>
    );
  }

  if (state === "live") {
    const machine = machines.find((m) => m.stationKey === station.key);
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {header}
        <div className="p-5">
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            Live telemetry — streaming from <span className="font-mono">{machine?.key ?? "machine"}</span> while the cylinder is processed
          </div>
          {machine ? <LiveGauges machine={machine} /> : <div className="py-8 text-center text-sm text-gray-500">{station.name} is an operator-entry station — no live gauges.</div>}
        </div>
      </div>
    );
  }

  const data = record?.data ?? {};
  const entries = Object.entries(data);
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {header}
      <div className="p-5">
        {state === "fail" && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Out of spec — rejected here. Defect logged against <span className="font-mono">{defectMachine?.name ?? "—"}</span>
          </div>
        )}
        {record && (
          <p className="mb-4 text-xs text-gray-500">
            Values reported when <span className="font-mono">{cyl.id}</span> {state === "fail" ? "was rejected at" : "passed"} this station · {dateTime(record.ts)}
          </p>
        )}
        {entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">{station.name} completed{station.isGate ? " and passed its QA gate" : ""}. Pass/fail status only — no measured parameters.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {entries.map(([k, v]) => {
              const meta = fieldMeta(k);
              const spec = specs[k];
              const num = Number(v);
              let tone = "border-slate-200";
              let valColor = "text-gray-900";
              if (spec && Number.isFinite(num)) {
                const ok = num >= spec[0] && num <= spec[1] && state !== "fail";
                tone = ok ? "border-emerald-200" : "border-rose-200";
                valColor = ok ? "text-emerald-600" : "text-rose-600";
              }
              if (/result/i.test(k)) {
                const ok = /pass/i.test(String(v));
                tone = ok ? "border-emerald-200" : "border-rose-200";
                valColor = ok ? "text-emerald-600" : "text-rose-600";
              }
              return (
                <div key={k} className={`rounded-xl border ${tone} bg-white px-3 py-2.5 shadow-sm`}>
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">{meta.label}</div>
                  <div className={`mt-1 font-mono text-lg font-medium ${valColor}`}>
                    {String(v)}{meta.unit ? <span className="ml-1 text-[11px] text-gray-400">{meta.unit}</span> : null}
                  </div>
                  {spec ? <div className="mt-0.5 font-mono text-[10px] text-gray-400">spec {spec[0]}–{spec[1]} {meta.unit ?? ""}</div> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function downloadCert(cyl, done) {
  const lines = [
    "JAY FE CYLINDERS LIMITED — JPM GROUP", "TEST CERTIFICATE (STUB)", "----------------------------------------",
    `Cylinder serial : ${cyl.id}`, `Model           : ${cyl.model}`, `Heat / Batch    : ${cyl.heatNo} / ${cyl.batchId}`,
    `Verdict         : ${cyl.status.toUpperCase()}`, `Stages cleared  : ${done} / ${TOTAL_STAGES}`, "", "Placeholder document for development.",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
  const a = document.createElement("a"); a.href = url; a.download = `${cyl.id}-certificate.txt`; a.click();
  URL.revokeObjectURL(url);
}

export default function CylinderTrace() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const id = routeId ?? DEFAULT_ID;
  const [input, setInput] = useState(id);
  useEffect(() => setInput(id), [id]);

  const { data, isLoading, isError } = useCylinder(id);
  const { data: machines = [] } = useCylMachines();

  const [selected, setSelected] = useState(1);
  useEffect(() => {
    if (!data?.cylinder) return;
    const c = data.cylinder;
    if (c.status === "in_process") setSelected(c.currentStageIndex);
    else if (c.status === "rejected") setSelected(data.records.find((r) => r.result === "fail")?.stageIndex ?? c.currentStageIndex);
    else setSelected(TOTAL_STAGES);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.cylinder?.id]);

  const view = useMemo(() => {
    if (!data?.cylinder) return null;
    const { cylinder, records, stations, specs, defectMachine } = data;
    const stages = buildStages(cylinder, stations, records);
    const done = doneCount(cylinder, records);
    const pct = Math.round((done / TOTAL_STAGES) * 100);
    const failRec = records.find((r) => r.result === "fail");
    const cell = stages.find((s) => s.station.index === selected) ?? stages[0];
    return { cylinder, stations, specs, defectMachine, stages, done, pct, failStationName: failRec?.stationName ?? null, cell };
  }, [data, selected]);

  const search = (val) => {
    const v = (val ?? input).trim();
    if (v) navigate(`/cylinder/trace/${encodeURIComponent(v)}`);
  };

  const cyl = view?.cylinder;
  const meta = cyl ? cylStatusMeta(cyl.status) : null;
  const liveStation = cyl ? view.stations.find((s) => s.index === cyl.currentStageIndex) : null;

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Cylinder Traceability</div>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Track a cylinder across all {TOTAL_STAGES} stages</h1>
          <div className="mt-3 flex max-w-xl items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <Search size={17} className="text-gray-400" />
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Scan QR or enter cylinder ID…" spellCheck={false}
              className="flex-1 bg-transparent py-1.5 font-mono text-sm text-gray-800 outline-none placeholder:font-sans placeholder:text-gray-400" />
            <button onClick={() => search()} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Trace</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button key={c.id} onClick={() => search(c.id)} className="rounded-md border border-gray-200 bg-white px-2.5 py-1 font-mono text-[11.5px] text-gray-500 hover:border-blue-300 hover:text-blue-600">{c.label}</button>
            ))}
          </div>
        </div>

        {isLoading && <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-12 text-gray-500"><Loader2 size={22} className="animate-spin" /> Loading trace…</div>}

        {!isLoading && (isError || !cyl) && (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-500">
            <Search size={34} className="mx-auto mb-3 text-gray-300" />
            <div className="text-sm font-medium text-gray-600">No cylinder found</div>
            <div className="mt-1 text-[13px]">No record for <span className="font-mono">{id}</span>. Try a serial from the chips above.</div>
          </div>
        )}

        {view && (
          <div className="space-y-4">
            {/* Hero */}
            <div className="flex flex-wrap items-center gap-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Cylinder</div>
                <div className="text-2xl font-semibold text-gray-900">{cyl.id}</div>
                <div className="mt-2"><StatusPill meta={meta}>{cyl.status === "in_process" ? `In process · ${liveStation?.name ?? ""}` : meta.label}</StatusPill></div>
              </div>
              <div className="flex flex-wrap gap-8">
                {[["Model", cyl.model], ["Heat No", cyl.heatNo], ["Batch", cyl.batchId], ["Line", cyl.line]].map(([k, v]) => (
                  <div key={k}><div className="text-[11px] uppercase tracking-wide text-gray-400">{k}</div><div className="font-mono text-sm text-gray-800">{v}</div></div>
                ))}
              </div>
              <div className="ml-auto"><ProgressRing pct={view.pct} /></div>
            </div>

            {/* Verdict (accepted/rejected) */}
            {cyl.status !== "in_process" && (
              <div className="grid gap-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2">
                <div className="flex flex-col items-center justify-center border-b border-gray-100 pb-5 text-center md:border-b-0 md:border-r md:pb-0 md:pr-6">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Final verdict</div>
                  <div className={`my-2 text-3xl font-bold ${cyl.status === "accepted" ? "text-emerald-600" : "text-rose-600"}`}>{cyl.status === "accepted" ? "ACCEPTED" : "REJECTED"}</div>
                  <StatusPill meta={meta}>{cyl.status === "accepted" ? `All ${TOTAL_STAGES} stages cleared` : `Failed at ${view.failStationName ?? "—"}`}</StatusPill>
                  {cyl.status === "accepted" && (
                    <button onClick={() => downloadCert(cyl, view.done)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Download size={15} /> Download test certificate</button>
                  )}
                </div>
                <div className="text-sm">
                  {[["Cylinder ID", cyl.id], ["Model", cyl.model], ["Heat / Batch", `${cyl.heatNo} / ${cyl.batchId}`], ["Stages cleared", `${view.done} / ${TOTAL_STAGES}`]].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-gray-100 py-2"><span className="text-gray-500">{k}</span><span className="font-mono text-gray-800">{v}</span></div>
                  ))}
                  {cyl.status === "rejected" && (
                    <div className="flex justify-between py-2"><span className="text-gray-500">Defect machine</span><span className="font-mono text-rose-600">{view.defectMachine?.name ?? "—"}</span></div>
                  )}
                </div>
              </div>
            )}

            <StagePipeline stages={view.stages} done={view.done} selected={selected} onSelect={setSelected} />
            <StageDetail cell={view.cell} cyl={cyl} specs={view.specs} machines={machines} defectMachine={view.defectMachine} />
          </div>
        )}
      </div>
    </div>
  );
}
