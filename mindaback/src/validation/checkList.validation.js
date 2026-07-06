import * as yup from "yup";

export const checkListValidationSchema = yup.object().shape({
  item: yup
    .string()
    .required("Item is required")
    .trim(),

  description: yup
    .string()
    .nullable()
    .trim(),

  check_list_method: yup
    .string()
    .required("Check list method is required"),

  check_list_time: yup
    .string()
    .required("Check list time is required"),

  result_type: yup
    .string()
    .required("Result type is required"),

  min: yup
    .number()
    .nullable()
    .when("result_type", {
      is: (value) => value === "numeric",
      then: (schema) =>
        schema
          .typeError("Min must be a number")
          .required("Min value is required"),
      otherwise: (schema) => schema.notRequired(),
    }),

  max: yup
    .number()
    .nullable()
    .when("result_type", {
      is: (value) => value === "numeric",
      then: (schema) =>
        schema
          .typeError("Max must be a number")
          .required("Max value is required")
          .moreThan(yup.ref("min"), "Max must be greater than Min"),
      otherwise: (schema) => schema.notRequired(),
    }),

  uom: yup
    .string()
    .nullable()
    .when("result_type", {
      is: (value) => value === "numeric",
      then: (schema) => schema.required("UOM is required"),
      otherwise: (schema) => schema.notRequired(),
    }),

  process: yup
    .mixed()
    .test("is-uuid", "Invalid process ID", (value) => {
      if (value === null || value === undefined || value === "") return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(String(value));
    })
    .required("Process is required"),
});
