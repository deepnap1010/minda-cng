
import * as yup from "yup";


export const DepartmentSchema = yup.object({
    name: yup
        .string()
        .trim()
        .max(255, "Department name is too long")
        .required("Department name is required"),
    description: yup.string().trim().nullable(),
});



