import * as Yup from "yup";

export const loginValidationSchema = Yup.object({
   email: Yup.string().required("Email or user Id is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
});