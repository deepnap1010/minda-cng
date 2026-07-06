import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";
import { useSocket } from "../useSocket";

export const useMachineLatestStatus = (filters = {}, options = {}) => {
  const { enabled = true } = options;
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { device_id } = filters;

  useEffect(() => {
    if (!socket) return;

    const refreshLatestStatus = (payload) => {
      if (payload?.entity !== "plcData") return;
      queryClient.invalidateQueries({ queryKey: ["machine-latest-status"] });
    };

    socket.on("dataCreated", refreshLatestStatus);
    socket.on("dataUpdated", refreshLatestStatus);

    return () => {
      socket.off("dataCreated", refreshLatestStatus);
      socket.off("dataUpdated", refreshLatestStatus);
    };
  }, [socket, queryClient]);

  return useQuery({
    queryKey: ["machine-latest-status", { device_id }],
    enabled: !!device_id && enabled,
    queryFn: async () => {
      const res = await axiosHandler.get("/machine-history/latest-status", { params: { device_id } });
      return res?.data?.data || null;
    },
  });
};
