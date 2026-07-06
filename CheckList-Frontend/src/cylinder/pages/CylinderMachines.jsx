import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, AlertTriangle, Loader2, Search, Calendar, X, UserCog, Scissors } from "lucide-react";
import { useCylMachines, useCylMachine, useCngOperators, useSetMachineOperator, useStageRecords } from "../hooks";
import { useFloat } from "../useFloat";
import Gauge from "../components/Gauge";
import { StatusPill, Sparkline } from "../components/Bits";
import { machineStatusMeta, cylStatusMeta } from "../theme";
import { fmt, clockTime, fieldMeta, dateTime } from "../fields";
import { stationName } from "../adapt";

function MachineCard({ m }) {
  const navigate = useNavigate();
  const sm = machineStatusMeta(m.status);
  const vals = useFloat(m.gaugeTags, m.live, m.status !== "idle");
  const primG = m.gaugeTags.find((g) => g.tag === m.primaryTag);
  const primVal = vals[m.primaryTag] ?? m.primaryValue;
  const lastShort = m.lastCylinderId?.split("-").pop() ?? "—";

  return (
    <div onClick={() => navigate(`/cylinder/machines/${encodeURIComponent(m.key)}`)}
      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">{m.name}</div>
          <div className="font-mono text-[11px] text-gray-400">{m.key} · {m.line || `St ${m.stationIndex}`}</div>
        </div>
        <StatusPill meta={sm} />
      </div>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">{primG?.label ?? m.primaryTag ?? "—"}</div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-3xl font-semibold tabular-nums ${m.status === "error" ? "text-rose-600" : "text-gray-900"}`}>
          {primVal != null ? fmt(primVal) : "—"}
        </span>
        <span className="text-xs text-gray-500">{m.primaryUnit}</span>
      </div>
      <div className="my-2"><Sparkline seed={m.key} color={m.status === "error" ? "#ef4444" : "#10b981"} /></div>
      <div className="flex gap-4 border-t border-gray-100 pt-3">
        {m.secondary?.map((s) => (
          <div key={s.tag}>
            <div className="text-[10px] uppercase tracking-wide text-gray-400">{s.label}</div>
            <div className="font-mono text-[13px] text-gray-700">{vals[s.tag] != null ? fmt(vals[s.tag]) : fmt(s.value)} {s.unit}</div>
          </div>
        ))}
        <div className="ml-auto text-right">
          <div className="text-[10px] uppercase tracking-wide text-gray-400">Last cyl</div>
          <div className="font-mono text-[13px] text-gray-700">{lastShort}</div>
        </div>
      </div>
      {m.status === "error" && (
        <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-rose-600">
          <AlertTriangle size={13} /> {m.errorMsg}
        </div>
      )}
    </div>
  );
}

function LiveGauges({ machine }) {
  const vals = useFloat(machine.gaugeTags, machine.live, machine.status === "run" || machine.status === "error");
  const color = machineStatusMeta(machine.status).hex;
  if (!machine.gaugeTags?.length) {
    return <div className="py-8 text-center text-sm text-gray-500">No numeric readings yet for this machine.</div>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {machine.gaugeTags.map((g) => (
        <Gauge key={g.tag} value={vals[g.tag] ?? (g.min + g.max) / 2} min={g.min} max={g.max} unit={g.unit} label={g.label} color={color} />
      ))}
    </div>
  );
}

// ── Cutting Stage Data (manual stage 1) ──────────────────────────────────────
// Pipe Cutting is an operator-entry stage — no PLC feeds it, so gauges are
// meaningless there. Mirror the factory's own JFE screen instead: a table of
// the values submitted with each Pipe ID, newest first.
const CUT_COL_ORDER = [
  "heatNo", "batchNo", "grade", "od", "wall", "cutLength", "cutWeight",
  "lengthA", "lengthB", "lengthC", "thkA", "thkB", "thkC", "taper", "diameter",
  "line", "shift",
];

function CuttingStageTable() {
  const navigate = useNavigate();
  const { data: records = [], isLoading } = useStageRecords({ stageNo: 1, limit: 25 });

  const cols = useMemo(() => {
    const present = new Set();
    records.forEach((r) => Object.keys(r.metrics || {}).forEach((k) => {
      if (k !== "remark" && k !== "result") present.add(k);
    }));
    const ordered = CUT_COL_ORDER.filter((k) => present.has(k));
    const extras = [...present].filter((k) => !CUT_COL_ORDER.includes(k)).sort();
    return [...ordered, ...extras].slice(0, 10);
  }, [records]);

  if (isLoading && !records.length) {
    return <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500"><Loader2 size={18} className="animate-spin" /> Loading entries…</div>;
  }
  if (!records.length) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        No cutting entries yet. <button onClick={() => navigate("/cylinder/pipe-cutting")} className="font-medium text-blue-600 hover:underline">Make the first entry →</button>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/70 text-left">
            <th className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">S.No</th>
            <th className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">Pipe ID</th>
            {cols.map((k) => {
              const meta = fieldMeta(k);
              return <th key={k} className="whitespace-nowrap px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">{meta.label}{meta.unit ? ` (${meta.unit})` : ""}</th>;
            })}
            <th className="whitespace-nowrap px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">Entered at</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.recordId || i} onClick={() => navigate(`/cylinder/trace/${encodeURIComponent(r.pipeId)}`)}
              className="cursor-pointer border-t border-gray-100 hover:bg-blue-50/50">
              <td className="px-3 py-2 text-[12px] text-gray-400">{i + 1}</td>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px] font-medium text-gray-800">{r.pipeId}</td>
              {cols.map((k) => {
                const v = r.metrics?.[k];
                return <td key={k} className="whitespace-nowrap px-3 py-2 font-mono text-[12px] tabular-nums text-gray-700">{v === undefined || v === null || v === "" ? "—" : typeof v === "number" ? fmt(v) : String(v)}</td>;
              })}
              <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-gray-400">{dateTime(r.recordedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Machines list (grid) + filter bar ────────────────────────────────────────
const STATUS_OPTS = [
  { key: "all", label: "All" },
  { key: "run", label: "Running" },
  { key: "idle", label: "Idle" },
  { key: "error", label: "Error" },
];

function FilterBar({ q, setQ, status, setStatus, stage, setStage, counts, stages }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
        <Search size={15} className="text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search machine…"
          className="w-44 bg-transparent py-1 text-sm text-gray-700 outline-none placeholder:text-gray-400" />
        {q && <button onClick={() => setQ("")} aria-label="clear search"><X size={14} className="text-gray-400 hover:text-gray-600" /></button>}
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
        {STATUS_OPTS.map((s) => (
          <button key={s.key} onClick={() => setStatus(s.key)}
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition ${status === s.key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            {s.label}
            <span className={`ml-1.5 text-[11px] ${status === s.key ? "text-blue-100" : "text-gray-400"}`}>{counts[s.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <select value={stage} onChange={(e) => setStage(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none">
        <option value="all">All stages</option>
        {stages.map((st) => <option key={st} value={st}>St {st} — {stationName(st)}</option>)}
      </select>
    </div>
  );
}

function MachineList() {
  const { data: machines = [], isLoading } = useCylMachines();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [stage, setStage] = useState("all");

  const counts = useMemo(() => {
    const c = { all: machines.length, run: 0, idle: 0, error: 0 };
    machines.forEach((m) => { c[m.status] = (c[m.status] || 0) + 1; });
    return c;
  }, [machines]);

  const stages = useMemo(
    () => [...new Set(machines.map((m) => m.stationIndex).filter((x) => typeof x === "number"))].sort((a, b) => a - b),
    [machines]
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return machines.filter((m) =>
      (status === "all" || m.status === status) &&
      (stage === "all" || String(m.stationIndex) === String(stage)) &&
      (!qq || (m.name || "").toLowerCase().includes(qq) || (m.key || "").toLowerCase().includes(qq))
    );
  }, [machines, q, status, stage]);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Machines · Line 2</h1>
          <p className="mt-1 text-sm text-gray-500">Each card shows what the machine is reporting right now. Open one for live gauges &amp; history.</p>
        </div>

        <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} stage={stage} setStage={setStage} counts={counts} stages={stages} />

        {isLoading && !machines.length ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-10 text-gray-500"><Loader2 size={22} className="animate-spin" /> Loading machines…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white py-10 text-center text-sm text-gray-500">
            {machines.length === 0 ? "No machines have reported yet." : "No machines match these filters."}
          </div>
        ) : (
          <>
            <div className="mb-2 text-xs text-gray-400">Showing {filtered.length} of {machines.length} machines</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((m) => <MachineCard key={m.key} m={m} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Machine detail (live gauges + recent cylinders + date range) ──────────────
function OperatorPicker({ machineId, operatorUserId }) {
  const { data: operators = [] } = useCngOperators();
  const setOp = useSetMachineOperator();
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-400">Assigned operator</div>
      <div className="mt-1 flex items-center gap-2">
        <UserCog size={15} className="text-gray-400" />
        <select
          value={operatorUserId || ""}
          disabled={setOp.isPending}
          onChange={(e) => setOp.mutate({ machineId, operatorUserId: e.target.value || null })}
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-800 outline-none focus:border-blue-300"
        >
          <option value="">— unassigned —</option>
          {operators.map((o) => (
            <option key={o._id} value={o._id}>{o.full_name || o.email}{o.user_id ? ` (${o.user_id})` : ""}</option>
          ))}
        </select>
        {setOp.isPending && <Loader2 size={14} className="animate-spin text-gray-400" />}
      </div>
      <div className="mt-0.5 text-[10.5px] text-gray-400">Alerted when a cylinder reaches this stage.</div>
    </div>
  );
}

function MachineDetail({ data, dateProps }) {
  const navigate = useNavigate();
  const m = { ...data.machine, live: data.live };
  const sm = machineStatusMeta(m.status);
  const lastShort = m.lastCylinderId?.split("-").pop() ?? "—";
  const { from, to, setFrom, setTo } = dateProps;
  // Stage 1 (Pipe Cutting) is operator-entered — show the submitted values per
  // Pipe ID (like the plant's own JFE screen), not live gauges. Name fallback:
  // a production machine row may exist before anyone maps its stage_no.
  const isManualStage = m.stationIndex === 1 || /pipe\s*cut/i.test(m.name || "");

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">
        <button onClick={() => navigate("/cylinder/machines")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ChevronLeft size={16} /> All machines
        </button>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Machine</div>
            <div className="text-2xl font-semibold text-gray-900">{m.name}</div>
            <div className="mt-2"><StatusPill meta={sm}>{sm.label} · {m.key}</StatusPill></div>
          </div>
          <div className="flex flex-wrap items-start gap-8">
            <div><div className="text-[11px] uppercase tracking-wide text-gray-400">Station</div><div className="font-mono text-sm text-gray-800">{m.line || `St ${m.stationIndex}`}</div></div>
            <div><div className="text-[11px] uppercase tracking-wide text-gray-400">Active cylinder</div><div className="font-mono text-sm text-gray-800">{lastShort}</div></div>
            <OperatorPicker machineId={m.key} operatorUserId={data.operatorUserId} />
          </div>
        </div>

        {m.status === "error" ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            <AlertTriangle size={16} /> {m.errorMsg} — last on <span className="font-mono">{lastShort}</span>
          </div>
        ) : isManualStage ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            <Scissors size={15} /> Operator-entry stage — the table shows the values submitted with each Pipe ID.
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" /> Live readings — gauges update as the machine reports.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
            {isManualStage ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Cutting stage data — entered per Pipe ID</div>
                  <button onClick={() => navigate("/cylinder/pipe-cutting")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-blue-700">
                    <Scissors size={13} /> New entry
                  </button>
                </div>
                <CuttingStageTable />
              </>
            ) : (
              <>
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Live gauges</div>
                <LiveGauges machine={m} />
              </>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="px-5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Recent cylinders at this machine</div>
            {/* date range filter */}
            <div className="flex flex-wrap items-center gap-2 px-5 pb-3 pt-1">
              <Calendar size={13} className="text-gray-400" />
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="rounded border border-gray-200 px-2 py-1 text-[12px] text-gray-600 outline-none focus:border-blue-300" />
              <span className="text-[11px] text-gray-400">to</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="rounded border border-gray-200 px-2 py-1 text-[12px] text-gray-600 outline-none focus:border-blue-300" />
              {(from || to) && (
                <button onClick={() => { setFrom(""); setTo(""); }} className="text-[11px] font-medium text-blue-600 hover:underline">Clear</button>
              )}
            </div>
            {data.recent.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-gray-500">
                {from || to ? "No cylinders in this date range." : "No cylinders processed here yet."}
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <tbody>
                  {data.recent.map((r, i) => {
                    const meta = cylStatusMeta(r.status);
                    return (
                      <tr key={`${r.cylinderId}-${i}`} onClick={() => navigate(`/cylinder/trace/${encodeURIComponent(r.cylinderId)}`)}
                        className="cursor-pointer border-t border-gray-100 hover:bg-blue-50/50">
                        <td className="px-5 py-2.5 font-mono text-[12px] text-gray-800">{r.cylinderId}</td>
                        <td className="px-2 py-2.5"><StatusPill meta={meta} /></td>
                        <td className="px-3 py-2.5 text-right font-mono text-[11px] text-gray-400">{clockTime(r.ts)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MachineDetailContainer({ mkey }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: detail, isLoading } = useCylMachine(mkey, { from, to });

  if (isLoading && !detail) {
    return <div className="flex items-center justify-center gap-2 py-16 text-gray-500"><Loader2 size={22} className="animate-spin" /> Loading machine…</div>;
  }
  if (!detail) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-gray-500">Machine <span className="font-mono">{mkey}</span> not found.</div>;
  }
  return <MachineDetail data={detail} dateProps={{ from, to, setFrom, setTo }} />;
}

export default function CylinderMachines() {
  const { key } = useParams();
  if (key) return <MachineDetailContainer mkey={key} />;
  return <MachineList />;
}
