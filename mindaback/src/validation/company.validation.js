import * as Yup from "yup";

export const companyValidationSchema = Yup.object().shape({
  company_name: Yup.string().required("Company name is required").trim(),
  company_address: Yup.string().required("Company address is required").trim(),
  gst_no: Yup.string().required("GST number is required ").matches(/^[0-9A-Z]{10}$/, "GST number must be 15 characters (alphanumeric uppercase)"),
  description: Yup.string().optional(),
});
