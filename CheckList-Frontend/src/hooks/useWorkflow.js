import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

export const useWorkflow = (search, page, limit) => {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["workflows", page, limit],
    queryFn: async () => {
      const res = await axiosHandler.get(
        `/workflow/list-workflow?page=${page}&&limit=${limit}`
      );
      return res?.data?.data;
    },
    enabled: !search,
    placeholderData: keepPreviousData,
  });

  const create = useMutation({
    mutationFn: async (data) => {
      const res = await axiosHandler.post("/workflow/create-workflow", data);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(data?.message || "Workflow created successfully");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to create workflow"
      );
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axiosHandler.put(`/workflow/update-workflow/${id}`, data);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(data?.message || "Workflow updated successfully");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to update workflow"
      );
    },
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      const res = await axiosHandler.delete(`/workflow/delete-workflow/${id}`);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(data?.message || "Workflow deleted successfully");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete workflow"
      );
    },
  });

  const searchQuery = useQuery({
    queryKey: ["search-workflow", search],
    queryFn: async () => {
      const res = await axiosHandler.get(
        `/workflow/search-workflow?search=${search}`
      );
      return res?.data?.data;
    },
    enabled: !!search && search.length > 0,
  });

  return {
    listQuery,
    create,
    update,
    remove,
    searchQuery,
  };
};
