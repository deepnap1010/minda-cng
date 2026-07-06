// import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { UsePlantName } from "../../../hooks/UsePlantName";
import { useFormik } from "formik";
import { useCompanies } from "../../../hooks/useCompanies";
import { plantValidationSchema } from "../../../Validation/PlantValidation";
import SearchableDropdown from "../../SearchableDropDown/SearchableDropDown";

const AddPlantModal = (
  { openModal, setOpenModal, editTable, viewModal, mode }
) => {
  const { CreatePlantName, UpdatedPLant } = UsePlantName()
  const { AllCompanyData } = useCompanies()
  const isView = mode === "view";
  const title = {
    add: "Add Plant",
    edit: "Update Plant",
    view: "View Details"
  }


  const formik = useFormik({
    initialValues:{
      plant_name: viewModal?.plant_name || editTable?.plant_name || "",
      plant_code: viewModal?.plant_code || editTable?.plant_code || "",
      plant_address: viewModal?.plant_address  || editTable?.plant_address ||"",
      company_id: viewModal?.company?._id || editTable?.company?._id|| "",
      description: viewModal?.description || editTable?.description|| "",
      gst: viewModal?.gst || editTable?.gst|| "",
    },
    enableReinitialize:true,
    validationSchema:plantValidationSchema ,
    onSubmit: (value)=>{
      if(editTable){
        UpdatedPLant.mutate({id:editTable?._id,data:value},{
          onSuccess: ()=>{
            formik.resetForm()
            setOpenModal(false)
          }
        })
      }else{
        CreatePlantName.mutate(value, {
          onSuccess: () => {
            formik.resetForm()
            setOpenModal(false)
          }
        })
      }
    }
  })




 

  return (
    <div className={`${openModal ? "translate-x-0" : "translate-x-full"}
 fixed inset-0 bg-black/40  z-50 flex justify-end`}>

      <div 
        className="absolute inset-0 bg-black/30 "
        onClick={() => { setOpenModal(false); formik.resetForm() }}
      />


      <div className="ml-auto h-full w-full max-w-md bg-white shadow-xl p-6 relative animate-slideLeft">

        <button
          className="absolute right-4 top-4 text-gray-600 hover:text-black"
          onClick={() => { setOpenModal(false); formik.resetForm() }}
        >
          <X size={20} />
        </button>


        <h2 className="text-xl font-semibold mb-6">
          {title[mode]}
        </h2>


       <form onSubmit={formik.handleSubmit} >
          <label className="block mb-4">
            <span className="text-gray-700 font-medium">
              Plant Name{" "}
              {mode !== "view" && <span className="text-red-500">*</span>}
            </span>
            <input
              type="text"
              placeholder="Plant Name"
              value={formik.values.plant_name}
              readOnly={isView}
              className={`mt-2 w-full px-4 py-3 border rounded-lg 
                 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400
                `}
              onChange={formik.handleChange}
              name="plant_name"
            />
            {formik?.touched.plant_name && formik?.errors?.plant_name && (
              <p className="text-sm text-red-500">{formik?.errors?.plant_name}</p>
            )}
          </label>

          <label className="block mb-4">
            <span className="text-gray-700 font-medium">
              Plant Code{" "}
              {mode !== "view" && <span className="text-red-500">*</span>}
            </span>
            <input
              type="text"
              placeholder="Plant Name"
              value={formik.values.plant_code}
              readOnly={isView}
              className={`mt-2 w-full px-4 py-3 border rounded-lg 
                 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400
                `}
              onChange={formik.handleChange}
              name="plant_code"
            />
            {formik?.touched.plant_code && formik?.errors?.plant_code && (
              <p className="text-sm text-red-500">{formik?.errors?.plant_code}</p>
            )}
          </label>

          <label className="block mb-4">
            <span className="text-gray-700 font-medium">Address <span className="font-light">(optional)</span></span>
            <textarea
              placeholder="Address"
              value={formik.values.plant_address}
              readOnly={isView}
              className={`mt-2 w-full px-4 py-3 border rounded-lg 
                 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400
                `}
              onChange={formik.handleChange}
              name="plant_address"
            />
            {formik?.touched.plant_address && formik?.errors?.plant_address && (
              <p className="text-sm text-red-500">{formik?.errors?.plant_address}</p>
            )}
          </label>

          <label className="block mb-4">
            <span className="text-gray-700 font-medium">Company <span className="text-red-500">*</span></span>
            <SearchableDropdown
              placeholder="Search Company"
              options={AllCompanyData?.data || []}
              value={formik.values.company_id}
              onChange={(val) => formik.setFieldValue("company_id", val)}
              error={formik.touched.company_id && formik.errors.company_id}
              disabled={isView}
              getOptionLabel={(c) => c.company_name}
              getOptionValue={(c) => c._id}
            />
          </label>
          <label className="block mb-6">
            <span className="text-gray-700 font-medium">GST <span className="font-light">(optional)</span></span>
            <input

              placeholder="gst"
               value={formik.values.gst}
              name="gst"
              readOnly={isView}
              className={`mt-2 w-full px-4 py-3 border rounded-lg 
                 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400
                `}
              onChange={formik.handleChange}
            />
            {formik?.touched.gst && formik?.errors?.gst && (
              <p>{formik?.errors?.gst}</p>
            )}
          </label>

          <label className="block mb-6">
            <span className="text-gray-700 font-medium">Description <span className="font-light">(optional)</span></span>
            <textarea
            
              placeholder="description"
              value={formik.values.description}
              name="description"
              readOnly={isView}
             className={`mt-2 w-full px-4 py-3 border rounded-lg 
                 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400
                `}
              onChange={formik.handleChange}
            />
            {formik?.touched.description && formik?.errors?.description && (
              <p>{formik?.errors?.description}</p>
            )}
          </label>

          <button
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

export default AddPlantModal;
