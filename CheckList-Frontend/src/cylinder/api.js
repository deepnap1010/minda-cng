// CNG module API client. Routes through Minda's authenticated axios instance
// (cookie auth + token refresh), so the CNG calls reuse the user's Minda login.
// The CNG backend is mounted on Minda's own server at /api/v1/cng/*.
//
// Set VITE_CYLINDER_MOCK=true to force the bundled sample data (dev only).
import axiosHandler from "../config/axiosconfig";

export const USE_MOCK = import.meta.env.VITE_CYLINDER_MOCK === "true";

// Backend wraps responses as { message, data } — unwrap to data here.
export async function cngGet(path, params) {
  const res = await axiosHandler.get(`/cng${path}`, { params });
  return res?.data?.data;
}

export async function cngPost(path, body) {
  const res = await axiosHandler.post(`/cng${path}`, body);
  return res?.data?.data;
}

export async function cngPut(path, body) {
  const res = await axiosHandler.put(`/cng${path}`, body);
  return res?.data?.data;
}
