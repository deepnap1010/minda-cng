import {keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

export const UsePart = (page,limit,search) => {
  const qc = useQueryClient();


   const getPartData = useQuery({
     queryKey: ["parts", page , limit],
     queryFn: async () => {
       const res = await axiosHandler.get(`/parts/all-parts?page=${page}&&limit=${limit}`);
       return res?.data?.data;
     },
   });

   const searchQuery = useQuery({
      queryKey: ["parts", search],
      queryFn: async () => {
      const res = await axiosHandler.get(
        `/parts/all-parts?search=${search}`
       );
       return res.data.data;
       },
      enabled: !!search,
      placeholderData: keepPreviousData,
    });

  const getAllPart = useQuery({
    queryKey: ["parts"],
    queryFn: async () => {
      const res = await axiosHandler.get("/parts/all-parts-data");
      return res?.data?.data;
    },
  });

  const createPart = useMutation({
    mutationFn: async (data) => {
      const res = await axiosHandler.post("/parts/create-part", data);
      return res?.data;
    },

    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["parts"] });
      toast.success(data?.message);
    },

    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create parts");
    },
  });

  const updateParts = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axiosHandler.put(`/parts/update-part/${id}`, data);
      return res?.data;
    },

    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["parts"] });
      toast.success(data?.message);
    },

    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update parts");
    },
  });

  const removeParts = useMutation({
    mutationFn: (id) => axiosHandler.delete(`/parts/delete-part/${id}`),

    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["parts"] });
      toast.success(data?.message || "User Deleted Sucessfully");
    },

    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete Parts ");
    },
  });

  return { getAllPart, createPart, updateParts, getPartData, removeParts ,searchQuery};
};
