import * as Yup from "yup";

export const workflowValidationSchema = Yup.object({
  name: Yup.string()
    .required("Workflow name is required")
    .trim()
    .min(2, "Workflow name must be at least 2 characters"),
  workflow: Yup.array()
    .of(
      Yup.object({
        group: Yup.string().required("Group is required"),
        user: Yup.string().nullable().default(""),
      })
    )
    .min(1, "At least one workflow group is required")
    .required("Workflow is required"),
});
