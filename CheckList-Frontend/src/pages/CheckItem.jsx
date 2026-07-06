import { useState } from "react";
import { Plus, RefreshCw, Search, Eye, Edit2, Trash2 } from "lucide-react";
import AddCheckItemModal from "../components/modal/addModal/AddCheckItemModal";
import { useCheckItem } from "../hooks/useCheckItem";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../Components/Pagination/Pagination";
import Refresh from "../components/Refresh/Refresh";
import ViewCheckItem from "../components/modal/ViewModal/ViewCheckItem";
import NoDataFound from "../components/NoDataFound/NoDataFound";

const CheckItem = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [openCheckItemModal, setOpenCheckItemModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedCheckItem, setSelectedCheckItem] = useState(null);
  const {  value } = useDebounce(search);
  const { getCheckItemData, removeItem, searchQuery } = useCheckItem(
    value,
    page,
    limit
  );
  const [showRefresh, setShowRefresh] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredCheckItem = value
    ? (searchQuery?.data ?? [])
    : getCheckItemData?.data;

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this Item?")) {
      removeItem.mutate(id);
    }
  };

  const handleRefresh = async () => {
    setPage(1);
    setSearch("");
    setShowRefresh(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.all([getCheckItemData.refetch(), minDelay]);
    setShowRefresh(false);
  };

  return (
    <div className="w-full p-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Check Item</h1>
        <p className="text-gray-500 text-sm">Manage Your Check Item</p>
      </div>

      {/* Search + Buttons */}
      <div className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)] rounded-2xl p-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        {/* Search Box */}
        <div className="flex justify-between items-center ">
          <div className="flex items-center gap-3 w-full sm:max-w-[300px] border border-gray-200 rounded-lg px-3 py-2">
            <Search size={20} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search check items..."
              className="w-full outline-none text-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 self-center">
          <div className="flex justify-between items-center ">
            <button
              onClick={() => {
                setModalMode("add");
                setSelectedCheckItem(null);
                setOpenCheckItemModal(true);
              }}
              className="px-5 py-2 cursor-pointer bg-blue-500 text-white rounded-lg w-full justify-center hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus size={18} /> Add New Check Item
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

      {/* Table */}
      <div className="relative min-h-[300px] bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 mt-6 p-5">
        {/* Header: Count + Show Dropdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <h2 className="text-gray-800 text-lg font-semibold">
            {filteredCheckItem?.length} Items Found
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

        {/* Mobile View (Card Layout) */}
        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="grid gap-4 sm:hidden mt-4">
            {filteredCheckItem?.map((cl, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white"
              >
                {/* Header: Name + actions */}
                <div className="flex items-center flex-wrap justify-between gap-3">
                  <span className="bg-blue-500 whitespace-nowrap text-white px-3 py-1 rounded-full text-xs font-medium">
                    {cl.item}
                  </span>

                  {/* ACTIONS */}
                  <div className="flex gap-4">
                    <Eye
                      size={20}
                      className="text-blue-500 cursor-pointer"
                      onClick={() => {
                        setModalMode("view");
                        setSelectedCheckItem(cl);
                        setOpenCheckItemModal(true);
                      }}
                    />

                    <Edit2
                      size={20}
                      className="text-green-600 cursor-pointer"
                      onClick={() => {
                        setModalMode("edit");
                        setSelectedCheckItem(cl);
                        setOpenCheckItemModal(true);
                      }}
                    />

                    {/* <Trash2
                      onClick={() => handleDelete(cl._id)}
                      size={20}
                      className="text-red-500 cursor-pointer"
                    /> */}
                  </div>
                </div>

                {/* More details */}
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Date:</strong>{" "}
                    <span className="">{cl.check_list_method || "N/A"}</span>
                  </p>

                  <p>
                    <strong>Time:</strong> {cl.check_list_time || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="overflow-x-auto hidden sm:block w-full rounded-xl border border-gray-200">
            <table className="w-full  text-left">
              {/* Table Header */}
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700 text-sm ">
                  <th className="px-5 py-3 font-semibold text-nowrap">Check Item</th>
                  <th className="px-5 py-3 font-semibold text-nowrap">Checking Method</th>
                  <th className="px-5 py-3 font-semibold text-nowrap">Check Time</th>
                  <th className="px-5 py-3 font-semibold text-nowrap">Process</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 font-semibold text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="text-gray-700">
                {filteredCheckItem?.length === 0 ? (
                  <NoDataFound
                    title="0 Companies Found"
                    subtitle="No companies available to display."
                    colSpan={6}
                  />
                ) : (
                  filteredCheckItem?.map((cl, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-200 hover:bg-blue-50/40 transition-all duration-200 "
                    >
                      <td className="px-5 py-4 text-nowrap truncate">{cl.item || "N/A"}</td>

                      <td className="px-5 py-4 text-nowrap truncate">
                        {cl.check_list_method || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-nowrap truncate">
                        {cl.check_list_time || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-nowrap truncate">
                        <span className="truncate">{cl.processInfo?.process_name}</span> ({cl.processInfo?.process_no})
                      </td>
                      <td className="px-5 py-4 max-w-[250px] truncate">
                        {cl.description || "N/A"}
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 flex justify-center gap-5">
                        {/* VIEW */}
                        <Eye
                          size={20}
                          className="text-blue-500 hover:text-blue-600 hover:scale-125 cursor-pointer transition transform"
                          onClick={() => {
                            setSelectedItem(cl);
                            setViewOpen(true);
                          }}
                        />

                        {/* EDIT */}
                        <Edit2
                          size={20}
                          className="text-green-500 hover:text-green-700 hover:scale-125 cursor-pointer transition transform"
                          onClick={() => {
                            setModalMode("edit");
                            setSelectedCheckItem(cl);
                            setOpenCheckItemModal(true);
                          }}
                        />

                        {/* DELETE */}
                        {/* <Trash2
                        onClick={() => handleDelete(cl._id)}
                        size={20}
                        className="text-red-500 hover:text-red-600 hover:scale-125 cursor-pointer transition transform"
                      /> */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddCheckItemModal
        open={openCheckItemModal}
        onClose={() => setOpenCheckItemModal(false)}
        mode={modalMode}
        initialData={selectedCheckItem}
      />

      <Pagination
        page={page}
        setPage={setPage}
        hasNextpage={filteredCheckItem?.length === limit}
      />

      <ViewCheckItem
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        data={selectedItem}
      />
    </div>
  );
};

export default CheckItem;
