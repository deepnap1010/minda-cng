import {  useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";
import { toast } from "react-toastify";

export const useReleaseGroup = (search, page, limit) => {
  const qc = useQueryClient();

  const getReleaseGroup = useQuery({
    queryKey: ["release", search, page, limit],
    queryFn: async () => {
        console.log(search)
        const res = await axiosHandler.get(`release-group/get`, {
            params: { search: search || "", page: page, limit: limit },
        });
      return res?.data?.data;
    },
  });
  const getAllReleaseGroup = useQuery({
    queryKey: ["release-group"],
    queryFn: async () => {
      const res = await axiosHandler.get(`release-group/get-all`);
      return res?.data?.data;
    },
  });

   


  const postReleaseGroup = useMutation({
    mutationFn: async (values) => {
      const res = await axiosHandler.post(`/release-group/create`, values);
      return res?.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message);
      qc.invalidateQueries({ queryKey: ["release"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message);
    },
  });

  const updateReleaseGroup = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axiosHandler.put(
        `/release-group/update/id/${id}`,
        data,
      );
      return res?.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message);
      qc.invalidateQueries({ queryKey: ["release"] });
    },

    onError: (error) => {
      toast.error(error?.response?.data?.message);
    },
  });

  const removeReleaseGroup = useMutation({
    mutationFn: async (id) => {
      const res = await axiosHandler.delete(`/release-group/delete/id/${id}`);
      return res?.data;
    },

    onSuccess: (data) => {
      toast.success(data?.message);
      qc.invalidateQueries({ queryKey: ["release"] });
    },

    onError: (error) => {
      toast.error(error?.response?.data?.message);
    },
  });

  return {
    postReleaseGroup,
    getReleaseGroup,
    updateReleaseGroup,
    removeReleaseGroup,
    getAllReleaseGroup,
  };
};
