import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

export const RegisterEmployee = (
  hodvales,
  cmId,
  plId,
  search,
  page,
  limit,
  enabled = true,
) => {
  const qc = useQueryClient();

  const getAllEmployee = useQuery({
    queryKey: ["employees", page, limit],
    queryFn: async () => {
      const res = await axiosHandler.get(
        `/users/get-employees?page=${page}&&limit=${limit}`,
      );
      return res?.data?.data;
    },
    enabled: !search,
    placeholderData: keepPreviousData,
  });
  const getAllHOD = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axiosHandler.get(`/users/get-all-hods`);
      return res?.data?.data;
    },
  });
  const getAllHODWithUser = useQuery({
    queryKey: ["employees-without"],
    queryFn: async () => {
      const res = await axiosHandler.get(`users/get-with-hods-users`);
      return res?.data?.data;
    },
  });
  const getAllAssignedTemp = useQuery({
    queryKey: ["get-assign-template"],
    queryFn: async () => {
      const res = await axiosHandler.get(`/users/get-assign-template`);
      return res?.data?.data;
    },
  });

  const PostHistorTem = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      if (!payload.submission_id) {
        const sub = data?.submission || data?.submissionData || data?.submissionObj;
        payload.submission_id =
          data?.submission_id ||
          sub?.submission_id ||
          sub?._id ||
          data?.submissionId ||
          data?.id ||
          null;
      }
      if (!payload.submission_id) {
        throw new Error("Submission ID is required");
      }
      const res = await axiosHandler.post("/status-history/create", payload);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["get-assign-template"] });
      qc.invalidateQueries({ queryKey: ["my-approvals-history"] });
      toast.success(data?.message);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to submit");
    },
  });
  const createEmployee = useMutation({
    mutationFn: async (data) => {
      const res = await axiosHandler.post("/users/register-user", data);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(data?.message);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to create Employee",
      );
    },
  });
  const searchEmployee = useQuery({
    queryKey: ["search-employee", hodvales, cmId, plId, search],
    queryFn: async () => {
      const res = await axiosHandler.get("/users/search-employee", {
        params: {
          is_hod: hodvales,
          company: cmId || undefined,
          plant: plId || undefined,
          search,
        },
      });
      return res.data.data;
    },
    enabled: !!hodvales || !!search || !!cmId || !!plId,
    keepPreviousData: true,
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axiosHandler.put(
        `/users/update-user-by-admin/${id}`,
        data,
      );
      return res?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully" || data?.message);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message);
    },
  });

  const toggleTerminateEmployee = useMutation({
    mutationFn: async ({ id, terminate }) => {
      const res = await axiosHandler.put(`/users/update-user-by-admin/${id}`, {
        terminate,
      });

      return {
        terminate,
        message: res?.data?.message,
      };
    },

    onSuccess: ({ terminate }) => {
      if (terminate) {
        toast.error("User Terminated Successfully", {});
      } else {
        toast.success("User Successfully Un-Terminated", {});
      }

      qc.invalidateQueries({ queryKey: ["employees"] });
    },

    onError: (error) => {
      toast.error(error?.response?.data?.message || "Something went wrong");
    },
  });
  const AllEmpData = useQuery({
    queryKey: ["get-all-employees"],
    queryFn: async () => {
      const res = await axiosHandler.get("/users/get-all-employees");
      return res?.data?.data;
    },
  });

  const WithoutHodEmpData = useQuery({
    queryKey: ["get-without-hods"],
    queryFn: async () => {
      const res = await axiosHandler.get("/users/get-user-by-hod");
      return res?.data?.data;
    },
  });

  // ── Recycle bin ──────────────────────────────────────────────────────────
  const getBinnedEmployees = useQuery({
    queryKey: ["binned-employees"],
    queryFn: async () => {
      const res = await axiosHandler.get("/users/get-binned-employees");
      return res?.data?.data;
    },
    placeholderData: keepPreviousData,
  });

  const binEmployee = useMutation({
    mutationFn: async (id) => {
      const res = await axiosHandler.put(`/users/bin-employee/${id}`);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["binned-employees"] });
      toast.success(data?.message || "Employee moved to bin");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to move to bin");
    },
  });

  const restoreEmployee = useMutation({
    mutationFn: async (id) => {
      const res = await axiosHandler.put(`/users/restore-employee/${id}`);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["binned-employees"] });
      toast.success(data?.message || "Employee restored");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to restore");
    },
  });

  const deleteEmployeePermanent = useMutation({
    mutationFn: async (id) => {
      const res = await axiosHandler.delete(`/users/delete-employee/${id}`);
      return res?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["binned-employees"] });
      toast.success(data?.message || "Employee permanently deleted");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete");
    },
  });

  return {
    getAllEmployee,
    createEmployee,
    searchEmployee,
    updateEmployee,
    toggleTerminateEmployee,
    AllEmpData,
    getAllHOD,
    getAllHODWithUser,
    getAllAssignedTemp,
    PostHistorTem,
    WithoutHodEmpData,
    getBinnedEmployees,
    binEmployee,
    restoreEmployee,
    deleteEmployeePermanent,
  };
};