import { useQuery } from "@tanstack/react-query";
import axiosHandler from "../../config/axiosconfig";

export const useAssignedTemplates = (page) => {
  const assignedTemplatesQuery = useQuery({
    queryKey: ["assigned-templates",page],
    queryFn: async () => {
      try {
      
        const res = await axiosHandler.get("/template-master/assigned-templates",{
          params:{
            page:page,
            limit:10
          }
        });
       
        return res?.data?.data || [];
      } catch (error) {
        console.error("Error fetching assigned templates:", error);
        console.error("Error details:", error?.response?.data || error?.message);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  return {
    assignedTemplatesQuery,
  };
};
