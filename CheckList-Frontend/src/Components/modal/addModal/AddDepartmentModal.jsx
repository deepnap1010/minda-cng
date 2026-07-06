import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useFormik } from "formik";
import { useDepartment } from "../../../hooks/useDepartment";
import { DepartmentSchema } from "../../../Validation/DepartmentValidation";

const AddDepartmentModal = ({
  openModal,
  setOpenModal,
  editData = null,
  mode = "add",
}) => {
  const isView = mode === "view";

  const title = {
    add: "Add Department",
    edit: "Update Department",
    view: "View Details",
  };

  const { postDepartment, updatedDepartment } = useDepartment();

  const formik = useFormik({
    initialValues: {
      name: editData?.name || "",
      description: editData?.description || "",
    },
    enableReinitialize: true,
    validationSchema: DepartmentSchema ,
    onSubmit: (value) => {
     
      if (editData) {
        updatedDepartment.mutate({ id: editData?._id, value: value }, {
          onSuccess: () => {
            setOpenModal(false)
            formik.resetForm()
          }
        })
      } else {
        postDepartment.mutate(value, {
          onSuccess: () => {
            setOpenModal(false)
            formik.resetForm()
          }
        })
      }
    }
  })






  return (
    <div
      className={`${openModal ? "translate-x-0" : "translate-x-full"
        } fixed inset-0 bg-black/40 z-50 flex justify-end`}
    >

      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => setOpenModal(false)}
      />


      <div className="ml-auto h-full w-full max-w-md bg-white shadow-xl p-6 relative animate-slideLeft">

        <button
          className="absolute right-4 top-4 text-gray-600 hover:text-black"
          onClick={() => setOpenModal(false)}
        >
          <X size={20} />
        </button>


        <h2 className="text-xl font-semibold mb-6">
          {title[mode]}
        </h2>


        <form onSubmit={formik.handleSubmit}>

          <label className="block mb-4">
            <span className="text-gray-700 font-medium">
              Department Name{" "}
              {mode !== "view" && <span className="text-red-500">*</span>}
            </span>
            <input
              type="text"
              name="name"
              placeholder="Department Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              readOnly={isView}
              className="mt-2 w-full px-4 py-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {formik.errors.name}
              </p>
            )}
          </label>




          <label className="block mb-6">
            <span className="text-gray-700 font-medium">
              Description <span className="font-light">(optional)</span>
            </span>
            <textarea
              name="description"
              placeholder="Description"
              value={formik.values.description}
              onChange={formik.handleChange}
              readOnly={isView}
              className="mt-2 w-full px-4 py-3 border rounded-lg h-24 resize-none border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {formik.touched.description && formik.errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {formik.errors.description}
              </p>
            )}
          </label>


          {mode !== "view" && (
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {title[mode]}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddDepartmentModal;
