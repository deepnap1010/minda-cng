import * as Yup from "yup";

export const companyValidationSchema = Yup.object({
    company_name: Yup.string().required("Company name is required").trim(),
    company_address: Yup.string().required("Company address is required").trim(),
    gst_no: Yup.string().required("PAN number is required ").matches(/^[0-9A-Z]{10}$/, "PAN number must be 10 characters (alphanumeric uppercase)"),
    description: Yup.string().optional(),
});
