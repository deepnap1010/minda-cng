import * as yup from "yup";

const uuidId = yup
  .mixed()
  .test("is-uuid", "Invalid ID", (value) => {
    if (value === null || value === undefined || value === "") return true;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(String(value));
  });

export const userValidationSchema = yup.object({
  full_name: yup
    .string()
    .trim()
    .max(100, "Full name is too long")
    .nullable(),

  email: yup
    .string()
    .trim()
    .email("Invalid email format")
    .required("Email is required"),

  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),

  desigination: yup
    .string()
    .trim()
    .max(100, "Designation is too long")
    .nullable(),

  user_id: yup
    .string()
    .trim()
    .nullable(),

  employee_plant: uuidId.nullable(),

  employee_company: uuidId.nullable(),

  role: uuidId.nullable(),
  department_id: uuidId.nullable(),
  hod_id: uuidId.nullable(),

  terminate: yup
    .boolean()
    .default(false)
});
