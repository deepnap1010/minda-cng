import * as Yup from "yup";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const validationSchema = Yup.object({
    process: Yup.string().required("Process is required"),
    item: Yup.string().required("Item is required"),
    check_list_method: Yup.string().required("Check Item method is required"),
    check_list_time: Yup.string().required("Check Item time is required"),
    result_type: Yup.string().required("Result type is required"),

    min: Yup.number().when("result_type", {
        is: "measurement",
        then: () =>
            Yup.number()
                .typeError("Min must be a number")
                .required("Min value required"),
        otherwise: () => Yup.number().nullable(),
    }),

    max: Yup.number().when("result_type", {
        is: "measurement",
        then: () =>
            Yup.number()
                .typeError("Max must be a number")
                .required("Max value required"),
        otherwise: () => Yup.number().nullable(),
    }),

    uom: Yup.string().when("result_type", {
        is: "measurement",
        then: () => Yup.string().required("UOM is required"),
        otherwise: () => Yup.string().nullable(),
    }),

    file: Yup.mixed()
        .nullable()
        .test(
            "fileSize",
            "File size must be less than 5MB",
            (value) => {
                if (!value) return true;

              
                const file = value instanceof File ? value : value?.[0];

                if (!file) return true;

                return file.size <= MAX_FILE_SIZE;
            }
        ),
});
