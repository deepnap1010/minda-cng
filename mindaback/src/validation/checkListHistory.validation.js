import * as yup from "yup";

const isUUID = (value) => {
  if (value === null || value === undefined || value === "") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(String(value));
};

export const checkListHistoryItemSchema = yup.object({
  checkList: yup
    .mixed()
    .test("is-uuid", "Invalid checklist ID", (value) => isUUID(value))
    .required("Checklist is required"),

  process_id: yup
    .mixed()
    .test("is-uuid", "Invalid process ID", (value) => isUUID(value))
    .required("Process is required"),

  assembly: yup
    .mixed()
    .test("is-uuid", "Invalid assembly ID", (value) => isUUID(value))
    .required("Assembly is required"),

  result: yup
    .string()
    .required("Result is required"),
});

export const checkListHistoryRequestSchema = yup.object({
  data: yup
    .array()
    .of(checkListHistoryItemSchema)
    .min(1, "At least one checklist history record is required")
    .required("Data array is required"),
});
