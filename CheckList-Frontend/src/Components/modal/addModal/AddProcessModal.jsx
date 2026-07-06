import React, { useState } from "react";
import { X, PlusCircle, Trash2 } from "lucide-react";
import { useFormik } from "formik";
import { processValidationSchema } from "../../../Validation/ProcessValidation";
import { useProcess } from "../../../hooks/useProcess";
import SearchableDropdown from "../../SearchableDropDown/SearchableDropDown";
import { usePlantsByCompany } from "../../../hooks/UsePlantName";
import { useCompanies } from "../../../hooks/useCompanies";

export default function AddProcessModal({ openModal, setOpenModal, editTable, viewModal, mode }) {
  const { PostProcessData, UpdateProcess } = useProcess()
 const { AllCompanyData } = useCompanies();

  

  const formik = useFormik({
    initialValues: {
     
      process_name:editTable?.process_name || viewModal?.process_name || "",
      company_id: editTable?.company_id || viewModal?.company_id || "",
      plant_id: editTable?.plant_id || viewModal?.plant_id || "",
    },
    enableReinitialize:true,
    validationSchema: processValidationSchema,
    onSubmit: (value) => {
     if(editTable){
      UpdateProcess.mutate({value:value,id:editTable?._id},{
        onSuccess:()=>{
          setOpenModal(false)
          formik.resetForm()
        }
      })
     }else{
       PostProcessData.mutate(value, {
         onSuccess: () => {
           setOpenModal(false)
           formik.resetForm()
         }
       })
     }
    }
  })
  const PlantData = usePlantsByCompany(formik.values.company_id || editTable?.company_id || viewModal?.company_id);


  const isView = mode === "view";
  const title = {
    add: "Add Process",
    edit: "Update Edit",
    view: "View Process Details",
  };


  if (!open) return null;
  return (
    <div
      className={`${openModal ? "translate-x-0" : "translate-x-full"}
 fixed inset-0 bg-black/40  z-50 flex justify-end`}
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setOpenModal(false)}
      />

      <div className="ml-auto h-full w-full max-w-md bg-white shadow-xl p-6 relative animate-slideLeft overflow-y-auto">
        <button
          className="absolute cursor-pointer right-4 top-4 text-gray-600 hover:text-black"
          onClick={() => setOpenModal(false)}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-6">{title[mode]}</h2>

        <form onSubmit={formik.handleSubmit}>
          {/* <label className="block mb-4">
            <span className="text-gray-700 font-medium">Process No.</span>
            <input
              disabled={isView}
              type="text"
              value={formik.values.process_no}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="process_no"
              placeholder="Enter Process No."
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            {
              formik.touched.process_no && formik.errors.process_no && (
                <p className="text-sm text-red-500">{formik.errors.process_no}</p>
              )
            }
          </label> */}

          <label className="block mb-4">
            <span className="text-gray-700 font-medium">Process Name</span>
            <input
              disabled={isView}
              type="text"
              value={formik.values.process_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="process_name"
              placeholder="Enter Process Name"
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            {formik.touched.process_name && formik.errors.process_name && (
              <p className="text-sm text-red-500">
                {formik.errors.process_name}
              </p>
            )}
          </label>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <SearchableDropdown
              placeholder="Search Company"
              options={AllCompanyData?.data || []}
              value={formik.values.company_id}
              disabled={isView}
              getOptionLabel={(c) => c.company_name}
              getOptionValue={(c) => c._id}
              onChange={(val) => {
                formik.setFieldValue("company_id", val);
                formik.setFieldValue("plant_id", "");
                formik.setFieldTouched("plant_id", false);
              }}
              onBlur={() => {
                formik.setFieldTouched("company_id", true);
              }}
              error={formik.touched.company_id && formik.errors.company_id}
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plant
            </label>
            <SearchableDropdown
              placeholder={
                formik.values.company_id
                  ? "Search Plant"
                  : "Select Company first"
              }
              options={PlantData?.data || []}
              value={formik.values.plant_id}
              getOptionLabel={(p) => `${p?.plant_name} (${p?.plant_code})`}
              getOptionValue={(p) => p._id}
              onChange={(val) => {
                formik.setFieldValue("plant_id", val);
              }}
              onBlur={() => {
                formik.setFieldTouched("plant_id", true);
              }}
              error={formik.touched.plant_id && formik.errors.plant_id}
            />
          </div>

          <button
            disabled={isView}
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {title[mode]}
          </button>
        </form>
      </div>
    </div>
  );
}
