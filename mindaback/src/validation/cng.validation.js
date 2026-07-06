import * as yup from "yup";
import { BadRequestError } from "../utils/errorHandler.js";

export async function validate(schema, data) {
  try {
    return await schema.validate(data, { abortEarly: false, stripUnknown: false });
  } catch (err) {
    const msg = Array.isArray(err?.errors) ? err.errors.join("; ") : err?.message || "Invalid request body";
    throw new BadRequestError(msg, "cng.validation");
  }
}

export const scanSchema = yup.object({
  machineId: yup.string().trim().required("machineId is required"),
  pipeId: yup.string().trim().required("pipeId is required"),
  stageNo: yup.number().integer().min(1).max(21).nullable().optional(),
});

export const cylinderSchema = yup.object({
  // pipeId is OPTIONAL — when the operator submits a new cut it is minted
  // server-side (see createCylinderManual). Supply it only to revise/lookup.
  pipeId: yup.string().trim().nullable().optional(),
  metrics: yup.object().nullable().optional(),
  status: yup.string().trim().nullable().optional(),
  line: yup.string().trim().nullable().optional(),
  allowRevision: yup.boolean().nullable().optional(),
});

export const keySchema = yup.object({
  label: yup.string().trim().nullable().optional(),
});
