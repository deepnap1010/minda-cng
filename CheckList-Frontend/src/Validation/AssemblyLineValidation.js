import * as yup from "yup";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const assemblyValidationSchema = yup.object({
    assembly_name: yup
        .string()
        .trim()
        .required("Assembly name is required"),

   
    company_id: yup
        .string().required("Company is required"),

    plant_id: yup
        .string()
        .required("Plant is required"),

        
});
