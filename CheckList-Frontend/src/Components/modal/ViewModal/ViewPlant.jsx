import { X, Building2, MapPin, Factory } from "lucide-react";

const ViewPlant = ({ open, onClose, data }) => {
  if (!open || !data) return null;



  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
         {/* PANEL */}
         <div className="bg-white h-screen w-full sm:w-[720px] xl:w-[820px] shadow-2xl animate-slideLeft flex flex-col">
           
           {/* HEADER */}
           <div className="px-8 py-6 flex justify-between items-center bg-white sticky top-0 z-10">
             <div>
               <h2 className="text-2xl font-semibold text-gray-900">
                 Plant Details
               </h2>
               <p className="text-sm text-gray-500 mt-1">
                 Read-only plant information
               </p>
             </div>
   
             <button
               onClick={onClose}
               className="p-2 rounded-full hover:bg-gray-100 transition"
             >
               <X size={22} />
             </button>
           </div> 

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          {/* PLANT INFO */}
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold">
              <Factory size={18} />
              Plant Information
            </div>

            <InfoRow label="Plant Name" value={data.plant_name} />
            <InfoRow
              label="Address"
              value={data.plant_address || "N/A"}
            />
          </section>

          {/* COMPANY INFO */}
          <section className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
              <Building2 size={18} />
              Company Information
            </div>

            <InfoRow
              label="Company Name"
              value={data.company?.company_name || "N/A"}
            />
            <InfoRow
              label="Company Address"
              value={data.company?.company_address || "N/A"}
            />
          </section>

          {/* DESCRIPTION */}
          <section className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-3 text-red-700 font-semibold">
              <MapPin size={18} />
              Description
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              {data?.description || "No description provided."}
            </p>
          </section>
          <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <div className="flex items-center gap-2 mb-3 text-cyan-700 font-semibold">
             
              GST
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              {data?.gst || "No gst provided."} 
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-1 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800 text-right max-w-[60%] truncate">
      {value}
    </span>
  </div>
);

export default ViewPlant;
