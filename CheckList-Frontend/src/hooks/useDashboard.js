import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

/* ---------------- Dashboard Cards API ---------------- */
// Accept optional filters so backend can filter cards by company / plant / date range
export const useDashboardCards = (filters = {}) => {
  const { company, plant, startDate, endDate } = filters;

  return useQuery({
    // Include filters in key so cards refetch when selection changes
    queryKey: ["dashboard-cards", { company, plant, startDate, endDate }],

    queryFn: async () => {
      const params = {};

      if (company) params.company = company;
      if (plant) params.plant = plant;
      // Only send dates if they are provided and not empty
      if (startDate && startDate.trim()) {
        params.start_date = startDate;
      }
      if (endDate && endDate.trim()) {
        params.end_date = endDate;
      }

      const res = await axiosHandler.get("/dashboard/get-cards-data", {
        params,
      });
      return res?.data?.data;
    },

    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to load dashboard cards"
      );
    },
  });
};

/* ---------------- Monthly Inspection Trend API ---------------- */
export const useMonthlyInspectionTrend = () => {
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return useQuery({
    queryKey: ["monthly-inspection-trend"],

    queryFn: async () => {
      const res = await axiosHandler.get("/dashboard/get-monthly-trend");
      const rawData = res?.data?.data || [];

      // Normalize data to Jan–Dec
      const filledData = MONTHS.map((month, index) => {
        const found = rawData.find((item) => item.month === index + 1);

        return {
          month,
          checked: found?.checked_count || 0,
          unchecked: found?.unchecked_count || 0,
          error: found?.error_count || 0,
        };
      });

      return filledData;
    },

    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        "Failed to load monthly inspection trend"
      );
    },
  });
};

export const useAssemblyStatus = () => {
  return useQuery({
    queryKey: ["assembly-status"],

    queryFn: async () => {
      const res = await axiosHandler.get("/dashboard/get-assembly-status");
      return res?.data?.data || [];
    },

    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to load inspection data"
      );
    },
  });
};

/* ---------------- Assembly Monthly API ---------------- */
export const useAssemblyMonthly = (filters = {}) => {
  const { startDate, endDate } = filters;
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return useQuery({
    queryKey: ["assembly-monthly", { startDate, endDate }],

    queryFn: async () => {
      const params = {};
      if (startDate && startDate.trim()) params.start_date = startDate;
      if (endDate && endDate.trim()) params.end_date = endDate;

      const res = await axiosHandler.get("/dashboard/get-assembly-monthly", {
        params,
      });
      const rawData = res?.data?.data || [];

      // Normalize Jan–Dec
      return MONTHS.map((label, index) => {
        const found = rawData.find((item) => item.month === index + 1);

        return {
          label,
          running: found?.running_count || 0,
          fault: found?.fault_count || 0,
        };
      });
    },

    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,

    onError: (error) => {
        toast.error(
          error?.response?.data?.message || "Failed to load assembly monthly data"
        );
    },
  });
};



/* ---------------- Inspection Overview API ---------------- */
export const useInspectionOverview = (filters = {}) => {
  const { startDate, endDate,company,plant } = filters;

  return useQuery({
    queryKey: ["inspection-overview", { startDate, endDate, company, plant }],

    queryFn: async () => {
    
      const params = {};
      if (startDate && startDate.trim()) params.start_date = startDate;
      if (endDate && endDate.trim()) params.end_date = endDate;
      if (company) params.company = company;
      if (plant) params.plant = plant;
      const res = await axiosHandler.get("/dashboard/get-assembly-errors", {
        params,
      });
      const data = res?.data?.data || {};

      return {
        topErrorProcesses: data?.top_error_processes || [],
        summary: {
          errorAssemblies: data?.assembly_summary?.error_assemblies || 0,
          stillErrorAssemblies:
            data?.assembly_summary?.still_error_assemblies || 0,
          resolvedAssemblies:
            data?.assembly_summary?.resolved_assemblies || 0,
        },
      };
    },

    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        "Failed to load inspection overview data"
      );
    },
  });
};

