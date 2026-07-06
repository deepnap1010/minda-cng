import { useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Eye,
  View,
} from "lucide-react";
import Pagination from "../Components/Pagination/Pagination.jsx";
import { useDebounce } from "../hooks/useDebounce";
import { UsePart } from "../hooks/usePart.js";
import Refresh from "../components/Refresh/Refresh";
import AddPartsModal from "../Components/modal/addModal/AddPartsModal.jsx";
import ViewPartsModal from "../components/modal/ViewModal/ViewParts.jsx";
import NoDataFound from "../components/NoDataFound/NoDataFound.jsx";

const actionBtn =
  "p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:shadow-md";

const Parts = () => {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editTable, setEditTable] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [showRefresh, setShowRefresh] = useState(false);

  const {  value } = useDebounce(search);
  const { getPartData, removeParts, searchQuery } = UsePart(page, limit, value);

  const filteredParts = value
    ? (searchQuery?.data ?? [])
    : getPartData?.data || [];

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this part?")) {
      removeParts.mutate(id);
    }
  };

  const handleRefresh = async () => {
    setPage(1);
    setSearch("");
    setShowRefresh(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.all([getPartData.refetch(), minDelay]);
    setShowRefresh(false);
  };

  return (
    <div className="w-full p-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Parts</h1>
        <p className="text-gray-500 text-sm">Manage your parts</p>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white shadow rounded-2xl p-4 mt-4 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:max-w-[300px] border border-gray-200 rounded-lg px-3 py-2">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search parts..."
            className="w-full outline-none text-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditTable(null);
              setMode("add");
              setOpenModal(true);
            }}
            className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={18} /> Add New Part
          </button>

          <button
            onClick={handleRefresh}
            className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-100"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="relative min-h-[300px] bg-white rounded-2xl shadow mt-6 p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <h2 className="text-gray-800 text-lg font-semibold">
            {filteredParts.length} Parts Found
          </h2>

          <div className="flex items-center gap-4 text-gray-600">
            <span>Show:</span>
            <select
              className="border border-gray-200 rounded-lg px-2 py-1 cursor-pointer"
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

        {/* MOBILE */}
        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="grid gap-4 sm:hidden">
            {filteredParts?.map((part) => (
              <div
                key={part._id}
                className="rounded-xl p-4 shadow-sm bg-white border border-gray-200"
              >
                {/* TOP INFO */}
                <div className="flex justify-between items-center">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
                    {part.part_number}
                  </span>

                  <div >


                    {/* Icons BELOW the label */}
                    <div className="flex justify-end items-center gap-4">
                      <button
                        title="View"
                        className={`${actionBtn} text-blue-500 hover:bg-blue-100`}
                        onClick={() => {
                          setEditTable(part);
                          setMode("view");
                          setOpenModal(true);
                        }}
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        title="Edit"
                        className={`${actionBtn} text-green-600 hover:bg-green-100`}
                        onClick={() => {
                          setEditTable(part);
                          setMode("edit");
                          setOpenModal(true);
                        }}
                      >
                        <Edit2 size={18} />
                      </button>

                      {/* <button
                        title="Delete"
                        className={`${actionBtn} text-red-500 hover:bg-red-100`}
                        onClick={() => handleDelete(part._id)}
                      >
                        <Trash2 size={18} />
                      </button> */}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-gray-700 font-medium">
                  {part.part_name}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Material Code: {part.material_code || "N/A"}
                </p>

                <p className="text-sm text-gray-500">
                  Total Assembly: {part.total_assemblies}
                </p>

                {/* ACTIONS */}

              </div>
            ))}
          </div>
        )}

        {/* DESKTOP */}
        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full  min-w-[700px] text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm">
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Parts No.
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Parts Name
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Material Code
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Model Name
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Total Assembly
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap items-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="text-gray-700">
                {filteredParts?.length === 0 ? (
                  <NoDataFound
                    title="0 Assembly Lines Found"
                    subtitle="No assembly line data available."
                    colSpan={7}
                  />
                ) : (
                  filteredParts?.map((pro) => (
                    <tr
                      key={pro._id}
                      className="border-b border-gray-200 hover:bg-blue-50 transition align-middle"
                    >
                      <td className="px-5 py-4 align-middle">
                        {pro.part_number}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
                          {pro.part_name}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        {pro.material_code || "N/A"}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        {pro.modal_name || "N/A"}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        {pro.integration_count
                          ||  0}
                      </td>

                      <td className=" align-middle">
                        <div className="flex">
                          <button
                            title="View"
                            className={`${actionBtn} text-blue-500 hover:bg-blue-100`}
                            onClick={() => {
                              setEditTable(pro);
                              setMode("view");
                              setOpenModal(true);
                            }}
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            title="Edit"
                            className={`${actionBtn} text-green-600 hover:bg-green-100`}
                            onClick={() => {
                              setEditTable(pro);
                              setMode("edit");
                              setOpenModal(true);
                            }}
                          >
                            <Edit2 size={18} />
                          </button>

                          {/* <button
                            title="Delete"
                            className={`${actionBtn} text-red-500 hover:bg-red-100`}
                            onClick={() => handleDelete(pro._id)}
                          >
                            <Trash2 size={18} />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {openModal && mode !== "view" && (
        <AddPartsModal
          openModal={openModal}
          setOpenModal={setOpenModal}
          mode={mode}
          initialData={editTable}
        />
      )}

      {/* VIEW MODAL */}
      {openModal && mode === "view" && (
        <ViewPartsModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          data={editTable}
        />
      )}

      {/* PAGINATION */}
      <Pagination
        page={page}
        setPage={setPage}
        hasNextpage={filteredParts?.length === limit}
      />
    </div>
  );
};

export default Parts;
