import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";

export const usePlcDashboardOptions = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["plc-dashboard-options"],
    queryFn: async () => {
      const res = await axiosHandler.get("/plc-dashboard/options");
      return res?.data?.data || { companies: [], plants: [], models: [], statuses: [] };
    },
    enabled,
    staleTime: 300000,
  });
};
