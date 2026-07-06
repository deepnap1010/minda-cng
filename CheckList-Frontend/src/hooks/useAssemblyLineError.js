import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";


export const useAssemblyLineError =()=>{
  const qc = useQueryClient();

  const getAssemblyLineError = useQuery({
    queryKey: ["AssemblyLine-Error"],
    queryFn: async () => {
      const res = await axiosHandler.get(`/checkitem-history/error-history`);
      return res?.data?.data;
    },
  });

   const updateAssemblyLineError = useMutation({
     mutationFn: ({ id, data }) =>
       axiosHandler.put(
         `/checkitem-history/update-checklist-history/${id}`,
         data
       ),

     onSuccess: (res) => {
       toast.success(res?.data?.message || "Error updated successfully");

       qc.invalidateQueries({
         queryKey: ["AssemblyLine-Error"],
       });
     },

     onError: (error) => {
       toast.error(error?.response?.data?.message || "Failed to update Error");
     },
   });

    return {
      getAssemblyLineError,
      updateAssemblyLineError,
    };

}