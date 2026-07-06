import { Database } from "lucide-react";

const NoDataFound = ({
  title = "No Data Found",
  subtitle = "There is no data available to display.",
  colSpan = 5,
}) => {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
            <Database className="w-7 h-7 text-gray-400" />
          </div>

          <h3 className="text-lg font-semibold text-gray-800">
            {title}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>
      </td>
    </tr>
  );
};

export default NoDataFound;
