import * as yup from "yup";

export const documentValidationSchema = yup.object({
  doc_name: yup
    .string()
    .trim()
    .required("Document name is required"),

  category: yup
    .string()
    .trim()
    .required("Category is required"),

  expiry: yup
    .date()
    .nullable()
    .typeError("Expiry must be a valid date"),
});
