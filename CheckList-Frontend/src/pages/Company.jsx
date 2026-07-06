import { useState } from "react";
import { RefreshCw, Search, Eye, Edit2, Trash2, Plus } from "lucide-react";
import CompanyDrawer from "../Components/modal/addModal/CompanyDrawer";
import { useCompanies } from "../hooks/useCompanies";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../Components/Pagination/Pagination";
import Refresh from "../components/Refresh/Refresh";
import ViewCompanyDrawer from "../components/modal/ViewModal/ViewCompany";
import NoDataFound from "../components/NoDataFound/NoDataFound";

const Company = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editTable, setEditTable] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [limit, setLimit] = useState(10);
  const [mode, setMode] = useState("add");
  const {  value } = useDebounce(search);
  const { listQuery, remove, searchQuery } = useCompanies(value, page, limit);
  const [showRefresh, setShowRefresh] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const filteredCompanies = value
    ? (searchQuery?.data ?? [])
    : (listQuery?.data ?? []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      remove.mutate(id);
    }
  };

  const handleRefresh = async () => {
    setPage(1);
    setSearch("");
    setShowRefresh(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.all([listQuery.refetch(), minDelay]);
    setShowRefresh(false); // Hide overlay
  };

  return (
    <div className="p-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Companies</h1>
        <p className="text-gray-500 text-sm">Manage Company</p>
      </div>

      <div className="bg-white shadow-sm rounded-2xl p-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:max-w-[300px] border border-gray-300 rounded-lg px-3 py-2">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search companies..."
            className="w-full outline-none text-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* ADD */}
          <button
            onClick={() => {
              setEditTable(null);
              setOpenModal(true);
              setMode("add");
              setViewModal(null);
            }}
            className="px-5 py-2 bg-blue-500 text-white rounded-lg w-full justify-center hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={18} />
            Add New Company
          </button>

          {/* REFRESH */}
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto border border-gray-300 bg-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-100 transition"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="relative min-h-[300px] bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 mt-6 p-5">
        {/* Header: Count + Show Dropdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <h2 className="text-gray-800 text-lg font-semibold">
            {filteredCompanies.length} Companies Found
          </h2>

          {/* Show Dropdown */}
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

        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="grid gap-4 sm:hidden mt-4">
            {filteredCompanies?.map((com) => (
              <div
                key={com._id}
                className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
                    {com.company_name}
                  </span>

                  <div className="flex gap-4">
                    <Eye
                      onClick={() => {
                        setOpenModal(true);
                        setViewModal(com);
                        setMode("view");
                      }}
                      size={18}
                      className="text-blue-500 cursor-pointer"
                    />
                    <Edit2
                      size={18}
                      className="text-green-600 cursor-pointer"
                      onClick={() => {
                        setEditTable(com);
                        setOpenModal(true);
                        setMode("edit");
                      }}
                    />
                    {/* <Trash2
                      size={18}
                      className="text-red-500 cursor-pointer"
                      onClick={() => handleDelete(com._id)}
                    /> */}
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <p className="max-w-[300px] truncate">
                    <strong>Address:</strong> {com.company_address}
                  </p>
                  <p>
                    <strong>PAN:</strong> {com.gst_no || "N/A"}
                  </p>
                  <p className="max-w-[300px] truncate">
                    <strong>Description:</strong> {com.description || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="hidden sm:block mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-left">
              {/* TABLE HEADER */}
              <thead>
                <tr className="bg-gray-100/80 text-gray-700 text-sm border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-nowrap">Company Code</th>
                  <th className="px-6 py-4 font-semibold text-nowrap">Company Name</th>
                  <th className="px-6 py-4 font-semibold ">Address</th>
                  <th className="px-6 py-4 font-semibold text-center ">PAN</th>
                  <th className="px-6 py-4 font-semibold ">Description</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody className="text-gray-700 text-sm overflow-auto">
                {filteredCompanies?.length === 0 ? (
                  <NoDataFound
                    title="0 Companies Found"
                    subtitle="No companies available to display."
                    colSpan={6}
                  />
                ) : (
                  filteredCompanies.map((com) => (
                    <tr
                      key={com._id}
                      className="border-b border-gray-200 hover:bg-blue-50/50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800 text-nowrap">
                        {com.company_code || "N/A"}
                      </td>

                      {/* COMPANY NAME */}
                      <td className="px-6 py-4 font-medium text-gray-800 text-nowrap">
                        {com.company_name}
                      </td>

                      {/* ADDRESS */}
                      <td className="px-6 py-4 text-gray-600 max-w-[250px] truncate">
                        {com.company_address}
                      </td>

                      {/* GST */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                          {com.gst_no || "N/A"}
                        </span>
                      </td>

                      {/* DESCRIPTION */}
                      <td className="px-6 py-4 text-gray-600 max-w-[250px] truncate">
                        {com.description || "N/A"}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-4">
                          <Eye
                            onClick={() => {
                              setSelectedCompany(com);
                              setViewOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:scale-125 transition cursor-pointer"
                            size={20}
                          />

                          <Edit2
                            onClick={() => {
                              setEditTable(com);
                              setOpenModal(true);
                              setMode("edit");
                            }}
                            className="text-green-600 hover:text-green-700 hover:scale-125 transition cursor-pointer"
                            size={20}
                          />

                          {/* <Trash2
                            onClick={() => handleDelete(com._id)}
                            className="text-red-500 hover:text-red-600 hover:scale-125 transition cursor-pointer"
                            size={20}
                          /> */}
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

      <CompanyDrawer
        openModal={openModal}
        setOpenModal={setOpenModal}
        editTable={editTable}
        viewModal={viewModal}
        mode={mode}
        setMode={setMode}
      />
      <Pagination
        page={page}
        setPage={setPage}
        hasNextpage={filteredCompanies?.length === limit}
      />

      <ViewCompanyDrawer
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        data={selectedCompany}
      />
    </div>
  );
};

export default Company;
