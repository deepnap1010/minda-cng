import axios from "axios";

// In dev, call the backend through Vite's same-origin proxy (see vite.config.js)
// by using only the URL path — this removes the cross-origin CORS block.
// In production, use the full absolute VITE_BACKEND_URL.
const resolveBaseURL = () => {
  const full = import.meta.env.VITE_BACKEND_URL;
  if (!import.meta.env.DEV) return full;
  try {
    return new URL(full).pathname; // e.g. "/api/v1" → proxied by Vite
  } catch {
    return "/api/v1";
  }
};

export const axiosHandler = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
});

let isRefreshing = false;
let queue = [];

const processQueue = (error) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  queue = [];
};

axiosHandler.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    const isRefreshRequest = originalRequest.url?.includes("/users/refresh-token");
    const isSessionCheck = originalRequest.url?.includes("/users/loged-in-user");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      !isSessionCheck
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => axiosHandler(originalRequest));
      }

      isRefreshing = true;
      try {
        await axiosHandler.post("/users/refresh-token");

        processQueue(null);
        return axiosHandler(originalRequest);
      } catch (err) {
        processQueue(err);

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosHandler;
