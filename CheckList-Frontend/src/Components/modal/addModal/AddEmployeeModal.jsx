import React, { useState } from "react";
import { X } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useCompanies } from "../../../hooks/useCompanies";
import { usePlantsByCompany, UsePlantName } from "../../../hooks/UsePlantName";
import { useUserRole } from "../../../hooks/useUserRole";
import { RegisterEmployee } from "../../../hooks/useRegisterEmployee";
import { Eye } from "lucide-react";
import { EyeOff } from "lucide-react";
import SearchableDropdown from "../../SearchableDropDown/SearchableDropdown";
import { useDepartment } from "../../../hooks/useDepartment";

export default function AddEmployeeModal({
  open,
  onClose,
  mode = "add",
  initialData = null,
  assemblyLines = [],
  onSubmit,
}) {
  const isView = mode === "view";

  const { AllCompanyData } = useCompanies(null, null, open);
  const { AllRolesData } = useUserRole();
  const { createEmployee, updateEmployee, getAllHOD } = RegisterEmployee();
  const [showPassword, setShowPassword] = useState(false);
  const [additionalPlantOpen, setAdditionalPlantOpen] = useState(false);
  const additionalPlantRef = React.useRef(null);
  const { getAllPlantName } = UsePlantName();
  const { getAllDepartmentData } = useDepartment();

  const validationSchema = Yup.object({
    user_id: Yup.string().required("Employee code is required"),
    full_name: Yup.string().required("Full name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    role: Yup.string().required("Role is required"),
    designation: Yup.string().required("Designation is required"),
    password:
      mode === "add"
        ? Yup.string().required("Password is required")
        : Yup.string(),
    employee_company: Yup.string().required("Company is required"),
    department_id: Yup.string().required("Department is required"),
    Employee_plant: Yup.string().required("Plant is required"),
    // hod_id: Yup.mixed().when("is_hod", {
    //   is: false,
    //   then: (schema) => schema.required("HOD is required"),
    //   otherwise: (schema) => schema.nullable(),
    // }),
  });
  const formik = useFormik({
    initialValues: {
      user_id: initialData?.user_id || "",
      full_name: initialData?.full_name || "",
      email: initialData?.email || "",
      role: initialData?.userRole?._id || "",
      designation: initialData?.designation || initialData?.desigination || "",
      password: "",
      employee_company: initialData?.company?._id || "",
      Employee_plant: initialData?.plant?._id || "",
      additional_plants: Array.isArray(initialData?.additional_plants)
        ? initialData.additional_plants
        : [],
      department_id: initialData?.department_id || "",
      assambly_line: initialData?.assambly_line?.map((l) => l._id) || [],
      is_hod: initialData?.is_hod || false,
      hod_id: initialData?.hod_id || null,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const payload = {
        user_id: values.user_id,
        full_name: values.full_name,
        email: values.email,
        desigination: values.designation,
        employee_plant: values.Employee_plant,
        additional_plants: values.additional_plants,
        employee_company: values.employee_company,
        department_id: values.department_id,
        role: values.role,
        assambly_line: values.assambly_line,
        is_hod: values.is_hod,
        hod_id: values.hod_id,
      };

      // ADD password only in ADD mode
      if (mode === "add") {
        payload.password = values.password;
      }

      // UPDATE EMPLOYEE
      if (mode === "edit") {
        updateEmployee.mutate({
          id: initialData._id,
          data: payload,
        });
      } else {
        createEmployee.mutate(payload);
      }

      formik.resetForm();
      onClose();
    },
  });

  const plantsQuery = usePlantsByCompany(formik.values.employee_company);
  const allPlants = getAllPlantName?.data || [];

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        additionalPlantRef.current &&
        !additionalPlantRef.current.contains(event.target)
      ) {
        setAdditionalPlantOpen(false);
      }
    };

    if (additionalPlantOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [additionalPlantOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white h-full w-[420px] shadow-lg p-6 animate-slideLeft overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {mode === "add"
              ? "Add Employee"
              : mode === "edit"
                ? "Edit Employee"
                : "View Employee"}
          </h2>

          <button onClick={onClose} className="cursor-pointer">
            <X size={22} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              name="username"
              autoComplete="username"
              tabIndex={-1}
              aria-hidden="true"
              style={{
                position: "absolute",
                opacity: 0,
                height: 0,
                width: 0,
                pointerEvents: "none",
              }}
            />

            {/* Employee code */}
            <Field label="Employee Code">
              <span className="text-red-500">*</span>
              <input
                name="user_id"
                type="search"
                autoComplete="new-password" // 🔥 important
                value={formik.values.user_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />

              {formik.touched.user_id && formik.errors.user_id && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.user_id}
                </p>
              )}
            </Field>

            {/* Full Name */}
            <Field label="Full Name">
              <span className="text-red-500">*</span>
              <input
                name="full_name"
                disabled={isView}
                value={formik.values.full_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.full_name && formik.errors.full_name && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.full_name}
                </p>
              )}
            </Field>

            {/* Email */}
            <Field label="Email">
              <span className="text-red-500">*</span>
              <input
                name="email"
                type="email"
                disabled={isView}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.email}
                </p>
              )}
            </Field>

            {/* Password (only for add) */}
            {mode === "add" && (
              <Field label="Password">
                <span className="text-red-500">*</span>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    autoComplete="new-password"
                    onBlur={formik.handleBlur}
                    className="input pr-10"
                  />
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {formik.errors.password}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition"
                  >
                    {showPassword ? (
                      <EyeOff className="text-blue-500" size={20} />
                    ) : (
                      <Eye className="text-blue-500" size={20} />
                    )}
                  </button>
                </div>
              </Field>
            )}

            {/* Designation */}
            <Field label="Designation">
              <span className="text-red-500">*</span>
              <input
                name="designation"
                disabled={isView}
                value={formik.values.designation}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.designation && formik.errors.designation && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.designation}
                </p>
              )}
            </Field>

            {/* Role */}
            <Field label="Role">
              <span className="text-red-500">*</span>
              <SearchableDropdown
                placeholder="Search Role"
                options={AllRolesData?.data || []}
                value={formik.values.role}
                disabled={isView}
                getOptionLabel={(r) => r.name}
                getOptionValue={(r) => r._id}
                onChange={(val) => {
                  formik.setFieldValue("role", val);
                }}
                onBlur={() => {
                  formik.setFieldTouched("role", true);
                }}
                error={formik.touched.role && formik.errors.role}
              />
            </Field>

            {/* Company */}
            <Field label="Company">
              <span className="text-red-500">*</span>
              <SearchableDropdown
                placeholder="Search Company"
                options={AllCompanyData?.data || []}
                value={formik.values.employee_company}
                onChange={(val) => {
                  formik.setFieldValue("employee_company", val);
                  formik.setFieldValue("company_id", val?._id); // store id if needed

                  formik.setFieldValue("Employee_plant", "");
                  formik.setFieldValue("additional_plants", []);
                  formik.setFieldTouched("Employee_plant", false);
                }}
                error={
                  formik.touched.employee_company &&
                  formik.errors.employee_company
                }
                disabled={isView}
                getOptionLabel={(c) => c.company_name}
                getOptionValue={(c) => c._id}
              />
            </Field>

            {/* Department */}
            <Field label="Department">
              <span className="text-red-500">*</span>

              <SearchableDropdown
                placeholder="Search Department"
                options={getAllDepartmentData?.data || []}
                value={formik.values.department_id}
                onChange={(val) => {
                  formik.setFieldValue("department_id", val);
                }}
                onBlur={() => {
                  formik.setFieldTouched("department_id", true);
                }}
                error={
                  formik.touched.department_id && formik.errors.department_id
                }
                getOptionLabel={(d) => d.name}
                getOptionValue={(d) => d._id}
              />
            </Field>

            <Field label="Plant">
              <span className="text-red-500">*</span>
              <SearchableDropdown
                options={plantsQuery?.data || []}
                value={formik.values.Employee_plant}
                disabled={isView}
                getOptionLabel={(p) => `${p.plant_name}(${p.plant_code})`}
                getOptionValue={(p) => p._id}
                onChange={(val) => {
                  formik.setFieldValue("Employee_plant", val);
                  if (val?._id) {
                    formik.setFieldValue(
                      "additional_plants",
                      formik.values.additional_plants.filter(
                        (p) => p !== val._id,
                      ),
                    );
                  }
                }}
                onBlur={() => {
                  formik.setFieldTouched("Employee_plant", true);
                }}
                error={
                  formik.touched.Employee_plant && formik.errors.Employee_plant
                }
              />
            </Field>

            <div className="relative" ref={additionalPlantRef}>
              <label className="text-sm text-gray-700 font-medium">
                Additional Plants
              </label>
              <div
                onClick={() =>
                  !isView && setAdditionalPlantOpen(!additionalPlantOpen)
                }
                className={`mt-2 min-h-[42px] border rounded-lg px-3 py-2 cursor-pointer flex items-center justify-between
                  ${additionalPlantOpen ? "ring-2 ring-blue-200 border-blue-500" : "border-gray-300"}
                  ${isView && "bg-gray-100 cursor-not-allowed"}
                `}
              >
                <div className="flex flex-wrap gap-2 max-w-[85%]">
                  {formik.values.additional_plants.length === 0 && (
                    <span className="text-gray-400 text-sm">
                      Select additional plants
                    </span>
                  )}

                  {formik.values.additional_plants.map((pid) => (
                    <span
                      key={pid}
                      className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-100"
                    >
                      {allPlants.find((p) => p._id === pid)?.plant_name || pid}{" "}
                      ({allPlants.find((p) => p._id === pid)?.plant_code || pid}
                      )
                      {!isView && (
                        <X
                          size={14}
                          className="cursor-pointer hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            formik.setFieldValue(
                              "additional_plants",
                              formik.values.additional_plants.filter(
                                (p) => p !== pid,
                              ),
                            );
                          }}
                        />
                      )}
                    </span>
                  ))}
                </div>

                {!isView && (
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      additionalPlantOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>

              {additionalPlantOpen && !isView && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {allPlants.length === 0 ? (
                    <div className="p-3 text-gray-400 text-sm">
                      No plants available
                    </div>
                  ) : (
                    allPlants
                      .filter((plant) => {
                        const selectedPlantId =
                          formik.values.Employee_plant?._id ||
                          formik.values.Employee_plant;
                        return plant._id !== selectedPlantId;
                      })
                      .map((plant) => (
                        <label
                          key={plant._id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formik.values.additional_plants.includes(
                              plant._id,
                            )}
                            onChange={() => {
                              const exists =
                                formik.values.additional_plants.includes(
                                  plant._id,
                                );
                              formik.setFieldValue(
                                "additional_plants",
                                exists
                                  ? formik.values.additional_plants.filter(
                                      (p) => p !== plant._id,
                                    )
                                  : [
                                      ...formik.values.additional_plants,
                                      plant._id,
                                    ],
                              );
                            }}
                            className="accent-blue-600"
                          />
                          <span className="text-gray-700 text-sm font-medium">
                            {plant?.plant_name}({plant?.plant_code})
                          </span>
                        </label>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Assembly Line Dropdown */}
            {/* <div>
              <label className="text-sm font-medium">Assembly Line</label>

              <button
                type="button"
                disabled={isView}
                onClick={() => setAssemblyOpen(!assemblyOpen)}
                className="input flex justify-between cursor-pointer"
              >
                {formik.values.assambly_line.length
                  ? `${formik.values.assambly_line.length} Selected`
                  : "Select Assembly Lines"}
              </button>

              {assemblyOpen && !isView && (
                <div className="border rounded-lg p-2 mt-1 max-h-40 overflow-y-auto">
                  {assemblyLines.map((line) => (
                    <label key={line._id} className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={formik.values.assambly_line.includes(line._id)}
                        onChange={() => {
                          const list = formik.values.assambly_line;
                          formik.setFieldValue(
                            "assambly_line",
                            list.includes(line._id)
                              ? list.filter((id) => id !== line._id)
                              : [...list, line._id]
                          );
                        }}
                      />
                      {line.line_name}
                    </label>
                  ))}
                </div>
              )}
            </div> */}

            <Field>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="is_hod"
                  className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer"
                >
                  <span>HOD</span>
                  <input
                    id="is_hod"
                    name="is_hod"
                    type="checkbox"
                    disabled={isView}
                    checked={formik.values.is_hod}
                    onChange={(e) => {
                      formik.setFieldValue("is_hod", e.target.checked);
                      if (e.target.checked) {
                        formik.setFieldValue("hod_id", null);
                      }
                    }}
                    onBlur={formik.handleBlur}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <SearchableDropdown
                  placeholder="Search hod"
                  options={getAllHOD?.data || []}
                  value={formik.values?.hod_id}
                  disabled={isView || formik.values.is_hod}
                  getOptionLabel={(r) => `${r?.full_name} (${r?.user_id})`}
                  getOptionValue={(r) => r._id}
                  onChange={(val) => {
                    formik.setFieldValue("hod_id", val);
                    if (formik.values?.hod_id) {
                      formik.setFieldValue("is_hod", false);
                    }
                  }}
                  onBlur={() => {
                    formik.setFieldTouched("hod_id", true);
                  }}
                  error={formik.touched.hod_id && formik.errors.hod_id}
                />
              </div>
            </Field>
            {/* Submit */}
            {!isView && (
              <button
                type="submit"
                className="bg-blue-600 cursor-pointer text-white py-2 rounded-lg mt-4"
              >
                {mode === "add" ? "Add Employee" : "Update Employee"}
              </button>
            )}
          </div>
        </form>
      </div>
      ;{/* ANIMATION */}
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideLeft {
          animation: slideLeft 0.3s ease-out;
        }
        .input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm text-gray-700 font-medium">{label}</label>
      {children}
    </div>
  );
}
