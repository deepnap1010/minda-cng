import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosHandler from "../config/axiosconfig";
import { toast } from "react-toastify";

export const useLogin = () => {
  const qc = useQueryClient();

  const logedinUser = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // DEV-ONLY login bypass: set VITE_AUTH_BYPASS=true in .env to browse the
      // full app (sidebar/navbar + all routes) without a real session. Never
      // active in a production build (guarded by import.meta.env.DEV).
      if (import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === "true") {
        return {
          id: "DEV-ADMIN",
          name: "Plant Admin (dev)",
          email: "dev@local",
          is_admin: true,
          userRole: { name: "admin", permissions: [] },
        };
      }
      try {
        const res = await axiosHandler.get("/users/loged-in-user");
        sessionStorage.setItem("user", JSON.stringify(res?.data?.user));
        return res.data.user;
      } catch (error) {
        const status = error.response?.status;
        const isLoggedOut =
          status === 401 ||
          status === 400 ||
          status === 403 ||
          status === 404 ||
          !error.response;

        if (isLoggedOut) {
          sessionStorage.removeItem("user");
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 30_000,
  });

  const loginUser = useMutation({
    mutationFn: async (data) => {
      const res = await axiosHandler.post("/users/login-user", data);
      return res.data;
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      await qc.fetchQuery({ queryKey: ["users"] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });

  const logOutUser = useMutation({
    mutationFn: async () => {
      await axiosHandler.get("/users/logout-user");
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["users"] });
      sessionStorage.removeItem("user");
      toast.success("Logout Successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Logout failed");
    },
  });

  const forgotPassoword = useMutation({
    mutationFn: async (data) => {
      const res = await axiosHandler.post("/users/verify-email", data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Request failed");
    },
  });

  return {
    logedinUser,
    loginUser,
    logOutUser,
    forgotPassoword,
  };
};
