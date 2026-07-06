import React, { useState } from "react";
import { Search, Plus, Eye, Edit2, Trash2, Download } from "lucide-react";
import Pagination from "../Components/Pagination/Pagination";
import NoDataFound from "../components/NoDataFound/NoDataFound";
import AddDocumentModal from "../components/TemplateModals/AddModal/ManageDocumentModal";
import ViewDocumentModal from "../components/TemplateModals/ViewModal/ManageDocumentViewModal";
import { useManageDocuments } from "../hooks/Template Hooks/useManageDocuments";
import { useDebounce } from "../hooks/useDebounce";

const ManageDocument = () => {
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const {value} = useDebounce(search);
    const [openDocModal, setOpenDocModal] = useState(false);
    const [mode, setMode] = useState("add");
    const [selectedDoc, setSelectedDoc] = useState(null);
    const { getDocuments } = useManageDocuments(value,page,limit);

    const [openView, setOpenView] = useState(false);
    const filteredDocuments = getDocuments?.data; 

    

    const downloadFile = (fileUrl, fileName) => {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
    //   link.target = "_blank"; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };


    return (
      <div className="p-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Manage Documents
          </h1>
          <p className="text-gray-500 text-sm">
            Manage document records and expiry status
          </p>
        </div>

        {/* Search + Add */}
        <div className="bg-white shadow-sm rounded-2xl p-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:max-w-[300px] border border-gray-300 rounded-lg px-3 py-2">
            <Search size={20} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full outline-none text-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={() => {
              setOpenDocModal(true);
              setSelectedDoc(null);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
          >
            <Plus size={18} /> Add Document
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 mt-6 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
            <h2 className="font-semibold text-gray-800 text-lg">
              {filteredDocuments?.length} Documents Found
            </h2>

            <div className="flex items-center gap-4 text-gray-600">
              <span>Show:</span>
              <select
                className="border border-gray-200 rounded-lg px-2 py-1"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm">
                  <th className="px-5 py-3 font-semibold">Document Name</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Expiry Date</th>
                  <th className="px-5 py-3 font-semibold text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments?.length === 0 ? (
                  <NoDataFound
                    title="0 Documents Found"
                    subtitle="No documents available."
                    colSpan={5}
                  />
                ) : (
                  filteredDocuments?.map((doc) => (
                    <tr key={doc._id} className="hover:bg-blue-50 transition">
                      <td className="px-5 py-4 font-medium text-gray-800">
                        {doc?.doc_name}
                      </td>
                      <td className="px-5 py-4">{doc?.category}</td>
                      <td className="px-5 py-4">
                        {doc?.expiry
                          ? new Date(doc.expiry).toLocaleDateString("en-GB")
                          : "-"}
                      </td>

                      <td className="px-5 py-4 flex justify-center gap-5">
                        {/* VIEW */}
                        <Eye
                          onClick={() => {
                            setSelectedDoc(doc);
                            setOpenView(true);
                          }}
                          className="cursor-pointer text-blue-500"
                        />
                        {/* EDIT */}
                        <Edit2
                          onClick={() => {
                            setMode("edit");
                            setSelectedDoc(doc);
                            setOpenDocModal(true);
                          }}
                          size={20}
                          className="text-green-600 cursor-pointer"
                        />

                        <Download
                          size={20}
                          className={`cursor-pointer ${
                            doc?.attached_doc
                              ? "text-gray-700"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                          onClick={() => {
                            if (!doc?.attached_doc) return;
                           downloadFile(
                             doc.attached_doc,
                             doc.doc_name || "document",
                           );
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          setPage={setPage}
          hasNextpage={filteredDocuments?.length === limit}
        />

        <AddDocumentModal
          openModal={openDocModal}
          setOpenModal={setOpenDocModal}
          editData={selectedDoc}
          mode={mode}
        />

        <ViewDocumentModal
          open={openView}
          onClose={() => setOpenView(false)}
          data={selectedDoc}
        />
      </div>
    );
};

export default ManageDocument;
