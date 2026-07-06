import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cngGet, cngPost, cngPut, USE_MOCK } from "./api";
import { mock } from "./mockData";
import * as A from "./adapt";

// Each hook calls the real CNG API and maps the response into the shape the
// existing components expect (see adapt.js). VITE_CYLINDER_MOCK=true → sample data.

export function useCylOps() {
  return useQuery({
    queryKey: ["cyl-ops"],
    queryFn: async () => {
      if (USE_MOCK) return mock.ops();
      const [dash, machines, inProc] = await Promise.all([
        cngGet("/dashboard"),
        cngGet("/machines"),
        cngGet("/cylinders", { status: "in_process", limit: 200 }),
      ]);
      return A.adaptOps(dash, machines || [], inProc?.data || []);
    },
    refetchInterval: USE_MOCK ? false : 5000,
  });
}

export function useCylinders(filters = {}) {
  return useQuery({
    queryKey: ["cyl-list", filters],
    queryFn: async () => {
      if (USE_MOCK) return mock.cylinders(filters);
      const resp = await cngGet("/cylinders", { limit: 500, ...filters });
      return A.adaptCylinders(resp);
    },
  });
}

export function useCylinder(id) {
  return useQuery({
    queryKey: ["cyl-trace", id],
    queryFn: async () => {
      if (USE_MOCK) return mock.cylinder(id);
      const t = await cngGet(`/cylinders/${encodeURIComponent(id)}`);
      return A.adaptTrace(t);
    },
    enabled: !!id,
    retry: false,
  });
}

export function useCylMachines() {
  return useQuery({
    queryKey: ["cyl-machines"],
    queryFn: async () => {
      if (USE_MOCK) return mock.machines();
      const list = await cngGet("/machines");
      return A.adaptMachines(list || []);
    },
    refetchInterval: USE_MOCK ? false : 5000,
  });
}

export function useCylMachine(key, range = {}) {
  return useQuery({
    queryKey: ["cyl-machine", key, range.from || "", range.to || ""],
    queryFn: async () => {
      if (USE_MOCK) return mock.machine(key);
      const d = await cngGet(`/machines/${encodeURIComponent(key)}`, {
        from: range.from || undefined,
        to: range.to || undefined,
      });
      return A.adaptMachineDetail(d);
    },
    enabled: !!key,
    refetchInterval: USE_MOCK ? false : 5000,
  });
}

// eslint-disable-next-line no-unused-vars
export function useCylDefects(_batch) {
  return useQuery({
    queryKey: ["cyl-defects"],
    queryFn: async () => {
      if (USE_MOCK) return mock.defects();
      const list = await cngGet("/defects");
      return A.adaptDefects(list || []);
    },
  });
}

// Stage 1 (Pipe Cutting) operator entry — mints a unique Pipe ID (cylinder born)
// and writes the Stage-1 cut-config record. Returns { cylinder, record, pipeId, alreadyExists }.
export function useCreateCylinder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => cngPost("/cylinders", body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cyl-ops"] });
      qc.invalidateQueries({ queryKey: ["cyl-list"] });
      if (data?.pipeId) qc.invalidateQueries({ queryKey: ["cyl-trace", data.pipeId] });
    },
  });
}

// Recent stage records, newest first — the "Cutting Stage Data" table on manual
// stages: the exact values the operator submitted with each Pipe ID.
export function useStageRecords({ stageNo, limit = 25 } = {}) {
  return useQuery({
    queryKey: ["cyl-stage-records", stageNo, limit],
    queryFn: async () => {
      if (USE_MOCK) return [];
      return cngGet("/stage-records", { stage_no: stageNo, limit });
    },
    enabled: stageNo != null,
    refetchInterval: USE_MOCK ? false : 10000,
  });
}

// Users assignable as machine operators (for the operator picker on the Machines page).
export function useCngOperators() {
  return useQuery({
    queryKey: ["cyl-operators"],
    queryFn: () => cngGet("/operators"),
    staleTime: 5 * 60 * 1000,
  });
}

// Assign a standing operator to a machine → that stage's operator gets handoff notifications.
export function useSetMachineOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ machineId, operatorUserId }) =>
      cngPut(`/machines/${encodeURIComponent(machineId)}/operator`, { operatorUserId: operatorUserId || null }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["cyl-machine", vars.machineId] });
      qc.invalidateQueries({ queryKey: ["cyl-machines"] });
    },
  });
}

// Scan a cylinder onto a machine (sets the active Pipe ID → telemetry links to it).
export function useScanIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => cngPost("/scan", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cyl-ops"] });
      qc.invalidateQueries({ queryKey: ["cyl-machines"] });
    },
  });
}
