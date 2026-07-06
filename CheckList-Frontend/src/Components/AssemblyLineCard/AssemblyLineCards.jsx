import React from "react";
import { Clock, CheckCircle2, AlertCircle, X } from "lucide-react";
import { motion } from "framer-motion";

const AssemblyLineCards = ({ AssemblyLines = [], setOpenView }) => {
  const getStatusClass = (isError) =>
    isError
      ? "bg-red-50 text-red-600 border-red-200"
      : "bg-emerald-50 text-emerald-600 border-emerald-200";

  return (
    <>
      {AssemblyLines.map((asl) => (
        <motion.div
          key={asl._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="px-6 py-6 bg-blue-500 rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {asl.assembly_name}
                <span className="ml-3 text-lg text-blue-100">({asl.assembly_number})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {asl.process_id?.map((proc) => (
                  <span
                    key={proc._id}
                    className="px-3 py-1.5 bg-white/20 backdrop-blur border border-white/40 rounded-xl text-sm font-semibold text-white"
                  >
                    {proc.process_name}
                  </span>
                ))}
              </div>
            </div>
           <div>
              <button className="absolute right-4 top-4 text-gray-100 hover:text-gray-400" onClick={() => setOpenView(false)}>
                     <X size={25} />
                   </button>
           </div>

          </div>

          {/* Info Cards */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <InfoCard title="Company" content={asl.company?.company_name || "—"} />
            <InfoCard title="Plant" content={asl.plant?.plant_name || "—"} />
            <InfoCard 
              title="Responsible" 
              content={asl.responsibleUser?.full_name || "—"} 
              subtitle={`(${asl.responsibleUser?.user_id || "—"})`}
            />
          </div>

          {/* Checklist */}
          <div className="px-6 pb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6 pl-4 border-l-4 border-blue-500">Checklist Items</h3>
            {asl.processes?.map((proc, i) => (
              <div key={proc._id} className="mb-6">
                <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border-l-4 border-blue-500 mb-4">
                  <h4 className="text-lg font-bold text-slate-900">
                    {i + 1}. {proc.process_name}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proc.check_list_items?.map((check, idx) => (
                    <ChecklistItem
                      key={check._id}
                      index={idx}
                      check={check}
                      getStatusClass={getStatusClass}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </>
  );
};

const InfoCard = ({ title, content, subtitle }) => (
  <div className="bg-white/60 backdrop-blur border border-white/50 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200">
    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{title}</p>
    <p className="text-xl font-bold text-slate-900 mb-1 hover:text-blue-600 transition-colors">{content}</p>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

const ChecklistItem = ({ index, check, getStatusClass }) => {
  const latestHistory = check.check_items_history?.[0];
  const hasError = latestHistory?.is_error;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
      {/* Top Header with Icon */}   
      <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl border-3 ${getStatusClass(hasError)} shadow-sm`}>
            {hasError ? (
              <AlertCircle size={20} className="text-red-600" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-lg font-bold text-slate-900 truncate">{index + 1}. {check.item}</h5>
            <p className="text-xs text-slate-600">Method: {check.check_list_method}</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{check.check_list_time}</span>
          </div>
        </div>
      </div>

      {/* Limits */}
      {(check.min !== undefined || check.max !== undefined || check.uom) && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex flex-wrap gap-3 text-xs text-slate-700">
            {check.min !== undefined && <span><strong>Min:</strong> {check.min}</span>}
            {check.max !== undefined && <span><strong>Max:</strong> {check.max}</span>}
            {check.uom && <span><strong>UOM:</strong> {check.uom}</span>}
          </div>
        </div>
      )}

      {/* History */}
      {check.check_items_history?.length > 0 ? (
        <div className="space-y-2">
          {check.check_items_history.slice(0, 2).map((hist) => (
            <div key={hist._id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border-l-3 border-emerald-400">
              <p className="text-xs font-medium text-slate-900 truncate flex-1">{hist.description || "No description"}</p>
              <div className={`flex items-center gap-1 p-1.5 rounded-lg ${getStatusClass(hist.is_error)} text-xs font-bold`}>
                {hist.is_error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                <span>{hist.is_error ? "Error" : "OK"}</span>
              </div>
            </div>
          ))}
          {check.check_items_history.length > 2 && (
            <p className="text-xs text-slate-500 text-center">+{check.check_items_history.length - 2} more</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <div className="text-center">
            <AlertCircle size={32} className="mx-auto mb-1 text-slate-400" />
            <p className="text-xs text-slate-400">No checks yet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblyLineCards;
