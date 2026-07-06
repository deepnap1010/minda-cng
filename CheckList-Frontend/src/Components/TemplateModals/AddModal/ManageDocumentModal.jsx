import React, { useEffect, useState } from "react";
import { X, FileText, Upload, Plus } from "lucide-react";
import { useFormik } from "formik";
import { useCheckItem } from "../../../hooks/useCheckItem";
import SearchableDropdownwithRemove from "../../SearchableDropDown/SearchableDropDown2";
import { Field } from "../../modal/addModal/AddCheckItemModal";
import { useManageDocuments } from "../../../hooks/Template Hooks/useManageDocuments";
import { useDepartment } from "../../../hooks/useDepartment";

const AddDocumentModal = ({
  openModal,
  setOpenModal,
  editData = null,
  mode = "add",
}) => {
  const isView = mode === "view";
  const { postDocuments, updateDocuments } = useManageDocuments();
  const { GetCategory, AddCategroy } = useCheckItem();

  const [category, setCategoryList] = useState([]);
  const [showCategory, setShowCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const formatDateForInput = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const titleMap = {
    add: "Add Document",
    edit: "Update Document",
    view: "View Document",
  };

  const { getAllDepartmentData } = useDepartment();
  const [departments, setDepartments] = useState([]);


  const formik = useFormik({
    initialValues: {
      doc_name: editData?.doc_name ?? "",
      depart_name: editData?.depart_name ?? "",
      category: editData?.category ?? "",
      expiry: editData?.expiry ? formatDateForInput(editData.expiry) : "",
      attached_doc: null,
    },
    enableReinitialize: true,
    onSubmit: (values) => {
    
      let formdata = new FormData();
      formdata.append("attached_doc", values.attached_doc);
      formdata.append("depart_name", values.depart_name);
      formdata.append("category", values.category);
      formdata.append(
        "expiry",
        values.expiry ? new Date(values.expiry).toISOString() : ""
      );
      formdata.append("doc_name", values.doc_name);

      if (editData) {
        updateDocuments.mutate(
          { id: editData?._id, data: formdata },
          {
            onSuccess: () => {
              setOpenModal(false);
              formik.resetForm();
            },
          }
        );
      } else {
        postDocuments.mutate(formdata, {
          onSuccess: () => {
            setOpenModal(false);
            formik.resetForm();
          },
        });
      }
    },
  });

  useEffect(() => {
    if (GetCategory?.data) {
      const ListData = GetCategory.data
        .filter((item) => item?.category)
        .map((item) => ({
          category: item.category,
          id: item._id,
        }));
      setCategoryList(ListData);
    }
  }, [GetCategory?.data]);


 useEffect(() => {
  if (getAllDepartmentData?.data) {
    setDepartments(
      getAllDepartmentData.data.map((item) => ({
        label: item.name,
        value: item.name,
        _id: item._id,
      }))
    );
  }
}, [getAllDepartmentData?.data]);





  const { values, handleChange, handleSubmit, setFieldValue } = formik;

  if (!openModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="absolute inset-0" onClick={() => setOpenModal(false)} />

      <div className="relative h-full w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto">
        {/* CLOSE */}
        <button
          className="absolute right-4 top-4 text-gray-400 hover:text-black transition"
          onClick={() => setOpenModal(false)}
        >
          <X size={22} />
        </button>

        <h2 className="text-2xl font-semibold mb-6">
          {titleMap[mode]}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* DOCUMENT NAME */}
          <Input
            label="Document Name"
            name="doc_name"
            value={values.doc_name}
            onChange={handleChange}
            readOnly={isView}
          />

          {/* DEPARTMENT */}
          <Field label="Department">
            <SearchableDropdownwithRemove
              placeholder="Select department"
              options={departments}
              value={formik.values.depart_name}
              getOptionLabel={(o) => o.label}
              getOptionValue={(o) => o.value}
              getOptionId={(o) => o._id}
              onChange={(val) =>
                formik.setFieldValue(
                  "depart_name",
                  typeof val === "object" ? val.value : val
                )
              }
              type="depart_name"
              isDisabled={isView}
            />
          </Field>



          {/* CATEGORY */}
          <Field label="Category">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <SearchableDropdownwithRemove
                placeholder="Select category"
                options={category.map((t) => ({
                  label: t.category,
                  value: t.category,
                  _id: t.id,
                }))}
                value={formik.values.category}
                getOptionLabel={(o) => o.label}
                getOptionValue={(o) => o.value}
                getOptionId={(o) => o._id}
                onChange={(val) =>
                  formik.setFieldValue("category", val)
                }
                type="category"
              />

              {!isView && !showCategory && (
                <button
                  type="button"
                  onClick={() => setShowCategory(true)}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition"
                >
                  <Plus size={14} /> Add Category
                </button>
              )}

              {showCategory && (
                <div className="flex gap-2 pt-2">
                  <input
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter category name"
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg"
                    onClick={() => {
                      if (!newCategory.trim()) return;
                      AddCategroy.mutate({
                        newCategory: newCategory,
                      });
                      setNewCategory("");
                      setShowCategory(false);
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setShowCategory(false);
                      setNewCategory("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </Field>

          {/* EXPIRY */}
          <label className="block">
            <span className="font-medium">Expiry Date</span>
            <input
              type="date"
              name="expiry"
              value={values.expiry}
              onChange={handleChange}
              readOnly={isView}
              className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-lg"
            />
          </label>

          {/* FILE */}
          <label className="block">
            <span className="font-medium">Attach Document</span>

            {isView && editData?.attached_doc ? (
              <div className="mt-3 flex items-center gap-2 text-blue-600">
                <FileText size={18} />
                <span className="text-sm">
                  {editData.attached_doc}
                </span>
              </div>
            ) : (
              <>
                <div
                  className="mt-3 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file)
                      setFieldValue("attached_doc", file);
                  }}
                  onClick={() =>
                    document
                      .getElementById("documentUpload")
                      .click()
                  }
                >
                  <Upload
                    className="mx-auto mb-3 text-gray-500"
                    size={32}
                  />
                  <p className="font-medium">
                    Drag & drop file here
                  </p>
                  <p className="text-sm text-gray-500">
                    or{" "}
                    <span className="text-blue-600 font-medium">
                      browse
                    </span>
                  </p>

                  <input
                    id="documentUpload"
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={(e) =>
                      setFieldValue(
                        "attached_doc",
                        e.target.files[0]
                      )
                    }
                  />
                </div>

                {values.attached_doc && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <FileText size={16} />
                    <span className="truncate">
                      {values.attached_doc.name}
                    </span>
                  </div>
                )}
              </>
            )}
          </label>

          {/* SUBMIT */}
          {!isView && (
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
            >
              {titleMap[mode]}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

/* ---------- INPUT ---------- */

const Input = ({ label, ...props }) => (
  <label className="block">
    <span className="font-medium">{label}</span>
    <input
      {...props}
      className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-lg"
    />
  </label>
);

export default AddDocumentModal;
