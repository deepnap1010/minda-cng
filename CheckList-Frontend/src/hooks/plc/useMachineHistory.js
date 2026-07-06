import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";
import { useSocket } from "../useSocket";

export const useMachineHistory = (filters = {}, options = {}) => {
  const { enabled = true } = options;
  const socket = useSocket();
  const queryClient = useQueryClient();
  const {
    device_id,
    limit = 20,
    status,
    model,
    duration,
    startDate,
    endDate,
  } = filters;

  useEffect(() => {
    if (!socket) return;

    const refreshMachineHistory = (payload) => {
      if (payload?.entity !== "plcData") return;
      queryClient.invalidateQueries({ queryKey: ["machine-history"] });
    };

    socket.on("dataCreated", refreshMachineHistory);
    socket.on("dataUpdated", refreshMachineHistory);

    return () => {
      socket.off("dataCreated", refreshMachineHistory);
      socket.off("dataUpdated", refreshMachineHistory);
    };
  }, [socket, queryClient]);

  return useInfiniteQuery({
    queryKey: [
      "machine-history",
      { device_id, limit, status, model, duration, startDate, endDate },
    ],
    enabled: !!device_id && enabled,
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        device_id,
        page: pageParam,
        limit,
        status,
        model,
        duration,
        startDate,
        endDate,
      };
      const res = await axiosHandler.get("/machine-history", { params });
      return res?.data?.data || { data: [], total: 0, totalPages: 0 };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
};
