import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

export const useCheckItemHistory = (page = 1, limit = 10, filters = {}, company, plant) => {
  const qc = useQueryClient();

  

  const updateCheckItemHistory = useMutation({
    mutationFn: ({ id, data }) =>
      axiosHandler.put(
        `/checkitem-history/update-checklist-history/${id}`,
        data
      ),

    onSuccess: (res) => {
      toast.success(res?.data?.message || "History updated successfully");

      qc.invalidateQueries({
        queryKey: ["CheckItem-History"],
      });
    },

    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update history");
    },
  });

  const getAssemblyReportData = useQuery({
    queryKey: ["AssemblyReport-Data", page, limit],
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await axiosHandler.get(
        `/assembly/assembly-checked-data?page=${page}&&limit=${limit}`
      );
      return res?.data?.data;
    },
  });

  const { startDate, endDate } = filters || {};

  const getAssemblyCardsData = useQuery({
    queryKey: ["AssemblyCardsData", { startDate, endDate, company, plant }],
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      
      const params = {};
      if (startDate && startDate.trim()) params.start_date = startDate;
      if (endDate && endDate.trim()) params.end_date = endDate;
      if (company) params.company = company;
      if (plant) params.plant = plant;

      const res = await axiosHandler.get(`/assembly/assembly-cards-data`, {
        params,
      });
      return res?.data?.data;
    },
  });


  return {
    updateCheckItemHistory,
    getAssemblyReportData,
    getAssemblyCardsData,
  };
};
