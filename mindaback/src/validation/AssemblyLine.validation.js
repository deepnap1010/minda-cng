import * as yup from "yup";

const isUUID = (value) => {
  if (value === null || value === undefined || value === "") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(String(value));
};

export const assemblyValidationSchema = yup.object().shape({
  assembly_name: yup
    .string()
    .trim()
    .required("Assembly name is required"),

  company_id: yup
    .mixed()
    .test("is-uuid", "Invalid company ID", (value) => isUUID(value))
    .required("Company is required"),

  plant_id: yup
    .mixed()
    .test("is-uuid", "Invalid plant ID", (value) => isUUID(value))
    .required("Plant is required"),




 

});
