import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import axiosHandler from "../config/axiosconfig";
import { useSocket } from "./useSocket";

export const useMyStatusHistory = (page = 1, limit = 20, search = "") => {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const refreshStatusHistory = (payload) => {
      if (payload?.entity !== "statusHistory") return;
      queryClient.invalidateQueries({ queryKey: ["my-approvals-history"] });
    };

    socket.on("dataCreated", refreshStatusHistory);
    socket.on("dataUpdated", refreshStatusHistory);

    return () => {
      socket.off("dataCreated", refreshStatusHistory);
      socket.off("dataUpdated", refreshStatusHistory);
    };
  }, [socket, queryClient]);

  const query = useQuery({
    queryKey: ["my-approvals-history", page, limit, search],
    queryFn: async () => {
      const res = await axiosHandler.get("/status-history/my", {
        params: { page, limit, search },
      });
      return res?.data?.data || [];
    },
    keepPreviousData: true,
  });

  return { historyQuery: query };
};
