import React, { useState } from "react";
import { Search, Plus, Eye, Edit2, Trash2 } from "lucide-react";
import AddDepartmentModal from "../components/modal/addModal/AddDepartmentModal";
import { useDepartment } from "../hooks/useDepartment";
import Pagination from "../Components/Pagination/Pagination";
import NoDataFound from "../components/NoDataFound/NoDataFound";
import { useDebounce } from "../hooks/useDebounce";

const Department = () => {

  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit | view
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const { debounce, value } = useDebounce(search)
  const { getDepartmentData, deleteDepartment } = useDepartment(value,page,limit);

//  console.log(getDepartmentData?.data)
  const filteredDepartments = getDepartmentData?.data || [] ;


  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this Department ?")) {
      deleteDepartment.mutate(id)
    }
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Departments</h1>
        <p className="text-gray-500 text-sm">Manage department information</p>
      </div>

      {/* Search + Add */}
      <div className="bg-white shadow-sm rounded-2xl p-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:max-w-[300px] border border-gray-300 rounded-lg px-3 py-2">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search departments..."
            className="w-full outline-none text-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            setMode("add");
            setSelectedDepartment(null);
            setOpenModal(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600"
        >
          <Plus size={18} /> Add Department
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 mt-6 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <h2 className="font-semibold text-gray-800 text-lg mb-4">
            {filteredDepartments?.length} Departments Found
          </h2>

          <div className="flex items-center gap-4 text-gray-600">
            <span>Show:</span>
            <select
              className="border border-gray-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-0"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                {/* <th className="px-5 py-3 font-semibold">Department Code</th> */}
                <th className="px-5 py-3 font-semibold">Department Name</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredDepartments?.length === 0 ? (
                <NoDataFound
                  title="0 Departments Found"
                  subtitle="No companies available to display."
                  colSpan={6}
                />
              ) : (
                filteredDepartments?.map((d) => (
                  <tr
                    key={d?._id}
                    className="hover:bg-blue-50 transition"
                  >
                    {/* <td className="px-5 py-4">{d.department_code}</td> */}
                    <td className="px-5 py-4 font-medium text-gray-800 text-nowrap">{d?.name}</td>
                    <td className="px-5 py-4 max-w-[250px] truncate">
                      {d?.description}
                    </td>
                    <td className="px-5 py-4 flex justify-center gap-5">
                      {/* View */}
                      <Eye
                        size={20}
                        className="text-blue-500 cursor-pointer"
                        onClick={() => {
                          setMode("view");
                          setSelectedDepartment(d);
                          setOpenModal(true);
                        }}
                      />

                      {/* Edit */}
                      <Edit2
                        size={20}
                        className="text-green-600 cursor-pointer"
                        onClick={() => {
                          setMode("edit");
                          setSelectedDepartment(d);
                          setOpenModal(true);
                        }}
                      />

                      {/* Delete (UI only) */}
                      {/* <Trash2
                    onClick={()=>handleDelete(d?._id)}
                      size={20}
                      className="text-red-500 cursor-pointer"
                    /> */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AddDepartmentModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        editData={selectedDepartment}
        mode={mode}
      />

      <Pagination
        page={page}
        setPage={setPage}
        hasNextpage={filteredDepartments?.length === limit}
      />

    </div>
  );
};

export default Department;
