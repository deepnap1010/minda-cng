import * as yup from "yup";

export const processValidationSchema = yup.object({
  process_name: yup
    .string()
    .required("Process name is required"),
});
