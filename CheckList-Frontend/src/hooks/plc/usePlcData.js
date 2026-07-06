import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";
import { useSocket } from "../useSocket";

export const usePlcData = (filters = {}, options = {}) => {
  const { enabled = true } = options;
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { device_id, model, status, startDate, endDate, timestampStart, timestampEnd, company_name, plant_name } = filters;

  useEffect(() => {
    if (!socket) return;

    const refreshPlcQueries = (payload) => {
      if (payload?.entity !== "plcData") return;
      queryClient.invalidateQueries({ queryKey: ["plc-data"] });
    };

    socket.on("dataCreated", refreshPlcQueries);
    socket.on("dataUpdated", refreshPlcQueries);

    return () => {
      socket.off("dataCreated", refreshPlcQueries);
      socket.off("dataUpdated", refreshPlcQueries);
    };
  }, [socket, queryClient]);

  return useQuery({
    queryKey: ["plc-data", { device_id, model, status, startDate, endDate, timestampStart, timestampEnd, company_name, plant_name }],
    queryFn: async () => {
      const params = {};
      if (device_id)      params.device_id    = device_id;
      if (model)          params.model        = model;
      if (status)         params.status       = status;
      if (company_name)   params.company_name = company_name;
      if (plant_name)     params.plant_name   = plant_name;
      if (startDate)      params.startDate    = startDate;
      if (endDate)        params.endDate      = endDate;
      if (timestampStart) params.timestampStart = timestampStart;
      if (timestampEnd)   params.timestampEnd   = timestampEnd;

      const res = await axiosHandler.get("/plc-data", { params });
      return res?.data?.data || [];
    },
    enabled,
  });
};
