import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";

export const useMachineModelOptions = (device_id, options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["machine-model-options", device_id],
    enabled: !!device_id && enabled,
    queryFn: async () => {
      const res = await axiosHandler.get("/machine-history/models", {
        params: { device_id },
      });
      return res?.data?.data || { models: [] };
    },
  });
};
