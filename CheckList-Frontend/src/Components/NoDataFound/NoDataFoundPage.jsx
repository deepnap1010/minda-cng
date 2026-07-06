import { Database } from "lucide-react";

const NoDataFoundPage = ({
  title = "No Data Found",
  subtitle = "There is no data available to display.",
}) => {
  return (
    <div className="flex justify-center mt-6">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-sm
                   px-8 py-8 text-center max-w-xl w-full"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 mx-auto">
          <Database className="w-7 h-7 text-slate-400" />
        </div>

        <h3 className="text-xl font-semibold text-slate-800">
          {title}
        </h3>

        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default NoDataFoundPage;
