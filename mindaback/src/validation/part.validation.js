import * as yup from "yup";

export const partValidationSchema = yup.object().shape({
  part_name: yup
    .string()
    .required("Part name is required")
    .trim(),

  part_number: yup
    .string()
    .required("Part number is required")
    .trim(),
});
