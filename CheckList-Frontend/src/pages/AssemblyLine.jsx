import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, RefreshCw, Edit2, Trash2, Eye } from "lucide-react";

import { useAssemblyLine } from "../hooks/useAssemblyLine";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../Components/Pagination/Pagination";
import Refresh from "../components/Refresh/Refresh";
import ViewAssemblyLine from "../components/modal/ViewModal/ViewAssemblyLine";
import NoDataFound from "../components/NoDataFound/NoDataFound";
import AssemblyLineModal from "../Components/modal/addModal/AddNewAssembly";

export default function AssemblyLine() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editTable, setEditTable] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedResponsible, setSelectedResponsible] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("");
  const [limit, setLimit] = useState(10);
  const [mode, setMode] = useState("add");
  const { value } = useDebounce(search);
  const searchValue = search ? value : "";
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { getAssemblyLineData, searchQuery, DeleteAssemblyLine } = useAssemblyLine(selectedCompany, selectedPlant, selectedProcess, selectedResponsible, searchValue, page, limit);

  const hasfilter = selectedPlant || selectedCompany || search || selectedProcess || selectedResponsible;

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const data = useMemo(() =>
    hasfilter ? searchQuery?.data ?? [] : getAssemblyLineData?.data ?? [],
    [hasfilter, searchQuery?.data, getAssemblyLineData?.data]
  );

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this Assembly Line?")) {
      DeleteAssemblyLine.mutate(id);
    }
  };


  const [showRefresh, setShowRefresh] = useState(false);
  const handleRefresh = async () => {
    setPage(1);
    setSearch("");
    setShowRefresh(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.all([getAssemblyLineData.refetch(), minDelay]);
    setShowRefresh(false);
  };

  const openModalHandler = (mode, item = null) => {
    setMode(mode);
    setEditTable(item);
    setViewModal(mode === "view" ? item : null);
    setOpenModal(true);
  };
  const plantOptions = [
    ...new Map(
      (getAssemblyLineData?.data || [])
        .map((assem) => assem?.plant)
        .filter(Boolean)
        .map(plant => [plant._id, plant])
    ).values(),
  ];

  const companyOptions = [
    ...new Map(
      (getAssemblyLineData?.data || [])
        .map((assem) => assem?.company)
        .filter(Boolean)
        .map((company) => [company?._id, company])
    ).values(),
  ];

  const responsibleOptions = [
    ...new Map(
      (getAssemblyLineData?.data || [])
        .map((assem) => assem?.responsibleUser)
        .filter(Boolean)
        .map((responsibility) => [responsibility?._id, responsibility])
    ).values(),
  ];


  const processOptions = [
    ...new Map(
      (getAssemblyLineData?.data || [])
        .map((assem) => assem?.processes)
        .filter(Boolean)
        .flatMap((process) => process)
        .map((p) => [p?._id, p])
    ).values(),
  ];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, selectedCompany, selectedPlant, selectedProcess]);

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Assembly Line</h1>
          <p className="text-gray-500 text-sm">
            Manage all assembly lines efficiently
          </p>
        </div>
      </div>

      {/* Search and Buttons */}
      <div className="bg-white shadow-sm rounded-2xl p-4 mt-4 flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:max-w-[300px] border border-gray-300 rounded-lg px-3 py-2">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search assembly line..."
            className="w-full outline-none text-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full flex-wrap sm:w-auto">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 w-full sm:w-auto focus:outline-none   transition"
          >
            <option value="">All Companies</option>
            {companyOptions.map((company) => (
              <option key={company._id} value={company._id}>
                {company.company_name}
              </option>
            ))}
          </select>
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 w-full sm:w-auto focus:outline-none  transition"
          >
            <option value="">All Plants</option>
            {plantOptions.map((plant, i) => (
              <option key={i} value={plant?._id}>
                {plant?.plant_name}
              </option>
            ))}
          </select>
          <select
            value={selectedResponsible}
            onChange={(e) => setSelectedResponsible(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 w-full sm:w-auto focus:outline-none  transition"
          >
            <option value="">All Responsible</option>
            {responsibleOptions.map((responsible) => (
              <option key={responsible?._id} value={responsible?._id}>
                {responsible.full_name}
              </option>
            ))}
          </select>
          {/* Process Filter */}
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 w-full sm:w-auto focus:outline-none  transition"
          >
            <option value="">All Processes</option>
            {processOptions.map((process) => (
              <option key={process._id} value={process._id}>
                {process.process_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 ">
          <button
            onClick={() => openModalHandler("add")}
            className="bg-blue-500 text-white px-4 py-2 w-full sm:w-auto rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600"
          >
            <Plus size={18} /> Add New Assembly
          </button>

          <button
            onClick={handleRefresh}
            className="border border-gray-300 w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 text-gray-700"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative min-h-[300px] bg-white rounded-2xl shadow-md border border-gray-100 mt-6 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <h2 className="font-semibold text-gray-800 text-lg">
            {data?.length} Records Found
          </h2>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-sm font-medium">Show:</span>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 hover:border-gray-400 cursor-pointer transition focus:outline-none focus:ring-0"
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
            {data?.map((asl) => (
              <div
                key={asl._id}
                className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
              >
                <div className="flex gap-2 flex-wrap justify-between items-center">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
                    {`${asl.assembly_name} / ${asl.assembly_number}`}
                  </span>

                  <div className="flex gap-4 justify-center">
                    <Eye
                      onClick={() => {
                        setSelectedItem(asl);
                        setViewOpen(true);
                      }}
                      size={18}
                      className="text-blue-500 cursor-pointer"
                    />
                    <Edit2
                      onClick={() => openModalHandler("edit", asl)}
                      size={18}
                      className="text-green-600 cursor-pointer"
                    />
                    {/* <Trash2
                      onClick={() => handleDelete(asl._id)}
                      size={18}
                      className="text-red-500 cursor-pointer"
                    /> */}
                  </div>
                </div>

                <div className="mt-3 text-sm flex flex-col text-gray-600 space-y-1">
                  <p className="max-w-[300px] truncate">
                    <strong>Company:</strong> {asl?.company_id?.company_name}
                  </p>
                  <p>
                    <strong>Plant:</strong> {asl?.plant_id?.plant_name}
                  </p>
                  <p className="max-w-[300px] truncate">
                    <strong>Process Count:</strong> {asl?.process_id?.length}
                  </p>
                  <button
                    onClick={() => openModalHandler("assign", asl)}
                    className="px-3 py-1 bg-blue-600 text-white text-[13px] font-semibold rounded-lg shadow hover:bg-blue-700 transition max-w-16 self-end"
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm">
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Assembly Line No.
                  </th>
                  <th className="px-5 py-3 font-semibold text-nowrap">
                    Assembly Line Name
                  </th>
                  <th className="px-5 py-3 font-semibold">Processes</th>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Plant</th>
                  <th className="px-5 py-3 font-semibold">Responsible</th>
                  <th className="px-5 py-3 font-semibold text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700 ">
                {data?.length === 0 ? (
                  <NoDataFound
                    title="0 Assembly Lines Found"
                    subtitle="No assembly line data available."
                    colSpan={7}
                  />
                ) : (
                  data?.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b  border-gray-200 hover:bg-blue-50/40 transition"
                    >
                      <td className="px-5 py-4 text-sm text-nowrap">
                        {item?.assembly_number}
                      </td>
                      <td className="px-5 py-4 text-sm ">
                        <span className="inline-flex items-center justify-center bg-blue-500 px-3 py-1 rounded-full text-nowrap text-white text-nowrap">
                          {item?.assembly_name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-nowrap">
                        {item?.processes?.length || 0} Processes
                      </td>

                      <td className="px-5 py-4 text-sm text-nowrap">
                        {item?.company?.company_name}
                      </td>
                      <td className="px-5 py-4 text-sm text-nowrap">
                        {item?.plant?.plant_name} ({item?.plant?.plant_code})
                      </td>
                      <td className="px-5 py-4 text-sm text-nowrap">
                        {item?.responsibleUser?.full_name}
                        {item?.responsibleUser?.user_id && (
                          <> ({item?.responsibleUser?.user_id})</>
                        )}
                      </td>

                      <td className="px-5 py-4 flex flex-col gap-3 h- justify-center ">
                        <div className="flex gap-4 justify-center">
                          <Eye
                            onClick={() => {
                              setSelectedItem(item);
                              setViewOpen(true);
                            }}
                            size={18}
                            className="text-blue-500 cursor-pointer"
                          />
                          <Edit2
                            onClick={() => openModalHandler("edit", item)}
                            size={18}
                            className="text-green-600 cursor-pointer"
                          />
                          {/* <Trash2
                            onClick={() => handleDelete(item._id)}
                            size={18}
                            className="text-red-500 cursor-pointer"
                          /> */}
                        </div>
                        <button
                          onClick={() => openModalHandler("assign", item)}
                          className="px-3 py-1 bg-blue-600 text-white text-[13px] font-semibold rounded-lg shadow hover:bg-blue-700 transition"
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssemblyLineModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        editTable={editTable}
        viewModal={viewModal}
        mode={mode}
      />
      <Pagination
        page={page}
        setPage={setPage}
        hasNextpage={data?.length === limit}
      />
      <ViewAssemblyLine
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        data={selectedItem}
      />
    </div>
  );
}