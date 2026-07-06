import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";

export const useMachineStoppage = (filters = {}, options = {}) => {
  const { enabled = true } = options;
  const { device_id, startDate, endDate, page = 1, limit = 20 } = filters;

  return useQuery({
    queryKey: ["machine-stoppage", { device_id, startDate, endDate, page, limit }],
    queryFn: async () => {
      const params = { page, limit };
      if (device_id) params.machine_name = device_id;
      if (startDate) params.from_date = startDate;
      if (endDate) params.to_date = endDate;

      const res = await axiosHandler.get("/plc-data/stoppage", { params });
      return res?.data || { data: [], pagination: {}, totalMachines: 0, totalStoppedMachines: 0, allDevices: [] };
    },
    enabled,
    staleTime: 60_000,        // 60s fresh — no refetch on navigation/re-render
    gcTime: 10 * 60_000,      // keep cached 10 min
    refetchOnWindowFocus: false,
  });
};