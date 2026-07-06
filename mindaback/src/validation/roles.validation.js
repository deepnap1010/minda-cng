import * as yup from 'yup';

export const roleValidationSchema = yup.object({
  name: yup.string().required('Role name is required'),
  description: yup.string().nullable(),
  permissions: yup.array().of(yup.string().required('Permission must be a string')).min(1, 'At least one permission is required').required('Permissions are required'),
});
