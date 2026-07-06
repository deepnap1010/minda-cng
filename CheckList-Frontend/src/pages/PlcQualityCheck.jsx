import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
  Loader2,
  Download,
  Trash,
} from "lucide-react";
import { usePlcDataIndividual } from "../hooks/usePlcData";
import { usePlcProduct } from "../hooks/usePlcProduct";
import { toast } from "react-toastify";
// import SearchableSelect from "../Components/SearchableDropDown/SearchableDropdown";
import { useFormik } from "formik";
import { useQualityCheck } from "../hooks/useQualityCheck";
import Refresh from "../components/Refresh/Refresh";
import axios from "axios";
import Pagination from "../Components/Pagination/Pagination";

export default function PlcProducts() {
  const [showRefresh, setShowRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [machineFilter, setMachineFilter] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  
  

  

  const {
    getAllQualityChecks,
    createQualityCheck,
    updateQualityCheck,
    deleteQualityCheck,
  } = useQualityCheck({
    search,
    machine_name: machineFilter || undefined,
    page,
    limit,
  });
  const qcResponse = getAllQualityChecks.data || {};
  const qcList = Array.isArray(qcResponse) ? qcResponse : (qcResponse.data || []);
  const totalQC = qcResponse.total ?? qcList.length;
  const isLoadingQC = getAllQualityChecks.isLoading;
  const isErrorQC = getAllQualityChecks.isError;

  const fetchProductDetails = async () => {
    const inputVal = values.part_no?.trim();

    if (!inputVal) {
      return toast.warn("First enter Part No. or Material Code");
    }
    
    // Refetch PLC data if not available or empty
    if (plcDataList.length === 0 && !getAllPlcData.isLoading) {
      await getAllPlcData.refetch();
    }
    
    // Use plcDataList which is already fetched and more up-to-date
    const dataToSearch = plcDataList.length > 0 ? plcDataList : (getdata?.data || []);
    
    if (dataToSearch.length === 0) {
      toast.warn("No PLC data available. Please refresh and try again.");
      return;
    }
    
    // Search in PLC data - check multiple possible locations
    const foundProduct = dataToSearch.find((item) => {
      // Check in product object (primary location)
      const productPartNo = item.product?.part_no;
      const productMaterialCode = item.product?.material_code;
      
      // Check in parameters (fallback)
      const paramPartNo = item.parameters?.part_no;
      const paramMaterialCode = item.parameters?.material_code;
      
      // Match against input value (case-insensitive)
      const inputLower = inputVal.toLowerCase();
      return (
        productPartNo === inputVal ||
        productMaterialCode === inputVal ||
        paramPartNo === inputVal ||
        paramMaterialCode === inputVal ||
        String(productPartNo || "").toLowerCase() === inputLower ||
        String(productMaterialCode || "").toLowerCase() === inputLower ||
        String(paramPartNo || "").toLowerCase() === inputLower ||
        String(paramMaterialCode || "").toLowerCase() === inputLower
      );
    });
    
    if (foundProduct) {
      setFieldValue("machine_name", foundProduct.device_id || "");
      setFieldValue("material_code", foundProduct.companyname || "");
      setFieldValue("model_code", foundProduct.plantname || "");
      setFieldValue("production_count", foundProduct.production_count || "");

      toast.success("Details fetched successfully");
    } else {
      toast.error("No matching record found");
    }
  };

  const {
    values,
    handleBlur,
    handleChange,
    handleSubmit,
    handleReset,
    setFieldValue,
  } = useFormik({
    initialValues: {
      production_count: "",
      material_code: "",
      model_code: "",
      machine_name: "",
      part_no: "",
      approve_quantity: "",
      reject_quantity: "",
    },
    onSubmit: (val) => {
      const payload = {
        part_number: val.part_no || null,
        company_name: val.material_code || null,
        plant_name: val.model_code || null,
        machine_name: val.machine_name || null,
        approve_quantity: Number(val.approve_quantity) || 0,
        reject_quantity: Number(val.reject_quantity) || 0,
      };
      createQualityCheck.mutate(payload, {
        onSuccess: () => {
          setIsAddOpen(false);
          handleReset();
        },
      });
    },
  });

  const getAllPlcData = usePlcDataIndividual({});
  const plcDataList = getAllPlcData.data || [];

  const {
    getAllPlcProducts,
    createPlcProduct,
    updatePlcProduct,
    deletePlcProduct,
    getdata,
  } = usePlcProduct({
    search,
    machine_name: machineFilter || undefined,
  });

  const getTableData = qcList;

  useEffect(() => {
    setPage(1);
  }, [search, machineFilter]);

  const handleRefresh = async () => {
    setIsSpinning(true);
    setPage(1);
    setShowRefresh(true);
    getAllPlcData.refetch();
    getAllPlcProducts.refetch();
    getAllQualityChecks.refetch();
    setTimeout(() => {
      setIsSpinning(false);
    }, 1000);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.all([
      getAllPlcProducts.refetch(),
      getAllPlcData.refetch(),
      getAllQualityChecks.refetch(),
      minDelay,
    ]);
    setShowRefresh(false);
  };

  const productsList = getAllPlcProducts.data || [];
  const isLoadingProducts = getAllPlcProducts.isLoading;
  const isErrorProducts = getAllPlcProducts.isError;

  const stats = useMemo(() => {
    const approved = qcList.reduce((sum, q) => sum + (Number(q.approve_quantity) || 0), 0);
    const rejected = qcList.reduce((sum, q) => sum + (Number(q.reject_quantity) || 0), 0);
    return {
      total: approved + rejected,
      approved,
      rejected,
    };
  }, [qcList]);

  const handleApprovedQtyChange = async (e) => {
    const approvedValue = Number(e.target.value);
    const totalProductionCount = Number(values.production_count);

    setFieldValue("approve_quantity", approvedValue);

    if (totalProductionCount >= approvedValue) {
      const rejectedValue = totalProductionCount - approvedValue;
      setFieldValue("reject_quantity", rejectedValue);
    } else {
      setFieldValue("reject_quantity", 0);
      toast.warn("Approved Quantity can not exceed total count");
    }
  };

  const machineOptions = useMemo(() => {
    const machines = new Set();
    plcDataList.forEach((item) => {
      if (item.device_id && item.device_id.trim())
        machines.add(item.device_id.trim());
    });
    productsList.forEach((p) => {
      if (p.machine_name && p.machine_name.trim())
        machines.add(p.machine_name.trim());
    });
    return Array.from(machines).sort();
  }, [plcDataList, productsList]);

  const [editForm, setEditForm] = useState({ total_quantity:0, approve_quantity: 0, reject_quantity: 0 });

  const handleEditFormChange = (field, val) => {
    const numericVal = Number(val);

  if (field === "approve_quantity") {
    const totalQuantity = Number(editForm.total_quantity) || 0;

    setEditForm((prev) => ({
      ...prev,
      approve_quantity: numericVal,
      reject_quantity: totalQuantity >= numericVal ? totalQuantity - numericVal : 0,
    }));

    if (numericVal > Number(editForm.total_quantity)) {
      toast.warn("Approved Quantity cannot exceed Total Quantity");
    }
  } 
  else if (field === "reject_quantity") {
    const totalQuantity = Number(editForm.total_quantity) || 0;

    setEditForm((prev) => ({
      ...prev,
      approve_quantity: totalQuantity >= numericVal ? totalQuantity - numericVal : 0,
      reject_quantity: numericVal,
    }));

    if (numericVal > Number(editForm.total_quantity)) {
      toast.warn("Reject Quantity cannot exceed Total Quantity");
    }
  }
  else {
    setEditForm((prev) => ({ ...prev, [field]: val }));
  }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditForm({
  total_quantity:
    (product.approve_quantity ?? 0) +
    (product.reject_quantity ?? 0),
      approve_quantity: (product.approve_quantity )?? 0,
      reject_quantity: (product.reject_quantity )?? 0,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;
    try {
      await updateQualityCheck.mutateAsync({
        id: selectedProduct._id,
        data: {

          total_quantity: Number(editForm.total_quantity) || 0,
          approve_quantity: Number(editForm.approve_quantity) || 0,
          reject_quantity: Number(editForm.reject_quantity) || 0,

        },
      });
      setIsEditOpen(false);
      setSelectedProduct(null);
    } catch (_) { }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteQualityCheck.mutateAsync(selectedProduct._id);
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.log(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return "—";
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const year = d.getUTCFullYear();
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${day} ${months[d.getUTCMonth()]} ${year}`;
    } catch {
      return "—";
    }
  };

  function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return "—";
    // Show the time exactly as UTC (jo PLC se aa raha hai),
    // browser ka local timezone shift ignore karne ke liye UTC getters use kiye hain.
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
}



  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Quality Check
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Add and manage quality checks — part number, approved and rejected quantities.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleReset();
                setIsAddOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
            >
              <Plus size={16} />
              Add Quality Check
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoadingQC}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCcw size={16} className={isSpinning ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {isSpinning && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-8 text-gray-500">
            <Loader2 size={24} className="animate-spin" />
            <span>Refreshing…</span>
          </div>
        )}

        {isLoadingQC && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-8 text-gray-500">
            <Loader2 size={24} className="animate-spin" />
            <span>Loading quality checks…</span>
          </div>
        )}

        {isErrorQC && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getAllQualityChecks.error?.response?.data?.message ||
              "Failed to load quality checks."}
          </div>
        )}

        {!isLoadingQC && !isErrorQC && (
        <>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-600">Total Quantity</p>
            <p className="mt-1 text-2xl font-semibold text-blue-600">
              {stats.total}
            </p>
            <p className="mt-1 text-[11px] text-blue-700">Approved + Rejected</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-600">Approved Quantity</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {stats.approved}
            </p>
            <p className="mt-1 text-[11px] text-emerald-700">Total Approved</p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-600">Rejected Quantity</p>
            <p className="mt-1 text-2xl font-semibold text-rose-600">
              {stats.rejected}
            </p>
            <p className="mt-1 text-[11px] text-rose-700">Total Rejected</p>
          </div>
        </div>

        <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur mt-5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">Search</label>
            <div className="relative">
              <Search
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-64 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Part number, company, plant…"
                type="text"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">Machine</label>
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="h-9 w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Machines</option>
              {machineOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setSearch(""); setMachineFilter(""); setPage(1); }}
            className="h-9 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
          >
            Reset Filters
          </button>
        </section>

        <div className="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Quality Check Details
              </h2>
              <p className="text-xs text-gray-500">
                Part number, company, plant, approved and rejected quantities.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Part Number</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Company</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Plant</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Approved</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Rejected</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Updated At</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {getTableData?.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                  No quality checks found
                </td>
              </tr>
            )}
            {getTableData?.map((row) => (
              <tr key={row._id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-800">
                  {row.part_number || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-700">
                  {row.company_name || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-700">
                  {row.plant_name || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs font-semibold text-gray-900">
                  {(row.approve_quantity ?? 0) + (row.reject_quantity ?? 0) || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-emerald-600 font-medium">
                  {row.approve_quantity ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-rose-600 font-medium">
                  {row.reject_quantity ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-700">
                  {formatDateTime(row.created_at || row.checked_at || row.updated_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-700">
                  {formatDateTime(row.updated_at || row.checked_at || row.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <button
                    onClick={() => handleEdit(row)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                    title="Edit Approve/Reject Quantity"
                  >
                    <Pencil size={16} />
                    <span className="text-xs">Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </div>

        <Pagination
          page={page}
          setPage={setPage}
          hasNextpage={page * limit < totalQC}
        />
        </>
        )}
      </div>

      {/* Add Quality Check modal */}
      {isAddOpen && (
        <form
          onSubmit={handleSubmit}
          className="fixed inset-0 z-50 flex justify-end"
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              setIsAddOpen(false);
              handleReset();
            }}
            aria-hidden="true"
          />
          <div className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Add Quality Check
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter product and machine details
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  handleReset();
                }}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="flex flex-col">
                <label className="block text-[15px] font-medium text-gray-700 mb-1">
                  Enter Part No. / Material Code
                </label>
                <input
                  name="part_no"
                  value={values.part_no}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter part number or material code..."
                />
                <button
                  className="bg-blue-600 hover:bg-blue-700 mt-5 py-2 px-4 text-white border rounded border-gray-300 cursor-pointer w-[45%] self-end"
                  onClick={fetchProductDetails}
                  type="button"
                >
                  Get Product Details
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Production Count
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 outline-none"
                  type="number"
                  name="production_count"
                  readOnly
                  value={values.production_count}
                  placeholder="Waiting..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="material_code"
                    value={values.material_code}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 focus:outline-none"
                    placeholder="Waiting..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Plant Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600  focus:outline-none"
                    name="model_code"
                    value={values.model_code}
                    readOnly
                    placeholder="Waiting..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Machine Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600  focus:outline-none"
                  name="machine_name"
                  value={values.machine_name}
                  readOnly
                  placeholder="Waiting..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Approve Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="approve_quantity"
                    value={values.approve_quantity}
                    onChange={handleApprovedQtyChange}
                    onBlur={handleBlur}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter approve quantity"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reject Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="reject_quantity"
                    value={values.reject_quantity}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter reject quantity"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  handleReset();
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createQualityCheck.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {createQualityCheck.isPending && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Save Quality Check
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Edit Product - Approve/Reject Quantity Modal */}
      {isEditOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              setIsEditOpen(false);
              setSelectedProduct(null);
            }}
            aria-hidden="true"
          />
          <div className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Approve & Reject Quantity
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedProduct.part_number ||
                    selectedProduct.product_name ||
                    "Quality Check"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedProduct(null);
                }}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  disabled
                  value={editForm.total_quantity}
                  className="w-full rounded-lg border  border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 "
                  placeholder="Enter approve quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approve Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.approve_quantity}
                  onChange={(e) =>
                    handleEditFormChange("approve_quantity", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter approve quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reject Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.reject_quantity}
                  onChange={(e) =>
                    handleEditFormChange("reject_quantity", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter reject quantity"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedProduct(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={updateQualityCheck.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {updateQualityCheck.isPending && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {isDeleteOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              setIsDeleteOpen(false);
              setSelectedProduct(null);
            }}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Quality Check?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this quality check? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedProduct(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteQualityCheck.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {deleteQualityCheck.isPending && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


