import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCylDefects } from "../hooks";
import { KpiCard } from "../components/Bits";
import { dateTime } from "../fields";

const BATCH = "7-09335";
const HEADS = ["Cylinder ID", "Failed at", "Machine", "Captured", "Spec", "Batch", "Time"];

export default function CylinderDefects() {
  const navigate = useNavigate();
  const { data, isLoading } = useCylDefects(BATCH);
  const kpis = data?.kpis;
  const rows = data?.rows ?? [];

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Defects &amp; Rejections</h1>
          <p className="mt-1 text-sm text-gray-500">Cylinders that failed a stage — with the machine that produced the defect, captured values, and batch.</p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <KpiCard label="Rejects this batch" value={kpis?.rejects ?? "—"} subtitle={`Batch ${BATCH}`} accent="text-rose-600" border="border-rose-100" bg="bg-rose-50" />
          <KpiCard label="Top defect stage" value={<span className="text-xl">{kpis?.topStage ?? "—"}</span>} subtitle={kpis ? `${kpis.topStageCount} of ${kpis.rejects} rejects` : ""} accent="text-gray-900" border="border-purple-100" bg="bg-purple-50" />
          <KpiCard label="Machine flagged" value={<span className="text-xl">{kpis?.machineFlagged ?? "—"}</span>} subtitle="recurring · check sensor" accent="text-rose-600" border="border-rose-100" bg="bg-rose-50" />
        </div>

        <div className="overflow-x-auto scrollbar-custom rounded-lg border border-gray-200 bg-white shadow-lg">
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
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No defects recorded.</td></tr>
              ) : rows.map((d, i) => (
                <tr key={`${d.cylinderId}-${i}`} onClick={() => navigate(`/cylinder/trace/${encodeURIComponent(d.cylinderId)}`)}
                  className="cursor-pointer transition odd:bg-white even:bg-slate-50/60 hover:bg-blue-50">
                  <td className="border-b border-r border-gray-200 px-4 py-2.5 font-mono text-[13px] font-medium text-gray-900">{d.cylinderId}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-2.5">
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200">{d.stationName}</span>
                  </td>
                  <td className="border-b border-r border-gray-200 px-4 py-2.5 font-mono text-[12px] font-medium text-rose-600">{d.machineKey}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-2.5 font-mono text-[12px] text-gray-900">{d.captured}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-2.5 font-mono text-[12px] text-gray-500">{d.spec}</td>
                  <td className="border-b border-r border-gray-200 px-4 py-2.5 font-mono text-[12px] text-gray-500">{d.batch}</td>
                  <td className="border-b border-gray-200 px-4 py-2.5 font-mono text-[12px] text-gray-500">{dateTime(d.ts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
