import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

export const useUserRole = (search,page,limit) => {
  const qc = useQueryClient();

  const UserlistQuery = useQuery({
    queryKey: ["user-roles",page,limit],
    queryFn: async () => {
      const res = await axiosHandler.get(`/roles/get-list-roles?page=${page}&&limit=${limit}`);
      return res?.data?.data;
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to fetch user roles"
      );
    },
  });

   const SearchUserList = useQuery({
     queryKey: ["user-roles", search],
     queryFn: async () => {
       const res = await axiosHandler.get(`/roles/search-roles?name=${search}`);
       return res?.data?.data;
     },
     onError: (error) => {
       toast.error(
         error?.response?.data?.message || "Failed to fetch user roles"
       );
     },
   });

  const createUser = useMutation({
    mutationFn: (data) => axiosHandler.post("/roles/create-roles", data),

    onSuccess: () => {
      toast.success("Role created successfully");
      qc.invalidateQueries({ queryKey: ["user-roles"] });
    },

    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create role   ");
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }) =>
      axiosHandler.put(`/roles/update-roles/${id}`, data),

    onSuccess: () => {
      toast.success("Role updated successfully");
      qc.invalidateQueries({ queryKey: ["user-roles"] });
    },

    onError: (error) => {
      toast.error(error?.response?.data?.message );
    },
  });


  const removeUser = useMutation({
    mutationFn: (id) => axiosHandler.delete(`/roles/delete-roles/${id}`),

    onSuccess: () => {
      toast.success("Role deleted successfully ");
      qc.invalidateQueries({ queryKey: ["user-roles"] });
    },

    onError: (error) => {
      toast.error(error?.response?.data?.message );
    },
  });

   const AllRolesData = useQuery({
     queryKey: ["user-roles"],
     queryFn: async () => {
       const res = await axiosHandler.get(`/roles/all-roles-data`);
       return res?.data?.data;
     },
     onError: (error) => {
       toast.error(
         error?.response?.data?.message || "Failed to fetch user roles"
       );
     },
   });




  return {
    UserlistQuery,
    createUser,
    updateUser,
    removeUser,
    SearchUserList,
    AllRolesData,
  };
};
