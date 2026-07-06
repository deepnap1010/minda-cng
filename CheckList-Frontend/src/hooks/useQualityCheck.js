import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

export const useQualityCheck = (filters = {}) => {
  const qc = useQueryClient();
  const { machine_name, product_name, status, company_name, plant_name, search, page, limit } = filters;

  const getAllQualityChecks = useQuery({
    queryKey: ["quality-check", filters],
    queryFn: async () => {
      const res = await axiosHandler.get("/quality-check", { params: filters });
      return {
        data: res?.data?.data || [],
        total: res?.data?.total ?? 0,
        page: res?.data?.page ?? 1,
        limit: res?.data?.limit ?? 10,
      };
    },
  });

  

  const createQualityCheck = useMutation({
    mutationFn: (data) => axiosHandler.post("/quality-check", data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["quality-check"] });
      toast.success(data?.data?.message || "Quality Check created successfully");
    },
  });

  const updateQualityCheck = useMutation({
    mutationFn: ({ id, data }) =>
      axiosHandler.put(`/quality-check/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quality-check"] });
      toast.success("Quality Check updated successfully");
    },
  });

  const deleteQualityCheck = useMutation({
    mutationFn: (id) =>
      axiosHandler.delete(`/quality-check/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quality-check"] });
      toast.success("Quality Check deleted successfully");
    },
  });

  return {
    getAllQualityChecks,
    createQualityCheck,
    updateQualityCheck,
    deleteQualityCheck,
  };
};






