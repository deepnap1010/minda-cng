import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axiosHandler from "../config/axiosconfig"
import { toast } from "react-toastify"
import { useEffect, useRef } from "react"
import { useSocket } from "./useSocket"
import { useLogin } from "./useLogin"

export const useNotifications = () => {
    const qc = useQueryClient()
    const socket = useSocket()
    const { logedinUser } = useLogin()
    const refetchRef = useRef(null)
    
    const getNotifications = useInfiniteQuery({
        queryKey: ["notification"],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await axiosHandler.get(
                `/notification/get-notifications?page=${pageParam}&limit=10`
            );
            return {
                ...res.data,
                currentPage: pageParam,
            };
        },

        getNextPageParam: (data) => {
            if (data.currentPage < data.totalPages) {
                return data.currentPage + 1;
            }
            return undefined;
        },
    });

    // Store refetch function in ref to avoid dependency issues
    useEffect(() => {
        refetchRef.current = getNotifications.refetch;
    }, [getNotifications.refetch]);

    // Listen to socket events for real-time notifications
    useEffect(() => {
        if (!socket || !logedinUser?.data?._id) {
            return;
        }

        const userId = logedinUser.data._id;
        const eventName = "notification";

      

        const handleNewNotification = (data) => {
           
            if (data?.type === "new_notification") {
                
                qc.invalidateQueries({ 
                    queryKey: ["notification"],
                    refetchType: 'active'
                });
            }
        };

        // Set up listener
        socket.on(eventName, handleNewNotification);

        // Cleanup
        return () => {
           
            socket.off(eventName, handleNewNotification);
        };
    }, [socket, logedinUser?.data?._id, qc]);
    

    const MarkasRead = useMutation({
        mutationFn:async (id)=>{
            const res = await axiosHandler.put(`notification/update-notification/${id}`,{
                status: "view"
            })
            return res?.data ;
        },
        onSuccess:(data)=>{
            toast.success(data?.message)
            qc.invalidateQueries({ queryKey: ["notification"]})
        },
        onError:(error)=>{
              toast.error(error?.response?.data?.message)
        }
    })


    const MarkAllasRead = useMutation({
        mutationFn:async (id)=>{
            const res = await axiosHandler.put(`notification/mark-all-notification`,{
                status: "view",
                reciverId:id
            })
            return res?.data ;
        },
        onSuccess:(data)=>{
            toast.success(data?.message)
            qc.invalidateQueries({ queryKey: ["notification"]})
        },
        onError:(error)=>{
              toast.error(error?.response?.data?.message)
        }
    })





    return { getNotifications, MarkasRead, MarkAllasRead }     
}