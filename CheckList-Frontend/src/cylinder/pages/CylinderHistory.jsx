import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCylinders } from "../hooks";
import { StatusPill } from "../components/Bits";
import { cylStatusMeta } from "../theme";
import { clockTime, TOTAL_STAGES } from "../fields";

const PER_PAGE = 10;
const HEADS = ["Cylinder ID", "Model", "Heat / Batch", "Progress", "Result", "Started", "Cleared"];

export default function CylinderHistory() {
  const navigate = useNavigate();
  const { data, isLoading } = useCylinders({});
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [filter]);

  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    if (!filter.trim()) return all;
    const q = filter.trim().toLowerCase();
    return all.filter((c) => [c.id, c.heatNo, c.batchId, c.model].some((x) => String(x).toLowerCase().includes(q)));
  }, [data, filter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const paged = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Cylinder History</h1>
            <p className="mt-1 text-sm text-gray-500">Every cylinder that has run through the line. Click a row to open its full trace.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <Search size={15} className="text-gray-400" />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by ID, batch, model…"
              className="w-48 bg-transparent py-1 text-sm text-gray-700 outline-none placeholder:text-gray-400" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg sm:p-6">
          <div className="overflow-x-auto scrollbar-custom rounded-md border border-gray-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700">
                <tr>
                  {HEADS.map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-white ${i < HEADS.length - 1 ? "border-r border-white/20" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500"><Loader2 size={20} className="mx-auto animate-spin" /></td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No cylinders found.</td></tr>
                ) : paged.map((c) => {
                  const pct = Math.round((c.done / TOTAL_STAGES) * 100);
                  const meta = cylStatusMeta(c.status);
                  return (
                    <tr key={c.id} onClick={() => navigate(`/cylinder/trace/${encodeURIComponent(c.id)}`)}
                      className="cursor-pointer transition odd:bg-white even:bg-slate-50/60 hover:bg-blue-50">
                      <td className="border-b border-r border-gray-200 px-4 py-2.5 font-mono text-[13px] font-medium text-gray-900">{c.id}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-2.5 text-[13px] text-gray-700">{c.model}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-2.5 font-mono text-[12px] text-gray-500">{c.heatNo} / {c.batchId}</td>
                      <td className="border-b border-r border-gray-200 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-1.5 w-20 overflow-hidden rounded bg-slate-200">
                            <span className="block h-full rounded" style={{ width: `${pct}%`, background: c.status === "rejected" ? "#ef4444" : "#10b981" }} />
                          </span>
                          <span className="font-mono text-[11px] text-gray-500">{c.done}/{TOTAL_STAGES}</span>
                        </div>
                      </td>
                      <td className="border-b border-r border-gray-200 px-4 py-2.5"><StatusPill meta={meta} /></td>
                      <td className="border-b border-r border-gray-200 px-4 py-2.5 font-mono text-[12px] text-gray-500">{clockTime(c.startedAt)}</td>
                      <td className="border-b border-gray-200 px-4 py-2.5 font-mono text-[12px] text-gray-500">{c.clearedAt ? clockTime(c.clearedAt) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {rows.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * PER_PAGE + 1}</span>–<span className="font-medium">{Math.min(page * PER_PAGE, rows.length)}</span> of <span className="font-medium">{rows.length}</span>
              </p>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
                <span className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
