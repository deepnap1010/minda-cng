import { defineConfig, loadEnv } from 'vite'
import tailwindcss from "@tailwindcss/vite";
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Proxy target = the ORIGIN of VITE_BACKEND_URL, so changing the .env backend
  // keeps the dev proxy in sync. Browser talks to localhost (same origin) → Vite
  // forwards server-side → no browser CORS.
  let backendOrigin = "https://digitisationapi.jpmgroup.co.in";
  try {
    backendOrigin = new URL(env.VITE_BACKEND_URL).origin;
  } catch { /* keep default */ }

  // The backend's CORS allows requests with NO Origin but rejects unknown origins.
  // The browser attaches "Origin: http://localhost:5180" on POST (e.g. login),
  // which isn't in the backend allow-list → "Not allowed by CORS". Strip Origin/
  // Referer on the way out so the backend treats it as an origin-less call and
  // accepts it. Frontend-only — the backend is untouched.
  const stripOrigin = (proxy) => {
    proxy.on("proxyReq", (proxyReq) => {
      proxyReq.removeHeader("origin");
      proxyReq.removeHeader("referer");
    });
    proxy.on("proxyReqWs", (proxyReq) => {
      proxyReq.removeHeader("origin");
    });
  };

  return {
    plugins: [tailwindcss(), react()],
    server: {
      proxy: {
        "/api": {
          target: backendOrigin,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost", // store the auth cookie for localhost
          configure: stripOrigin,
        },
        "/socket.io": {
          target: backendOrigin,
          changeOrigin: true,
          secure: true,
          ws: true,
          configure: stripOrigin,
        },
      },
    },
  };
});
