import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";

export const usePlcDowntimeByErrorStatus = (filters = {}, options = {}) => {
  const { enabled = true } = options;
  const { startDate, endDate, company_name, plant_name, device_id, model } = filters;

  return useQuery({
    queryKey: ["plc-downtime-by-error-status", { startDate, endDate, company_name, plant_name, device_id, model }],
    queryFn: async () => {
      const params = {};
      if (startDate)    params.startDate  = startDate;
      if (endDate)      params.endDate    = endDate;
      if (company_name) params.companyName = company_name;
      if (plant_name)   params.plantName  = plant_name;
      if (device_id)    params.deviceId   = device_id;
      if (model)        params.model      = model;

      const res = await axiosHandler.get("/plc-data/analytics/downtime-by-error-status", { params });
      return res?.data?.data || [];
    },
    enabled,
    staleTime: 60_000,        // 60s fresh — no refetch on navigation/re-render
    gcTime: 10 * 60_000,      // keep cached 10 min
    refetchOnWindowFocus: false,
  });
};