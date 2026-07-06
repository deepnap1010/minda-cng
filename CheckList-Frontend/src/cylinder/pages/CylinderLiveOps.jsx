import { useNavigate } from "react-router-dom";
import { CheckCircle2, Activity, AlertTriangle, Cpu, RefreshCw, Loader2 } from "lucide-react";
import { useCylOps } from "../hooks";
import { KpiCard, PageHeader } from "../components/Bits";
import { timeAgo } from "../fields";

export default function CylinderLiveOps() {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, refetch } = useCylOps();
  const k = data?.kpis;
  const occupancy = data?.occupancy ?? [];
  const feed = data?.feed ?? [];

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">
        <PageHeader
          title="Cylinder — Live Operations"
          subtitle="Bawal Plant · Line 2"
          right={
            <button onClick={() => refetch()} disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> Refresh
            </button>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-10 text-gray-500">
            <Loader2 size={22} className="animate-spin" /> Loading operations…
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Cleared today" value={k?.clearedToday ?? "—"} subtitle="Accepted & cleared"
                accent="text-emerald-600" border="border-emerald-100" bg="bg-emerald-50" icon={<CheckCircle2 size={18} />} />
              <KpiCard label="In process now" value={k?.inProcess ?? "—"} subtitle="Across 21 stages"
                accent="text-amber-600" border="border-amber-100" bg="bg-amber-50" icon={<Activity size={18} />} />
              <KpiCard label="Rejected today" value={k?.rejectedToday ?? "—"} subtitle="Hardness-led"
                accent="text-rose-600" border="border-rose-100" bg="bg-rose-50" icon={<AlertTriangle size={18} />} />
              <KpiCard label="Machines online" value={k ? `${k.machinesOnline} / ${k.machinesTotal}` : "—"}
                subtitle={k?.errorMachine ? `1 in error · ${k.errorMachine}` : "All online"}
                accent="text-blue-600" border="border-blue-100" bg="bg-blue-50" icon={<Cpu size={18} />} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {/* Occupancy */}
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">Line 2 — stage occupancy</h2>
                    <p className="text-xs text-gray-500">Cylinders currently at each station</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" /> Live
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {occupancy.map((o, i) => {
                    const rej = o.kind === "reject";
                    return (
                      <div key={`${o.cylinderId}-${i}`} onClick={() => navigate(`/cylinder/trace/${encodeURIComponent(o.cylinderId)}`)}
                        className="flex cursor-pointer items-center gap-3 py-2.5 hover:bg-gray-50">
                        <div className={`grid h-7 w-7 place-items-center rounded-md font-mono text-[11px] font-semibold ${rej ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                          {String(o.index).padStart(2, "0")}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">{o.stationName}</div>
                          <div className="font-mono text-[11px] text-gray-400">{o.cylinderShort}</div>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${rej ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>
                          {rej ? "Reject" : "Processing"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent activity */}
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-gray-800">Recent activity</h2>
                <div className="divide-y divide-gray-100">
                  {feed.map((f, i) => (
                    <div key={`${f.cylinderId}-${i}`} className="flex items-center gap-3 py-2.5">
                      <span className={`h-2 w-2 rounded-full ${f.result === "fail" ? "bg-rose-500" : "bg-emerald-500"}`} />
                      <div className="flex-1 text-[12.5px] text-gray-700">
                        <span className="font-mono">{f.cylinderShort}</span>{" "}
                        <span className="text-gray-400">{f.action} at</span> {f.stationName}
                      </div>
                      <span className="font-mono text-[11px] text-gray-400">{timeAgo(f.ts)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
