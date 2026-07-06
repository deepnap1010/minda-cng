import * as yup from "yup";

export const processValidationSchema = yup.object({
    process_name: yup
        .string()
        .required("Process name is required"),

    company_id: yup
        .string()
        .required("Process number is required"),
    plant_id: yup
        .string()
        .required("Process number is required"),
});
