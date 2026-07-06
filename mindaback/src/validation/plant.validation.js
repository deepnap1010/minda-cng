import * as Yup from "yup";

export const plantValidationSchema = Yup.object().shape({
  plant_name: Yup.string()
    .required("Plant name is required")
    .trim(),

  plant_address: Yup.string()
    .nullable()
    .trim(),

  company_id: Yup.mixed()
    .required("Company ID is required")
    .test("is-uuid", "Invalid company ID", (value) => {
      if (value === null || value === undefined || value === "") return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(String(value));
    }),

  description: Yup.string()
    .nullable()
});
