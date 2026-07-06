import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";

export const usePlcTimeDistribution = (filters = {}, options = {}) => {
  const { enabled = true } = options;
  const { startDate, endDate, company_name, plant_name, device_id, model, status } = filters;

  return useQuery({
    queryKey: ["plc-time-distribution", { startDate, endDate, company_name, plant_name, device_id, model, status }],
    queryFn: async () => {
      const params = {};
      if (startDate)    params.startDate  = startDate;
      if (endDate)      params.endDate    = endDate;
      if (company_name) params.companyName = company_name;
      if (plant_name)   params.plantName  = plant_name;
      if (device_id)    params.deviceId   = device_id;
      if (model)        params.model      = model;
      if (status)       params.status     = status;

      const res = await axiosHandler.get("/plc-data/analytics/time-distribution", { params });
      return res?.data?.data || { runTime: 0, stopTime: 0, idleTime: 0 };
    },
    enabled,
    staleTime: 60_000,        // 60s fresh — no refetch on navigation/re-render
    gcTime: 10 * 60_000,      // keep cached 10 min
    refetchOnWindowFocus: false,
  });
};