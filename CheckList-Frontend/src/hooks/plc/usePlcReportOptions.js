import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";

export const usePlcReportOptions = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["plc-report-options"],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await axiosHandler.get("/plc-data/report/options");
      return res?.data?.data || { companies: [], plants: [], models: [] };
    },
    enabled,
  });
};
