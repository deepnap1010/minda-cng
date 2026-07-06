import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

export const useProductionLogsSummary = (enabled = true) => {
  return useQuery({
    queryKey: ["production-logs-summary"],
    queryFn: async () => {
      const res = await axiosHandler.get("/production-logs/summary");
      return res?.data?.data || {};
    },
    enabled,
    staleTime: 60_000,
    retry: 1,
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to load production summary"
      );
    },
  });
};

export const useProductionLogs = (
  page = 1,
  limit = 10,
  enabled = true,
  status = ""
) => {
  return useQuery({
    queryKey: ["production-logs", page, limit, status],
    queryFn: async () => {
      const res = await axiosHandler.get("/production-logs", {
        params: { page, limit, status: status || undefined },
      });
      return (
        res?.data?.data || {
          data: [],
          total: 0,
          page: 1,
          limit,
          totalPages: 0,
        }
      );
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to load production logs"
      );
    },
  });
};
