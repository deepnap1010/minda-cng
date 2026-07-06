  import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";
import { useSocket } from "../useSocket";

export const useMachineSummary = (filters = {}, options = {}) => {
  const { enabled = true } = options;
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { device_id, status, model, duration, startDate, endDate } = filters;

  useEffect(() => {
    if (!socket) return;

    const refreshSummary = (payload) => {
      if (payload?.entity !== "plcData") return;
      queryClient.invalidateQueries({ queryKey: ["machine-summary"] });
    };

    socket.on("dataCreated", refreshSummary);
    socket.on("dataUpdated", refreshSummary);

    return () => {
      socket.off("dataCreated", refreshSummary);
      socket.off("dataUpdated", refreshSummary);
    };
  }, [socket, queryClient]);

  return useQuery({
    queryKey: ["machine-summary", { device_id, status, model, duration, startDate, endDate }],
    enabled: !!device_id && enabled,
    queryFn: async () => {
      const res = await axiosHandler.get("/machine-history/summary", { 
        params: { device_id, status, model, duration, startDate, endDate } 
      });
      return res?.data?.data || { total_products: 0, total_production: 0, total_downtime_seconds: 0 };
    },
  });
};
