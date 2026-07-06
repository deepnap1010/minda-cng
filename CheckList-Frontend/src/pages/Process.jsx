import { useState } from "react";
import { Plus, RefreshCw, Search, Edit2, Trash2, Eye } from "lucide-react";
import AddProcessModal from "../components/modal/addModal/AddProcessModal";
import { useProcess } from "../hooks/useProcess.js";
import { useDebounce } from "../hooks/useDebounce.js";
import Pagination from "../Components/Pagination/Pagination.jsx";
import Refresh from "../components/Refresh/Refresh";
import NoDataFound from "../components/NoDataFound/NoDataFound.jsx";

const actionBtn =
  "p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:shadow-md";

const Process = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editTable, setEditTable] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [limit, setLimit] = useState(10);
  const [mode, setMode] = useState("add");
  const { debounce, value } = useDebounce(search)
  const { getProcessData, DeleteProcess, searchQuery } = useProcess(value, page, limit)

  const [showRefresh, setShowRefresh] = useState(false);
  const filteredProcesses = debounce
    ? searchQuery?.data ?? []
    : getProcessData?.data ?? [];
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this Process Data?")) {
      DeleteProcess.mutate(id);
    }
  };

  const handleRefresh = async () => {
    setPage(1);
    setSearch("");
    setShowRefresh(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.all([getProcessData.refetch(), minDelay]);
    setShowRefresh(false);  // Hide overlay
  };

  const formatDateDMY = (date) => {
    if (!date) return "N/A";

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };



  return (
    <div className="w-full p-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Process</h1>
        <p className="text-gray-500 text-sm">Manage your Processes</p>
      </div>

      <div className="bg-white shadow-sm rounded-2xl p-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:max-w-[300px] border border-gray-300 rounded-lg px-3 py-2">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search process..."
            className="w-full outline-none text-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <div className="flex justify-between items-center ">
            <button
              onClick={() => {
                setEditTable(null);
                setOpenModal(true);
                setViewModal(null);
                setMode("add");
              }}
              className="px-5 py-2 bg-blue-500 text-white rounded-lg w-full justify-center hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus size={18} /> Add New Process
            </button>
          </div>

          <button
            className="border border-gray-200 w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 text-gray-700"
            onClick={handleRefresh}
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      <div className="relative min-h-[300px] bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 mt-6 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <h2 className="text-gray-800 text-lg font-semibold">
            {filteredProcesses?.length} Process Found
          </h2>

          <div className="flex items-center gap-4 text-gray-600">
            <span>Show:</span>
            <select
              className="border border-gray-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-0 "
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option>5</option>
              <option>10</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>
        </div>

        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="grid gap-4 sm:hidden mt-4">
            {filteredProcesses?.map((pro, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white"
              >
                <div className="flex justify-between items-center">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
                    {pro.process_no}
                  </span>

                  <div className="flex items-center  gap-2">
                    <button
                      className={`${actionBtn} text-blue-500 hover:bg-blue-100`}
                      onClick={() => {
                        setOpenModal(true);
                        setMode("view");
                        setViewModal(pro);
                      }}
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      title="Edit"
                      className={`${actionBtn} text-green-600 hover:bg-green-100`}
                      onClick={() => {
                        setOpenModal(true);
                        setMode("edit");
                        setEditTable(pro);
                      }}
                    >
                      <Edit2 size={18} />
                    </button>

                    <button
                      onClick={() => handleDelete(pro?._id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-gray-700 font-medium">
                  {pro.process_name}
                </p>
              </div>
            ))}
          </div>
        )}

        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="overflow-x-auto hidden sm:block rounded-xl border border-gray-200">
            <table className="w-full min-w-[700px] text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700 text-sm text-center">
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Process No.
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Process Name
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Compnay Name
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Plant Name
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Created At
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Updated At
                  </th>
                  <th className="px-5 py-3 font-semibold text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="text-gray-700">
                {filteredProcesses?.length === 0 ? (
                  <NoDataFound
                    title="0 Process Found"
                    subtitle="No assembly line data available."
                    colSpan={7}
                  />
                ) : (
                  filteredProcesses?.map((pro, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-200 hover:bg-blue-50/40 transition-all duration-200 text-center"
                    >
                      <td className="px-5 py-4">{pro.process_no}</td>
                      <td className="px-5 py-4 ">
                        <span className="inline-flex items-center justify-center bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm text-nowrap">
                          {pro.process_name}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {pro?.company?.company_name}
                      </td>
                      <td className="px-5 py-4">
                        {pro?.plant?.plant_name} ({pro?.plant?.plant_code})
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-5 py-4 text-nowrap">
                          {formatDateDMY(pro.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-5 py-4 text-nowrap">
                          {formatDateDMY(pro.updatedAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            title="Edit"
                            className={`${actionBtn} text-green-600 hover:bg-green-100`}
                            onClick={() => {
                              setOpenModal(true);
                              setMode("edit");
                              setEditTable(pro);
                            }}
                          >
                            <Edit2 size={18} />
                          </button>

                          {/* <button
                            title="Delete"
                            className={`${actionBtn} text-red-500 hover:bg-red-100`}
                          >
                             <Trash2
                              size={18}
                              onClick={() => handleDelete(pro?._id)}
                            />
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

      <AddProcessModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        editTable={editTable}
        viewModal={viewModal}
        mode={mode}
      />

      <Pagination
        page={page}
        setPage={setPage}
        hasNextpage={filteredProcesses?.length === limit}
      />
    </div>
  );
};

export default Process;
