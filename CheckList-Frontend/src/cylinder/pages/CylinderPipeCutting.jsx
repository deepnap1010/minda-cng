import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scissors, Search, Loader2, CheckCircle2, Plus, ArrowRight, AlertCircle, Lock } from "lucide-react";
import { useCreateCylinder, useCylinder } from "../hooks";
import { PageHeader, StatusPill } from "../components/Bits";
import { fieldMeta, dateTime } from "../fields";

// Stage 1 (Pipe Cutting) operator-entry station.
// - New Cut: operator enters the cut setup; a unique Pipe ID is minted server-side
//   on submit (the cylinder is "born") and the config is saved as the Stage-1 record.
// - Look Up: enter an existing Pipe ID → the config recorded at cut time shows read-only.

const SHIFTS = ["Day", "Evening", "Night"];
const RESULTS = ["Pass", "Reject"];

const FIELDS = [
  { group: "Material & Identity", items: [
    { k: "heatNo", label: "Heat No", type: "text", ph: "e.g. H24-8891" },
    { k: "batchNo", label: "Batch No", type: "text", ph: "e.g. B-2207" },
    { k: "grade", label: "Material Grade", type: "text", ph: "e.g. 34CrMo4" },
  ] },
  { group: "Cut Dimensions", items: [
    { k: "od", label: "Pipe OD", type: "number", unit: "mm", ph: "232" },
    { k: "wall", label: "Wall Thickness", type: "number", unit: "mm", ph: "5.8" },
    { k: "cutLength", label: "Cut Length", type: "number", unit: "mm", ph: "895", required: true },
    { k: "cutWeight", label: "Cut Weight", type: "number", unit: "kg", ph: "42.5" },
  ] },
  { group: "Production Context", items: [
    { k: "line", label: "Line", type: "text", ph: "L1", required: true },
    { k: "shift", label: "Shift", type: "select", options: SHIFTS },
  ] },
  { group: "Result", items: [
    { k: "result", label: "Cutting Result", type: "select", options: RESULTS },
    { k: "remark", label: "Remark", type: "text", ph: "optional note" },
  ] },
];

const passMeta = { pill: "bg-emerald-50 text-emerald-600 ring-emerald-200", dot: "bg-emerald-500", label: "Passed" };
const rejectMeta = { pill: "bg-rose-50 text-rose-600 ring-rose-200", dot: "bg-rose-500", label: "Rejected" };
const procMeta = { pill: "bg-amber-50 text-amber-600 ring-amber-200", dot: "bg-amber-500", label: "In process" };

function asObj(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  try { return JSON.parse(v) || {}; } catch { return {}; }
}

function ConfigGrid({ data }) {
  const entries = Object.entries(asObj(data)).filter(([, v]) => v !== "" && v != null);
  if (!entries.length) return <div className="py-6 text-center text-sm text-gray-500">No cut parameters recorded.</div>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entries.map(([k, v]) => {
        const meta = fieldMeta(k);
        const isResult = /result/i.test(k);
        const good = /pass|ok/i.test(String(v));
        const valColor = isResult ? (good ? "text-emerald-600" : "text-rose-600") : "text-gray-900";
        const tone = isResult ? (good ? "border-emerald-200" : "border-rose-200") : "border-slate-200";
        return (
          <div key={k} className={`rounded-xl border ${tone} bg-white px-3 py-2.5 shadow-sm`}>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">{meta.label}</div>
            <div className={`mt-1 font-mono text-lg font-medium ${valColor}`}>
              {String(v)}{meta.unit ? <span className="ml-1 text-[11px] text-gray-400">{meta.unit}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CylinderPipeCutting() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("new");
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Pipe Cutting — Operator Entry"
        subtitle="Stage 1 · the birth of a cylinder. Enter the cut setup and a unique Pipe ID is generated on submit."
      />
      <div className="mb-5 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        {[["new", "New Cut Entry"], ["lookup", "Look Up Cylinder"]].map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${mode === m ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "new" ? <NewCut navigate={navigate} /> : <LookUp navigate={navigate} />}
    </div>
  );
}

function NewCut({ navigate }) {
  const [form, setForm] = useState({ result: "Pass", shift: "Day", line: "L1" });
  const [created, setCreated] = useState(null);
  const create = useCreateCylinder();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const metrics = {};
    FIELDS.forEach((g) => g.items.forEach(({ k, type }) => {
      const v = form[k];
      if (v === "" || v == null) return;
      metrics[k] = type === "number" ? Number(v) : v;
    }));
    const status = /reject/i.test(form.result || "") ? "fault" : "ok";
    create.mutate({ line: form.line, status, metrics }, { onSuccess: (data) => setCreated(data) });
  };

  if (created) {
    const cfg = created.record?.metrics || created.record?.data || {};
    const rejected = /reject|fault/i.test(String(cfg.result || created.record?.status || ""));
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50"><CheckCircle2 className="text-emerald-500" size={22} /></div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Cylinder created</h3>
            <p className="text-xs text-gray-500">Stage-1 cut recorded · {dateTime(created.record?.recorded_at || created.record?.ts)}</p>
          </div>
          <div className="ml-auto"><StatusPill meta={rejected ? rejectMeta : passMeta} /></div>
        </div>
        <div className="p-5">
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">Pipe ID · auto-generated</span>
            <span className="font-mono text-lg font-semibold text-blue-700">{created.pipeId}</span>
          </div>
          <ConfigGrid data={cfg} />
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/cylinder/trace/${encodeURIComponent(created.pipeId)}`)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              View full trace <ArrowRight size={15} />
            </button>
            <button
              onClick={() => { setCreated(null); setForm({ result: "Pass", shift: "Day", line: form.line }); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus size={15} /> New entry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50"><Scissors className="text-blue-600" size={18} /></div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">New pipe cut</h3>
          <p className="text-xs text-gray-500">Fill the cut setup — the Pipe ID is minted automatically when you commit.</p>
        </div>
      </div>
      <div className="space-y-6 p-5">
        {FIELDS.map((g) => (
          <div key={g.group}>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{g.group}</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.items.map((f) => (
                <div key={f.k}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {f.label}{f.unit ? <span className="text-gray-400"> ({f.unit})</span> : null}{f.required ? <span className="text-rose-500"> *</span> : null}
                  </label>
                  {f.type === "select" ? (
                    <select
                      value={form[f.k] ?? ""}
                      onChange={(e) => set(f.k, e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    >
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      step={f.type === "number" ? "any" : undefined}
                      value={form[f.k] ?? ""}
                      placeholder={f.ph}
                      onChange={(e) => set(f.k, e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {create.isError && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            <AlertCircle size={16} /> {create.error?.response?.data?.message || create.error?.message || "Could not save. Please try again."}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
        <p className="text-xs text-gray-400">Operator &amp; timestamp are captured automatically from your session.</p>
        <button
          type="submit"
          disabled={create.isPending || !form.line || !form.cutLength}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {create.isPending ? <Loader2 size={15} className="animate-spin" /> : <Scissors size={15} />}
          Commit cut &amp; mint Pipe ID
        </button>
      </div>
    </form>
  );
}

function LookUp({ navigate }) {
  const [text, setText] = useState("");
  const [queryId, setQueryId] = useState("");
  const { data: view, isLoading, isError } = useCylinder(queryId);

  const go = (e) => { e.preventDefault(); setQueryId(text.trim()); };

  const cyl = view?.cylinder;
  const stage1 = view?.records?.find((r) => r.stageIndex === 1) || null;
  const statusMeta = cyl?.status === "rejected" ? rejectMeta : cyl?.status === "accepted" ? passMeta : procMeta;

  return (
    <div>
      <form onSubmit={go} className="mb-5 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Scan or enter a Pipe ID…"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>
        <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">Look up</button>
      </form>

      {!queryId ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
          Enter a Pipe ID to view the cut configuration recorded at Stage 1.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
      ) : isError || !cyl ? (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center">
          <AlertCircle className="mx-auto mb-2 text-gray-300" size={30} />
          <div className="text-sm font-medium text-gray-600">No cylinder found</div>
          <div className="mt-1 text-[13px] text-gray-500">Nothing exists for <span className="font-mono">{queryId}</span>.</div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500"><Lock size={16} /></div>
            <div>
              <h3 className="font-mono text-base font-semibold text-gray-900">{cyl.id}</h3>
              <p className="text-xs text-gray-500">Stage-1 cut configuration{stage1 ? ` · recorded ${dateTime(stage1.ts)}` : ""} · read-only</p>
            </div>
            <div className="ml-auto"><StatusPill meta={statusMeta} /></div>
          </div>
          <div className="p-5">
            {stage1 ? (
              <>
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] text-slate-600">
                  <Lock size={14} /> Already cut at Stage 1 — showing the configuration set at that time. History is preserved.
                </div>
                <ConfigGrid data={stage1.data} />
              </>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">This cylinder exists but has no Stage-1 cut configuration recorded.</div>
            )}
            <div className="mt-5">
              <button
                onClick={() => navigate(`/cylinder/trace/${encodeURIComponent(cyl.id)}`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View full trace <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
