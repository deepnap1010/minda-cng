import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import axiosHandler from "../config/axiosconfig"
import { toast } from "react-toastify"



export const UsePlantName = (search, page , limit) => {
    const qc = useQueryClient()
    const getPlantName = useQuery({
        queryKey: ["plant", page , limit],
        queryFn: async () => {
            const res = await axiosHandler.get(`/plant/list-plant?page=${page}&&limit=${limit}`);
            return res?.data?.data;
        },
        enabled: !search,
        placeholderData: keepPreviousData
    })
    const getAllPlantName = useQuery({
        queryKey: ["plant"],
        queryFn: async () => {
            const res = await axiosHandler.get(`/plant/get-all-plant-data`);
            return res?.data?.data;
        },
        enabled: !search,
        placeholderData: keepPreviousData
    })

    const CreatePlantName = useMutation({
        mutationFn: async (data) => {
            const res = await axiosHandler.post("/plant/create-plant", data)
            return res?.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["plant"] })
            toast.success(data?.message)
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message)
        }
    })


    const UpdatedPLant = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await axiosHandler.put(`/plant/update-plant/${id}`, data)
            return res?.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["plant"] })
            toast.success(data?.message)
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message)
        }
    })

    const DeletePlantData = useMutation({

        mutationFn: async (id) => {
                const res = await axiosHandler.delete(`/plant/delete-plant/${id}`)
               return res?.data ;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["plant"] })
            toast.success(data?.message)
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message)
        }
    })

    const searchQuery = useQuery({
        queryKey: ["search-company", search],
        queryFn: async () => {
            const res = await axiosHandler.get(
                `/plant/search-plant?search=${search}`
            );
            return res.data.data;
        },
        enabled: !!search,
        placeholderData: keepPreviousData
    });



    return {
      getPlantName,
      CreatePlantName,
      UpdatedPLant,
      DeletePlantData,
      searchQuery,
      getAllPlantName,
    };
}

export const usePlantsByCompany = (companyId) => {
    const query = useQuery({
        queryKey: ["plants-by-company", companyId],
        queryFn: async () => {
            const res = await axiosHandler.get(`/plant/all-plants-data/${companyId}`);
            return res?.data?.data;
        },
        enabled: !!companyId,
    });
    return query;
}
