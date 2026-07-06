// src/hooks/plc/usePlcReport.js
//
// Report page = historical / aggregated view. Manager pulls up Q-X numbers
// and reads them. We do NOT need to invalidate this query every time a PLC
// agent POSTs new data — earlier code did that, causing the same page to be
// re-fetched 6-10 times in a minute (PLC posts are constant).
//
// Strategy:
//   - First load on mount → fetch.
//   - Stay fresh for 60s (staleTime). React Query won't refetch on focus
//     or remount inside this window.
//   - After 60s, the next user interaction (filter change, page click)
//     gives them fresh data naturally.
//
// FIX: the Duration filter (Today / This Week / This Month) is sent as
// `duration`, NOT as startDate/endDate. Earlier this hook dropped `duration`
// entirely — it was missing from both the queryKey and the request params — so
// changing Duration neither re-fetched nor reached the backend, and Today/Week/
// Month all fell back to the same default window (identical data). We now
// forward `duration` (and startTime/endTime for custom ranges) so the backend's
// buildDbWhere can apply the correct window.

import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";

export const usePlcReport = (filters = {}, options = {}) => {
  const { enabled = true } = options;
  const {
    device_id,
    model,
    status,
    duration,
    startDate,
    endDate,
    startTime,
    endTime,
    company_name,
    plant_name,
    page = 1,
    limit = 20,
  } = filters;

  return useQuery({
    queryKey: [
      "plc-report",
      {
        device_id,
        model,
        status,
        duration,
        startDate,
        endDate,
        startTime,
        endTime,
        company_name,
        plant_name,
        page,
        limit,
      },
    ],
    staleTime: 60_000,          // 60s of "fresh" — no auto-refetch
    gcTime: 10 * 60_000,        // keep cached for 10 min
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const params = { page, limit };
      if (device_id)    params.device_id    = device_id;
      if (model)        params.model        = model;
      if (status)       params.status       = status;
      if (company_name) params.company_name = company_name;
      if (plant_name)   params.plant_name   = plant_name;
      // Duration drives Today / This Week / This Month server-side.
      if (duration && duration !== "all") params.duration = duration;
      if (startDate)    params.startDate    = startDate;
      if (endDate)      params.endDate      = endDate;
      if (startTime)    params.startTime    = startTime;
      if (endTime)      params.endTime      = endTime;

      const res = await axiosHandler.get("/plc-data/report", { params });
      return res?.data?.data || { data: [], total: 0, totalPages: 0 };
    },
    enabled,
  });
};