import * as Yup from "yup";

export const plantValidationSchema = Yup.object({
  plant_name: Yup.string().required("Plant name is required").trim(),
  plant_code: Yup.string().required("Plant code is required").trim(),
  plant_address: Yup.string().nullable().trim(),

  company_id: Yup.string().required("Company is required"),

  description: Yup.string().nullable(),
});