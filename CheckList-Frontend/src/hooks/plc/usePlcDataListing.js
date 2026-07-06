import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import axiosHandler from "../../config/axiosconfig";
import { useSocket } from "../useSocket";

export const usePlcDataListing = (filters = {}, options = {}) => {
  const { enabled = true, includeSummary = false, live = false } = options;

  const socket = useSocket();
  const queryClient = useQueryClient();

  const {
    device_id,
    model,
    status,
    startDate,
    endDate,
    timestampStart,
    timestampEnd,
    company_name,
    plant_name,
  } = filters;

  // 🔑 same queryKey everywhere
  const queryKey = [
    "plc-data-listing",
    {
      device_id,
      model,
      status,
      startDate,
      endDate,
      timestampStart,
      timestampEnd,
      company_name,
      plant_name,
      includeSummary,
      live,
    },
  ];

  // 📡 Socket handling (NO refetch)
  useEffect(() => {
    if (!socket || !live) return;

    const handleUpdate = (payload) => {
      if (payload?.entity !== "plcData") return;

      const newItem = payload?.data;
      if (!newItem) return;

      // 🔥 update ALL matching queries
      queryClient.setQueriesData(
        { queryKey: ["plc-data-listing"] },
        (oldData) => {
          if (!oldData) return oldData;

          // 🧠 Case 1: with summary
          if (oldData?.rows) {
            return {
              ...oldData,
              rows: [newItem, ...oldData.rows],
            };
          }

          // 🧠 Case 2: normal array
          if (Array.isArray(oldData)) {
            return [newItem, ...oldData];
          }

          return oldData;
        },
      );
    };

    socket.on("dataCreated", handleUpdate);
    socket.on("dataUpdated", handleUpdate);

    return () => {
      socket.off("dataCreated", handleUpdate);
      socket.off("dataUpdated", handleUpdate);
    };
  }, [socket, queryClient, live]);

  // 🌐 API fetch (ONLY initial / manual)
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = {};

      if (device_id) params.device_id = device_id;
      if (model) params.model = model;
      if (status) params.status = status;
      if (company_name) params.company_name = company_name;
      if (plant_name) params.plant_name = plant_name;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (timestampStart) params.timestampStart = timestampStart;
      if (timestampEnd) params.timestampEnd = timestampEnd;
      // Tell the server whether to compute the (heavy) production/error counts.
      // The options call omits this, so the server skips the all-time aggregate
      // and returns fast — keeping Company/Plant dropdowns populated instantly.
      if (includeSummary) params.includeSummary = true;

      const res = await axiosHandler.get("/plc-data/listing", { params });

      if (includeSummary) {
        return {
          rows: res?.data?.data || [],
          summary: res?.data?.summary || {
            total_production_barcodes: 0,
            total_error_barcodes: 0,
          },
        };
      }

      return res?.data?.data || [];
    },

    enabled,

    
    staleTime: 1000 * 60, 
    refetchOnWindowFocus: false,
  });
};