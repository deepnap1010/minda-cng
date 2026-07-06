import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axiosHandler from "../config/axiosconfig"
import { toast } from "react-toastify"

export const useDepartment = (value,page,limit) => {

    const qc = useQueryClient()

    const getDepartmentData = useQuery({
        queryKey: ["department",value,page,limit],
        queryFn: async () => {
            const res = await axiosHandler.get(`/department/all`,{
                params:{search:value,page:page,limit:limit}
            });
            return res?.data?.data;
        },

    })
    const getAllDepartmentData = useQuery({
        queryKey: ["department-all"],
        queryFn: async () => {
            const res = await axiosHandler.get(`/department/data`);
            return res?.data?.data;
        },

    })

    const postDepartment = useMutation({
        mutationFn: async (value) => {

            const res = await axiosHandler.post(`/department/create`, value)
            return res?.data
        },
        onSuccess: (data) => {
            toast.success(data?.message)
            qc.invalidateQueries({ queryKey: ["department"] })
            qc.invalidateQueries({ queryKey: ["department-all"] })
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message)
        }
    })

    const updatedDepartment = useMutation({
        mutationFn: async ({ id, value }) => {

            const res = await axiosHandler.put(`/department/update/id/${id}`, value)
            return res?.data
        },
        onSuccess: (data) => {
            toast.success(data?.message)
            qc.invalidateQueries({ queryKey: ["department"] })
            qc.invalidateQueries({ queryKey: ["department-all"] })
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message)
        }
    })

    const deleteDepartment = useMutation({
        mutationFn: async (id) => {
            const res = await axiosHandler.delete(`/department/delete/id/${id}`)
            return res?.data;
        },
        onSuccess: (data) => {
            toast.success(data?.message)
            qc.invalidateQueries({ queryKey: ["department"] })
            qc.invalidateQueries({ queryKey: ["department-all"] })
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message)
        }
    })

    return {
        getDepartmentData, postDepartment, updatedDepartment, deleteDepartment,getAllDepartmentData
    }
}