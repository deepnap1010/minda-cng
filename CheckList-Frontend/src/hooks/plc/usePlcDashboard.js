// src/hooks/plc/usePlcDashboard.js
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";
import { useSocket } from "../useSocket";

// Dashboard cards do benefit from realtime feel, but PLC agents POST so
// constantly (multiple times per second across many machines) that 5s was
// still too aggressive — the user saw their visible page silently re-fetching
// every few seconds. 30s is a much better balance: cards still update within
// half a minute of any change, without API hammering.
const REFRESH_THROTTLE_MS = 30000;

export const usePlcDashboard = (filters = {}, options = {}) => {
  const { enabled = true, page = 1, limit = 6 } = options;
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { device_id, status, company_name, plant_name } = filters;

  const lastFiredAtRef = useRef(0);
  const trailingTimerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const fireInvalidate = () => {
      lastFiredAtRef.current = Date.now();
      queryClient.invalidateQueries({ queryKey: ["plc-dashboard"] });
    };

    const refreshDashboard = (payload) => {
      if (payload?.entity !== "plcData") return;

      const now = Date.now();
      const sinceLast = now - lastFiredAtRef.current;

      if (sinceLast >= REFRESH_THROTTLE_MS) {
        fireInvalidate();
        return;
      }

      // Already inside the throttle window — coalesce into one trailing fire.
      if (trailingTimerRef.current) return;
      trailingTimerRef.current = setTimeout(() => {
        trailingTimerRef.current = null;
        fireInvalidate();
      }, REFRESH_THROTTLE_MS - sinceLast);
    };

    socket.on("dataCreated", refreshDashboard);
    socket.on("dataUpdated", refreshDashboard);

    return () => {
      socket.off("dataCreated", refreshDashboard);
      socket.off("dataUpdated", refreshDashboard);
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
        trailingTimerRef.current = null;
      }
    };
  }, [socket, queryClient]);

  return useQuery({
    queryKey: ["plc-dashboard", { device_id, status, company_name, plant_name, page, limit }],
    queryFn: async () => {
      const params = { page, limit };
      if (device_id)    params.device_id    = device_id;
      if (status)       params.status       = status;
      if (company_name) params.company_name = company_name;
      if (plant_name)   params.plant_name   = plant_name;

      const res = await axiosHandler.get("/plc-dashboard", { params });
      return res?.data || { data: [], pagination: { page, limit, totalPages: 1, totalItems: 0 } };
    },
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
};