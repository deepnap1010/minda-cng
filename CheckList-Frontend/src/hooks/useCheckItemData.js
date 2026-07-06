import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axiosHandler from "../config/axiosconfig"
import { toast } from "react-toastify"

export const useCheckItemData = () => {

    const qc = useQueryClient()


    const getAssemblyAndProcessData = useQuery({
        queryKey: ["assembly"],
        queryFn: async () => {
            const res = await axiosHandler.get(`/assembly/get-assembly-responsibal`);
            return res?.data?.data;
        }
    })


    const PostCheckListForm = useMutation({
        mutationFn: async ({ assembly_id,
             },) => {
            const res = await axiosHandler.post(`/assembly/checklist-form`,{
                assembly_id: assembly_id,
            });
            return res?.data?.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["assebly"] })
            toast.success(data?.message)
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message);
        }
    })

    const PostCheckListFormHistory = useMutation({
        mutationFn: async (data) => {
            const res = await axiosHandler.post(`/checkitem-history/create-checklist-history`,data);
            return res?.data;
        },
        onSuccess: (data) => {
            toast.success(data?.message)
            qc.invalidateQueries({ queryKey: ["checkitem-history"] })
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message);
        }
    })

    const PostCheckListFormHistoryTiming = useMutation({
        mutationFn: async (data) => {
            const res = await axiosHandler.post(`checkitem-history/create-checklist-history-timing`,data);
            return res?.data;
        },
        onSuccess: (data) => {
            toast.success(data?.message)
            qc.invalidateQueries({ queryKey: ["checkitem-history"] })
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message);
        }
    })


    return { getAssemblyAndProcessData, PostCheckListForm, PostCheckListFormHistory, PostCheckListFormHistoryTiming }
}

 export const getDailyAssemblyLineData = (id) => {
    return useQuery({
        queryKey: ["assembly", id], 
        queryFn: async () => {
            const res = await axiosHandler.get(`assembly/assembly-checked-data/${id}`);
            return res?.data?.data;
        },
        enabled: !!id,
    });
};