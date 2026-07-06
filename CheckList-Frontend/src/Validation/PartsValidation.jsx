import * as yup from "yup";

export const partsValidationSchema = yup.object({
    parts_name: yup
        .string()
        .required("Part name is required"),

    partss_no: yup
        .string()
        .required("Part number is required"),
});
