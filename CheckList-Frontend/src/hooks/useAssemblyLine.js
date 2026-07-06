import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

export const useAssemblyLine = (company, plant, process, user,search, page, limit) => {
  const qc = useQueryClient();

  const getAssemblyLineData = useQuery({
    queryKey: ["assembly", page, limit],
    queryFn: async () => {
      const res = await axiosHandler.get(
        `/assembly/get-assembly?page=${page}&&limit=${limit}`
      );
      return res?.data?.data;
    },
    enabled: !search,
    placeholderData: keepPreviousData,
  });


  const createAssemblyLine = useMutation({
    mutationFn: async (data) => {
     
      const res = await axiosHandler.post(`/assembly/create-assembly`, data);
      return res?.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message);
      qc.invalidateQueries({ queryKey: ["assembly"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message);
    },
  });

  const UpdateAssemblyLine = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axiosHandler.put(
        `/assembly/update-assembly/${id}`,
        data
      );
      return res?.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message);
      qc.invalidateQueries({ queryKey: ["assembly"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message);
    },
  });

  const DeleteAssemblyLine = useMutation({
    mutationFn: async (id) => {
      const res = await axiosHandler.delete(`/assembly/delete-assembly/${id}`);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["assembly"] });
      toast.success(data?.message);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message);
    },
  });
  const searchQuery = useQuery({
    queryKey: ["search-assembly-line", company, plant, process, user,search],
    queryFn: async () => {
    
      const res = await axiosHandler.get("/assembly/search-assembly-line", {
        params: {
          company: company || undefined,
          plant: plant || undefined,
          process: process || undefined,
          user: user || undefined,
          search:search,
        }
      })
      return res.data.data;
    },
    enabled: !!(company || plant || process || user || search),
    placeholderData: keepPreviousData,
  });

  return {
    createAssemblyLine,
    getAssemblyLineData,
    searchQuery,
    UpdateAssemblyLine,
    DeleteAssemblyLine,
    
  };
}; 
