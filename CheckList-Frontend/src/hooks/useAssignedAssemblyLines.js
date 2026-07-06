import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";

import { toast } from "react-toastify";


export const useAssignedAssemblyLines = () => {

  const qc = useQueryClient();

  const getAssignedAssemblyLines = useQuery({
      queryKey:["assignedAssemblyLines"],
      queryFn:async ()=>{
        const res=await axiosHandler.get(
          `/assembly/assembly-checked-data`
        );
        return res?.data?.data;
      },
    })

    return {
        getAssignedAssemblyLines
    }
}
