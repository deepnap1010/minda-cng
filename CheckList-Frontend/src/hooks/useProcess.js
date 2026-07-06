import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import axiosHandler from "../config/axiosconfig"


export const useProcess = (search,page,limit) => {

    const qc = useQueryClient()

    const  getProcessData = useQuery({
        queryKey:["process",page,limit],
        queryFn: async() =>  {
            const res = await axiosHandler.get(`/process/get-process-list?page=${page}&&limit=${limit}`)
            return res?.data?.data ;
        },
        enabled: !search,
        placeholderData: keepPreviousData,
    })

    const PostProcessData = useMutation({
        mutationFn: async (value) => {
            const res = await axiosHandler.post(`/process/create-process`, value)
            return res?.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["process"] })
            toast.success(data?.message)
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message)
        }
    })
    const UpdateProcess = useMutation({
        mutationFn: async ({ value, id }) => {

            const res = await axiosHandler.put(`/process/update-process/${id}`, value)
            return res?.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["process"] })
            toast.success(data?.message)
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message)
        }
    })
    const DeleteProcess = useMutation({
        mutationFn: async (id) => {
            try {
                const res = await axiosHandler.delete(`/process/delete-process/${id}`)
                toast.success(res?.data?.message)
            } catch (error) {
                toast.error(error?.message)
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["process"] })
        }
    })

    const searchQuery = useQuery({
        queryKey: ["saerch-process-list", search],
        queryFn: async () => {
            const res = await axiosHandler.get(
                `/process/saerch-process-list?search=${search}`
            );
            return res?.data?.data;
        },
        enabled: !!search,
        placeholderData: keepPreviousData,
    });

    const AllProcessData = useQuery({
        queryKey: ["get-all-process"],
        queryFn: async () => {
            const res = await axiosHandler.get("/process/get-all-process");
            return res?.data?.data;
        }
    })



    return { getProcessData, PostProcessData, UpdateProcess, DeleteProcess, searchQuery, AllProcessData };
}