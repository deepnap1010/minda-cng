import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

export const usePlcProduct = (filters = {}, options = {}) => {
  const qc = useQueryClient();
  const { search, machine_name } = filters;
  const { enabled = true } = options;

  const getAllPlcProducts = useQuery({
    queryKey: ["plc-products", { search, machine_name }],
    queryFn: async () => {
      const params = {};
      if (search) params.search = search;
      if (machine_name) params.machine_name = machine_name;

      const res = await axiosHandler.get("/plc-products", { params });
      return res?.data?.data || [];
    },
    enabled: enabled,
  });

  // const getdata = useQuery({
  //   queryKey: ["plc-data"],
  //   queryFn: async () => {
  //     const res = await axiosHandler.get("/plc-data");
  //     return res?.data?.data || [];
  //   },
  // });

  const createPlcProduct = useMutation({
    mutationFn: async (data) => {
      const res = await axiosHandler.post("/plc-products", data);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["plc-products"] });
      toast.success(data?.message || "Product created successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create product");
    },
  });

  const updatePlcProduct = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axiosHandler.put(`/plc-products/${id}`, data);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["plc-products"] });
      toast.success(data?.message || "Product updated successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update product");
    },
  });

  const deletePlcProduct = useMutation({
    mutationFn: async (id) => {
      const res = await axiosHandler.delete(`/plc-products/${id}`);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["plc-products"] });
      toast.success(data?.message || "Product deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete product");
    },
  });

  return {
    getAllPlcProducts,
    createPlcProduct,
    updatePlcProduct,
    deletePlcProduct,
    // getdata
  };
};
