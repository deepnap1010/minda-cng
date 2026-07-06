import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search, Eye, Edit2, Trash2, RotateCcw, History, X, AlertTriangle } from "lucide-react";
import axiosHandler from "../config/axiosconfig";
import AddEmployeeModal from "../components/modal/addModal/AddEmployeeModal";
import { RegisterEmployee } from "../hooks/useRegisterEmployee";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../Components/Pagination/Pagination";
import Refresh from "../components/Refresh/Refresh";
import ViewEmployeeModal from "../components/modal/ViewModal/ViewEmployee";
import NoDataFound from "../components/NoDataFound/NoDataFound";

const Employee = () => {
  const [hodvales, setHodValues] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [limit, setLimit] = useState(10);
  const [modalMode, setModalMode] = useState("add");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const { value } = useDebounce(search);
  const [viewOpen, setViewOpen] = useState(false);
  const searchValue = search ? value : "";

  // recycle-bin + history state
  const [activeTab, setActiveTab] = useState("active"); // "active" | "bin"
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [historyEmp, setHistoryEmp] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const {
    getAllEmployee,
    searchEmployee,
    toggleTerminateEmployee,
    getBinnedEmployees,
    binEmployee,
    restoreEmployee,
    deleteEmployeePermanent,
  } = RegisterEmployee(
      hodvales,
      selectedCompany,
      selectedPlant,
      searchValue,
      page,
      limit,
    );

  const hasfilter = hodvales || selectedPlant || selectedCompany || search;

  const filteredEmployees = useMemo(
    () =>
      hasfilter ? (searchEmployee?.data ?? []) : (getAllEmployee?.data ?? []),
    [hasfilter, searchEmployee?.data, getAllEmployee?.data],
  );

  const binnedEmployees = getBinnedEmployees?.data ?? [];
  const rows = activeTab === "bin" ? binnedEmployees : filteredEmployees;

  const [showRefresh, setShowRefresh] = useState(false);

  const handleRefresh = async () => {
    setPage(1);
    setSearch("");
    setShowRefresh(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.all([getAllEmployee.refetch(), minDelay]);
    setShowRefresh(false);
  };

  const handleTerminateToggle = (emp) => {
    toggleTerminateEmployee.mutate(
      {
        id: emp._id,
        terminate: !emp.terminate,
      },
      {
        onSuccess: () => {
          console.log(
            `Employee ${emp.full_name} terminate = ${!emp.terminate}`,
          );
        },
      },
    );
  };

  const handleSendToBin = (emp) => binEmployee.mutate(emp._id);
  const handleRestore = (emp) => restoreEmployee.mutate(emp._id);
  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteEmployeePermanent.mutate(confirmDelete._id, {
      onSettled: () => setConfirmDelete(null),
    });
  };

  const openHistory = async (emp) => {
    setHistoryEmp(emp);
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      const res = await axiosHandler.get(`/users/employee-history/${emp._id}`);
      setHistoryData(res?.data?.data ?? []);
    } catch (e) {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fmtDateTime = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
  };
  const actionLabel = {
    created: "Created",
    updated: "Updated",
    binned: "Moved to bin",
    restored: "Restored",
    deleted: "Permanently deleted",
  };
  const actionColor = {
    created: "bg-blue-100 text-blue-700",
    updated: "bg-amber-100 text-amber-700",
    binned: "bg-orange-100 text-orange-700",
    restored: "bg-emerald-100 text-emerald-700",
    deleted: "bg-red-100 text-red-700",
  };

  const plantOptions = [
    ...new Map(
      (getAllEmployee?.data || [])
        .map((emp) => emp?.plant)
        .filter(Boolean)
        .map((plant) => [plant._id, plant]),
    ).values(),
  ];

  const companyOptions = [
    ...new Map(
      (getAllEmployee?.data || [])
        .map((emp) => emp?.company)
        .filter(Boolean)
        .map((company) => [company._id, company]),
    ).values(),
  ];

  useEffect(() => {
    setPage(1);
  }, [search, selectedCompany, selectedPlant]);
  return (
    <div className="w-full p-4 relative">
      {/* HEADER */}
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold">Employees</h1>
        <p className="text-gray-500 text-sm">Manage Employees</p>
      </div>

      {/* Search + Buttons */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left side: Search + Filters */}
          <div className="flex flex-col gap-3 w-full">
            {/* Search */}
            <div className="flex items-center gap-3 w-full sm:max-w-[300px] border border-gray-200 rounded-lg px-3 py-2">
              <Search size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full outline-none text-gray-700"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Company Filter */}
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 w-full sm:w-auto
                     focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">All Companies</option>
                {companyOptions.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.company_name}
                  </option>
                ))}
              </select>

              {/* Plant Filter */}
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 w-full sm:w-[220px]
                     whitespace-nowrap overflow-hidden text-ellipsis
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Plants</option>
                {plantOptions.map((plant, i) => (
                  <option key={i} value={plant?._id}>
                    {plant?.plant_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right side: Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Add Employee */}
            <button
              onClick={() => {
                setModalMode("add");
                setSelectedEmployee(null);
                setModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 h-[44px] px-5
                   bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition
                   w-full sm:w-auto"
            >
              <Plus size={18} />
              <span className="whitespace-nowrap">Add New Employee</span>
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 h-[44px] px-4
                   border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition
                   w-full "
            >
              <RefreshCw size={18} />
              <span >Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative min-h-[300px] bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 mt-6 p-5">
        {/* Header: Tabs + Count + Show Dropdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Active | Bin tabs */}
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                onClick={() => setActiveTab("active")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  activeTab === "active"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab("bin")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition inline-flex items-center gap-1.5 ${
                  activeTab === "bin"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Trash2 size={14} />
                Bin{binnedEmployees.length ? ` (${binnedEmployees.length})` : ""}
              </button>
            </div>
            <h2 className="text-gray-800 text-lg font-semibold">
              {rows.length} {activeTab === "bin" ? "in Bin" : "Employees Found"}
            </h2>
          </div>

          {activeTab === "active" && (
            <div className="flex items-center gap-4 text-gray-600">
              <h1>Hod</h1>
              <input
                type="checkbox"
                onChange={(e) => setHodValues(e.target.checked)}
              />
              <span>Show:</span>
              <select
                className="border border-gray-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-0 "
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
          )}
        </div>

        {/* Mobile View (Card Layout) */}
        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="grid gap-4 sm:hidden mt-4">
            {rows.map((emp, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white"
              >
                {/* Header: Name + actions */}
                <div className="flex items-center flex-wrap justify-between gap-3">
                  <span className="bg-blue-500 whitespace-nowrap text-white px-3 py-1 rounded-full text-xs font-medium">
                    {emp.user_id || "N/A"}
                  </span>

                  {/* ACTIONS */}
                  <div className="flex gap-4 items-center">
                    {activeTab === "active" ? (
                      <>
                        <Eye
                          size={20}
                          className="text-blue-500 cursor-pointer"
                          onClick={() => {
                            setModalMode("view");
                            setSelectedEmployee(emp);
                            setModalOpen(true);
                          }}
                        />

                        <Edit2
                          size={20}
                          className="text-green-500 cursor-pointer"
                          onClick={() => {
                            setModalMode("edit");
                            setSelectedEmployee(emp);
                            setModalOpen(true);
                          }}
                        />

                        <Trash2
                          size={20}
                          className="text-red-500 cursor-pointer"
                          title="Send to bin"
                          onClick={() => handleSendToBin(emp)}
                        />

                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!emp.terminate}
                            onChange={() => handleTerminateToggle(emp)}
                            className="sr-only peer"
                          />
                          <div className="relative w-9 h-5 bg-red-500 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </>
                    ) : (
                      <>
                        <RotateCcw
                          size={20}
                          className="text-emerald-600 cursor-pointer"
                          title="Restore"
                          onClick={() => handleRestore(emp)}
                        />
                        <History
                          size={20}
                          className="text-blue-500 cursor-pointer"
                          title="History"
                          onClick={() => openHistory(emp)}
                        />
                        <Trash2
                          size={20}
                          className="text-red-600 cursor-pointer"
                          title="Delete permanently"
                          onClick={() => setConfirmDelete(emp)}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Name:</strong> {emp.full_name || "N/A"}
                  </p>

                  <p>
                    <strong>Plant:</strong>{" "}
                    <span className="">
                      
                      {emp?.plant?.plant_name || "N/A"}
                    </span>
                  </p>

                  <p>
                    <strong>Company:</strong>{" "}
                    {emp?.company?.company_name || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop Table */}
        {showRefresh ? (
          <Refresh />
        ) : (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                    Code
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                    Plant
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                    Company
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-5 py-3 text-center text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="text-gray-700">
                {rows?.length === 0 ? (
                  <NoDataFound
                    title={activeTab === "bin" ? "Bin is empty" : "0 Employees Found"}
                    subtitle={activeTab === "bin" ? "No employees in the recycle bin." : "No assembly line data available."}
                    colSpan={7}
                  />
                ) : (
                  rows.map((emp, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-200 transition ${
                        emp.terminate
                          ? "opacity-50 bg-gray-50"
                          : "hover:bg-blue-50/40"
                      }`}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        {emp.user_id || "N/A"}
                      </td>
                      <td className="px-5 py-4">{emp.full_name || "N/A"}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow text-nowrap">
                          {emp?.plant?.plant_name || "N/A"} (
                          {emp?.plant?.plant_code})
                        </span>
                      </td>

                      <td className="px-5 py-4 text-nowrap">
                        {emp?.company?.company_name || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-nowrap">
                        {emp?.email || "N/A"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 flex justify-center gap-5">
                        {activeTab === "active" ? (
                          <>
                            {/* VIEW */}
                            <Eye
                              size={20}
                              className="text-blue-500 hover:text-blue-600 hover:scale-125 cursor-pointer transition transform"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setViewOpen(true);
                              }}
                            />

                            {/* EDIT */}
                            <Edit2
                              size={20}
                              className="text-green-500 hover:text-green-700 hover:scale-125 cursor-pointer transition transform"
                              onClick={() => {
                                setModalMode("edit");
                                setSelectedEmployee(emp);
                                setModalOpen(true);
                              }}
                            />

                            {/* SEND TO BIN */}
                            <Trash2
                              size={20}
                              className="text-red-500 hover:text-red-700 hover:scale-125 cursor-pointer transition transform"
                              title="Send to bin"
                              onClick={() => handleSendToBin(emp)}
                            />

                            {/* TERMINATE TOGGLE */}
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!emp.terminate}
                                onChange={() => handleTerminateToggle(emp)}
                                className="sr-only peer"
                              />
                              <div
                                className="relative w-9 h-5 bg-red-500 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                    after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                              ></div>
                            </label>
                          </>
                        ) : (
                          <>
                            {/* RESTORE */}
                            <RotateCcw
                              size={20}
                              className="text-emerald-600 hover:text-emerald-800 hover:scale-125 cursor-pointer transition transform"
                              title="Restore"
                              onClick={() => handleRestore(emp)}
                            />
                            {/* HISTORY */}
                            <History
                              size={20}
                              className="text-blue-500 hover:text-blue-700 hover:scale-125 cursor-pointer transition transform"
                              title="View history"
                              onClick={() => openHistory(emp)}
                            />
                            {/* DELETE PERMANENTLY */}
                            <Trash2
                              size={20}
                              className="text-red-600 hover:text-red-800 hover:scale-125 cursor-pointer transition transform"
                              title="Delete permanently"
                              onClick={() => setConfirmDelete(emp)}
                            />
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddEmployeeModal
        open={modalOpen}
        mode={modalMode}
        initialData={selectedEmployee}
        onClose={() => {
          setModalOpen(false);
          setSelectedEmployee(null);
        }}
      />
      {activeTab === "active" && (
        <Pagination
          page={page}
          setPage={setPage}
          hasNextpage={filteredEmployees?.length === limit}
        />
      )}

      <ViewEmployeeModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        data={selectedEmployee}
      />

      {/* Confirm permanent delete */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete permanently?
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">
                    {confirmDelete.full_name || confirmDelete.user_id}
                  </span>{" "}
                  will be permanently deleted. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteEmployeePermanent.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteEmployeePermanent.isPending ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee history (audit log) */}
      {historyEmp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setHistoryEmp(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">History</h3>
                <p className="text-sm text-gray-500">
                  {historyEmp.full_name || historyEmp.user_id}
                </p>
              </div>
              <button
                onClick={() => setHistoryEmp(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto">
              {historyLoading ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  Loading history...
                </p>
              ) : historyData.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  No history found.
                </p>
              ) : (
                <ol className="relative border-l border-gray-200 ml-2">
                  {historyData.map((h) => (
                    <li key={h._id} className="mb-5 ml-4">
                      <div className="absolute w-3 h-3 bg-gray-300 rounded-full -left-1.5 mt-1.5"></div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            actionColor[h.action] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {actionLabel[h.action] || h.action}
                        </span>
                        <span className="text-xs text-gray-400">
                          {fmtDateTime(h.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        by {h.performed_by || "system"}
                        {(() => {
                          if (!h.details) return null;
                          try {
                            const d =
                              typeof h.details === "string"
                                ? JSON.parse(h.details)
                                : h.details;
                            if (d?.fields?.length)
                              return (
                                <span className="text-gray-400">
                                  {" "}
                                  — changed: {d.fields.join(", ")}
                                </span>
                              );
                            return null;
                          } catch {
                            return null;
                          }
                        })()}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;