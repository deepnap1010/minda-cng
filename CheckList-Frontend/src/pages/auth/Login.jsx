// import React, { useState } from "react";
// import { Eye, EyeOff, User, Lock } from "lucide-react";
// import { useFormik } from "formik";
// import { loginValidationSchema } from "../../Validation/LoginValidation";
// import { useLogin } from "../../hooks/useLogin";
// import { useNavigate } from "react-router-dom";

// export default function Login() {
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();
//   const { loginUser } = useLogin();

//   const formik = useFormik({
//     initialValues: { email: "", password: "" },
//     validationSchema: loginValidationSchema,
//     onSubmit: (values) => {
//       loginUser.mutate(values, {
//         onSuccess: () => navigate("/", { replace: true }),
//       });
//     },
//   });

//   return (
//     <div
//       className="min-h-screen w-full relative bg-cover bg-center"
//       style={{ backgroundImage: "url('/login.png')" }}
//     >
//       {/* OVERLAY */}
//       <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />

//       {/* MAX WIDTH CONTAINER */}
//       <div className="relative z-10 min-h-screen flex items-center justify-center">
//         <div className="w-full max-w-[1440px] flex items-center justify-center lg:justify-between px-6 sm:px-10 lg:px-16">
//           {/* LEFT CONTENT */}
//           <div className="hidden lg:block w-[45%] text-white">
//             <h1 className="text-4xl xl:text-5xl font-semibold mb-12 leading-tight">
//               JPM Group Digitization
//             </h1>

//             <ul className="space-y-6 text-lg xl:text-xl">
//               {[
//                 "Create & Manage Digital Checklist Templates",
//                 "Centralized Control Across All PLC & Modules",
//                 "Real-Time Task Tracking, Reviews & Approvals",
//                 "Improve Compliance, Accuracy & Operational Efficiency",
//               ].map((text, i) => (
//                 <li key={i} className="flex items-center gap-4">
//                   <span className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center font-bold">
//                     ✓
//                   </span>
//                   {text}
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* LOGIN CARD */}
//           <form
//             onSubmit={formik.handleSubmit}
//             className="
//               relative
//               w-full max-w-sm sm:max-w-md lg:max-w-lg
//               bg-[#1f2937]/90
//               backdrop-blur-xl
//               border border-white/20
//               rounded-2xl
//               px-6 sm:px-10
//               pt-16 sm:pt-20
//               pb-8
//               text-white
//               shadow-2xl
//               lg:mr-12 xl:mr-24
//             "
//           >
//             {/* LOGO */}
//             <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-xl flex items-center justify-center">
//               <img
//                 src="https://jpmgroup.co.in/assets/svg/logo-color.svg"
//                 alt="logo"
//                 className="w-12 sm:w-14"
//               />
//             </div>

//             {/* EMAIL */}
//             <div className="mb-5">
//               <label className="text-sm mb-1 block">Username</label>
//               <div className="relative">
//                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input
//                   type="text"
//                   name="email"
//                   placeholder="Username"
//                   className="w-full pl-12 py-3 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
//                   {...formik.getFieldProps("email")}
//                 />
//               </div>
//               {formik.touched.email && formik.errors.email && (
//                 <p className="text-red-400 text-xs mt-1">
//                   {formik.errors.email}
//                 </p>
//               )}
//             </div>

//             {/* PASSWORD */}
//             <div className="mb-6">
//               <label className="text-sm mb-1 block">Password</label>
//               <div className="relative">
//                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   placeholder="Password"
//                   className="w-full pl-12 pr-12 py-3 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
//                   {...formik.getFieldProps("password")}
//                 />
//                 <span
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
//                 >
//                   {showPassword ? <EyeOff /> : <Eye />}
//                 </span>
//               </div>
//               {formik.touched.password && formik.errors.password && (
//                 <p className="text-red-400 text-xs mt-1">
//                   {formik.errors.password}
//                 </p>
//               )}
//             </div>

//             {/* OPTIONS */}
//             <div className="flex justify-between text-sm mb-6">
//               <label className="flex gap-2">
//                 <input type="checkbox" /> Remember Me
//               </label>
//               <span
//                 onClick={() => navigate("/forgot-password")}
//                 className="text-blue-400 cursor-pointer"
//               >
//                 Forgot Password?
//               </span>
//             </div>

//             {/* BUTTON */}
//             <div className="space-y-4">
//               <button
//                 type="submit"
//                 disabled={loginUser.isPending}
//                 className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold cursor-pointer"
//               >
//                 {loginUser.isPending ? "Logging in..." : "Login"}
//               </button>

//               <button
//                 type="button"
//                 onClick={() => navigate("/timelabs-login")}
//                 className="
//     w-full py-3 rounded-lg
//     bg-cyan-500 hover:bg-cyan-600
//     text-white
//     transition
//     font-semibold
//     shadow-lg shadow-cyan-500/30
//     cursor-pointer
//   "
//               >
//                 Login with TimeLabs
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// import React, { useState, useEffect } from "react";
// import { Eye, EyeOff, User, Lock } from "lucide-react";
// import { useFormik } from "formik";
// import { loginValidationSchema } from "../../Validation/LoginValidation";
// import { useLogin } from "../../hooks/useLogin";
// import { useNavigate } from "react-router-dom";

// // ✅ IMPORT TIMELABS
// import { useTimeLabsSSO } from "timelabs-sso";

// export default function Login() {
//   const [showPassword, setShowPassword] = useState(false);

//   const navigate = useNavigate();
//   const { loginUser } = useLogin();

//   // ✅ TIMELABS CONFIG
//   const SSO_CONFIG = {
//     baseUrl: import.meta.env.VITE_TIMELABS_BASE_URL,
//     secretKey: import.meta.env.VITE_TIMELABS_SECRET_KEY,
//   };

//   // ✅ TIMELABS HOOK
//   const {
//     login: timeLabsLogin,
//     token,
//     error,
//     loading,
//     reset,
//   } = useTimeLabsSSO(SSO_CONFIG);

//   // ✅ NORMAL LOGIN
//   const formik = useFormik({
//     initialValues: { email: "", password: "" },
//     validationSchema: loginValidationSchema,
//     onSubmit: (values) => {
//       loginUser.mutate(values, {
//         onSuccess: () => navigate("/", { replace: true }),
//       });
//     },
//   });

//   // ✅ SEND TIMELABS TOKEN TO BACKEND
//   useEffect(() => {
//     if (token) {
//       verifyTimeLabsToken(token);
//     }
//   }, [token]);

//   // ✅ BACKEND VERIFICATION
//   const verifyTimeLabsToken = async (jweToken) => {
//     try {
//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL}/auth/timelabs`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             token: jweToken,
//           }),
//         },
//       );

//       const data = await response.json();

//       console.log("TimeLabs Auth Success:", data);

//       navigate("/", { replace: true });
//     } catch (err) {
//       console.error("TimeLabs verification failed:", err);
//     }
//   };

//   return (
//     <div
//       className="min-h-screen w-full relative bg-cover bg-center"
//       style={{ backgroundImage: "url('/login.png')" }}
//     >
//       {/* OVERLAY */}
//       <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />

//       {/* MAX WIDTH CONTAINER */}
//       <div className="relative z-10 min-h-screen flex items-center justify-center">
//         <div className="w-full max-w-[1440px] flex items-center justify-center lg:justify-between px-6 sm:px-10 lg:px-16">
//           {/* LEFT CONTENT */}
//           <div className="hidden lg:block w-[45%] text-white">
//             <h1 className="text-4xl xl:text-5xl font-semibold mb-12 leading-tight">
//               JPM Group Digitization
//             </h1>

//             <ul className="space-y-6 text-lg xl:text-xl">
//               {[
//                 "Create & Manage Digital Checklist Templates",
//                 "Centralized Control Across All PLC & Modules",
//                 "Real-Time Task Tracking, Reviews & Approvals",
//                 "Improve Compliance, Accuracy & Operational Efficiency",
//               ].map((text, i) => (
//                 <li key={i} className="flex items-center gap-4">
//                   <span className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center font-bold">
//                     ✓
//                   </span>
//                   {text}
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* LOGIN CARD */}
//           <form
//             onSubmit={formik.handleSubmit}
//             className="
//               relative
//               w-full max-w-sm sm:max-w-md lg:max-w-lg
//               bg-[#1f2937]/90
//               backdrop-blur-xl
//               border border-white/20
//               rounded-2xl
//               px-6 sm:px-10
//               pt-16 sm:pt-20
//               pb-8
//               text-white
//               shadow-2xl
//               lg:mr-12 xl:mr-24
//             "
//           >
//             {/* LOGO */}
//             <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-xl flex items-center justify-center">
//               <img
//                 src="https://jpmgroup.co.in/assets/svg/logo-color.svg"
//                 alt="logo"
//                 className="w-12 sm:w-14"
//               />
//             </div>

//             {/* EMAIL */}
//             <div className="mb-5">
//               <label className="text-sm mb-1 block">Username</label>

//               <div className="relative">
//                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

//                 <input
//                   type="text"
//                   name="email"
//                   placeholder="Username"
//                   className="w-full pl-12 py-3 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
//                   {...formik.getFieldProps("email")}
//                 />
//               </div>

//               {formik.touched.email && formik.errors.email && (
//                 <p className="text-red-400 text-xs mt-1">
//                   {formik.errors.email}
//                 </p>
//               )}
//             </div>

//             {/* PASSWORD */}
//             <div className="mb-6">
//               <label className="text-sm mb-1 block">Password</label>

//               <div className="relative">
//                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   placeholder="Password"
//                   className="w-full pl-12 pr-12 py-3 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
//                   {...formik.getFieldProps("password")}
//                 />

//                 <span
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
//                 >
//                   {showPassword ? <EyeOff /> : <Eye />}
//                 </span>
//               </div>

//               {formik.touched.password && formik.errors.password && (
//                 <p className="text-red-400 text-xs mt-1">
//                   {formik.errors.password}
//                 </p>
//               )}
//             </div>

//             {/* OPTIONS */}
//             <div className="flex justify-between text-sm mb-6">
//               <label className="flex gap-2">
//                 <input type="checkbox" /> Remember Me
//               </label>

//               <span
//                 onClick={() => navigate("/forgot-password")}
//                 className="text-blue-400 cursor-pointer"
//               >
//                 Forgot Password?
//               </span>
//             </div>

//             {/* TIMELABS ERROR */}
//             {error && (
//               <div className="mb-4 text-sm text-red-400">
//                 {error}

//                 <button
//                   type="button"
//                   onClick={reset}
//                   className="ml-2 underline"
//                 >
//                   Retry
//                 </button>
//               </div>
//             )}

//             {/* BUTTONS */}
//             <div className="space-y-4">
//               {/* NORMAL LOGIN */}
//               <button
//                 type="submit"
//                 disabled={loginUser.isPending}
//                 className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold cursor-pointer"
//               >
//                 {loginUser.isPending ? "Logging in..." : "Login"}
//               </button>

//               {/* TIMELABS LOGIN */}
//               <button
//                 type="button"
//                 onClick={timeLabsLogin}
//                 disabled={loading}
//                 className="
//                   w-full py-3 rounded-lg
//                   bg-cyan-500 hover:bg-cyan-600
//                   text-white
//                   transition
//                   font-semibold
//                   shadow-lg shadow-cyan-500/30
//                   cursor-pointer
//                 "
//               >
//                 {loading ? "Redirecting..." : "Login with TimeLabs"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { useFormik } from "formik";
import { loginValidationSchema } from "../../Validation/LoginValidation";
import { useLogin } from "../../hooks/useLogin";
import { useNavigate } from "react-router-dom";
import { useTimeLabsSSO } from "timelabs-sso";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosHandler from "../../config/axiosconfig.jsx";
import { getDefaultHomePath } from "../../utils/auth";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [timeLabsLoading, setTimeLabsLoading] = useState(false);
  const [timeLabsError, setTimeLabsError] = useState(null);

  const qc = useQueryClient();

  const navigate = useNavigate();
  const { loginUser } = useLogin();

  // Strip any trailing slash so the SDK builds ".../AuthPortal/Init"
  // (a trailing slash here produces an invalid "//AuthPortal/Init").
  const SSO_CONFIG = {
    baseUrl: (import.meta.env.VITE_TIMESLAB_URL || "").replace(/\/+$/, ""),
    secretKey: import.meta.env.VITE_TIMELABS_AUTH_KEY,
  };

  const {
    login: timeLabsLogin,
    token: timeLabsToken,
    loading,
    error,
    reset,
  } = useTimeLabsSSO(SSO_CONFIG);

  // Guard so the token is verified only once (effects run twice under
  // React StrictMode, and re-renders shouldn't re-submit the token).
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (timeLabsToken && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      verifyTimeLabsToken(timeLabsToken);
    }
  }, [timeLabsToken]);

  // ✅ STEP 2: Verify token with your backend
  const verifyTimeLabsToken = async (token) => {
    try {
      setTimeLabsLoading(true);
      setTimeLabsError(null);
      await axiosHandler.post("/users/timelabs-login", { token });
      // The page-load auth check already cached a `null` user (cookie wasn't set
      // yet). Invalidate it so fetchQuery re-hits /loged-in-user WITH the new
      // cookie instead of returning that stale null (which bounced us to /login
      // on the very first login).
      await qc.invalidateQueries({ queryKey: ["users"] });
      const loggedInUser = await qc.fetchQuery({ queryKey: ["users"] });
      if (!loggedInUser) {
        throw new Error("Could not establish session. Please try again.");
      }
      const redirectPath = getDefaultHomePath(loggedInUser);
      toast.success("Login successful");
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("TimeLabs verification failed:", error);
      hasVerifiedRef.current = false; // allow a retry
      setTimeLabsError(
        error?.response?.data?.message || "TimeLabs login failed"
      );
    } finally {
      setTimeLabsLoading(false);
    }
  };

  // ✅ Normal login
  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginValidationSchema,
    onSubmit: async (values) => {
      try {
        await loginUser.mutateAsync(values);

        const loggedInUser = await qc.fetchQuery({ queryKey: ["users"] });
        const redirectPath = getDefaultHomePath(loggedInUser);

        navigate(redirectPath || "/", { replace: true });
      } catch (error) {
        console.error("Normal login failed:", error);
      }
    },
  });

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center"
      style={{ backgroundImage: "url('/login.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-[1440px] flex items-center justify-center lg:justify-between px-6 sm:px-10 lg:px-16">
          {/* LEFT CONTENT */}
          <div className="hidden lg:block w-[45%] text-white">
            <h1 className="text-4xl xl:text-5xl font-semibold mb-12 leading-tight">
              JPM Group Digitization
            </h1>
            <ul className="space-y-6 text-lg xl:text-xl">
              {[
                "Create & Manage Digital Checklist Templates",
                "Centralized Control Across All PLC & Modules",
                "Real-Time Task Tracking, Reviews & Approvals",
                "Improve Compliance, Accuracy & Operational Efficiency",
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-4">
                  <span className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center font-bold">
                    ✓
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* LOGIN CARD */}
          <form
            onSubmit={formik.handleSubmit}
            className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg bg-[#1f2937]/90 backdrop-blur-xl border border-white/20 rounded-2xl px-6 sm:px-10 pt-16 sm:pt-20 pb-8 text-white shadow-2xl lg:mr-12 xl:mr-24"
          >
            {/* LOGO */}
            <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-xl flex items-center justify-center">
              <img
                src="https://jpmgroup.co.in/assets/svg/logo-color.svg"
                alt="logo"
                className="w-12 sm:w-14"
              />
            </div>

            {/* USERNAME */}
            <div className="mb-5">
              <label className="text-sm mb-1 block">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full pl-12 py-3 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
                  {...formik.getFieldProps("email")}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-400 text-xs mt-1">
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="mb-6">
              <label className="text-sm mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-3 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none"
                  {...formik.getFieldProps("password")}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-400 text-xs mt-1">
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* OPTIONS */}
            <div className="flex justify-between text-sm mb-6">
              <label className="flex gap-2">
                <input type="checkbox" /> Remember Me
              </label>
              <span
                onClick={() => navigate("/forgot-password")}
                className="text-blue-400 cursor-pointer"
              >
                Forgot Password?
              </span>
            </div>

            {/* ERRORS */}
            {(error || timeLabsError) && (
              <div className="mb-4 text-sm text-red-400">
                {error || timeLabsError}
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setTimeLabsError(null);
                  }}
                  className="ml-2 underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* BUTTONS */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={loginUser.isPending}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold cursor-pointer"
              >
                {loginUser.isPending ? "Logging in..." : "Login"}
              </button>

              {/* ✅ TIMELABS - just call timeLabsLogin() */}
               <button
                type="button"
                onClick={timeLabsLogin}
                disabled={loading || timeLabsLoading}
                className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition font-semibold shadow-lg shadow-cyan-500/30 cursor-pointer"
              >
                {loading || timeLabsLoading
                  ? "Please wait..."
                  : "Login with TimeLabs SSO"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
