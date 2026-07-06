import React, { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import { useLogin } from "../../hooks/useLogin";

const forgotPasswordValidationSchema = Yup.object({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
});

export default function ForgetPassword() {
  const [emailSent, setEmailSent] = useState(false);
  const { forgotPassoword } = useLogin();

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: forgotPasswordValidationSchema,
    onSubmit: (values) => {
      forgotPassoword.mutate(values, {
        onSuccess: () => setEmailSent(true),
      });
    },
  });

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center"
      style={{ backgroundImage: "url('/login.png')" }}
    >
      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />

      {/* CENTER CONTAINER */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1440px] flex justify-center">
          {/* CARD */}
          <div
            className="
              relative
              w-full max-w-sm sm:max-w-md lg:max-w-lg
              bg-[#1f2937]/90
              backdrop-blur-xl
              border border-white/20
              rounded-2xl
              px-6 sm:px-10
              pt-16 sm:pt-20
              pb-10
              text-white
              shadow-2xl
            "
          >
            {/* LOGO */}
            <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-xl flex items-center justify-center">
              <img
                src="https://jpmgroup.co.in/assets/svg/logo-color.svg"
                alt="logo"
                className="w-12 sm:w-14"
              />
            </div>

            {!emailSent ? (
              <form onSubmit={formik.handleSubmit}>
                <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8 sm:mb-10">
                  Forgot Password
                </h2>

                {/* EMAIL */}
                <div className="mb-8">
                  <label className="block text-sm mb-2 font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="
                        w-full pl-12 pr-4 py-3
                        rounded-lg bg-white text-black
                        focus:ring-2 focus:ring-blue-500 outline-none
                      "
                    />
                  </div>
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-red-400 text-xs mt-1">
                      {formik.errors.email}
                    </p>
                  )}
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={forgotPassoword.isPending}
                  className="
                    w-full py-3 rounded-lg
                    bg-blue-600 hover:bg-blue-700
                    transition font-semibold
                    disabled:opacity-50
                  "
                >
                  {forgotPassoword.isPending ? "Sending..." : "Send Reset Link"}
                </button>

                {/* BACK */}
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </form>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-6">
                  Check Your Email
                </h2>

                <p className="text-gray-300 mb-8">
                  We’ve sent a password reset link to your email address.
                </p>

                <button
                  onClick={() => setEmailSent(false)}
                  className="
                    w-full py-3 rounded-lg
                    bg-blue-600 hover:bg-blue-700
                    transition font-semibold mb-5
                  "
                >
                  Try Again
                </button>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
