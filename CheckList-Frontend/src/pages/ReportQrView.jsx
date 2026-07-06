import React from "react";
import { useSearchParams } from "react-router-dom";

// Decode base64 payload (supports Unicode)
const decodePayload = (encoded) => {
  try {
    const decoded = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export default function ReportQrView() {
  const [searchParams] = useSearchParams();
  const d = searchParams.get("d");
  const payload = d ? decodePayload(d) : null;

  if (!payload) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm max-w-md">
          <h1 className="text-lg font-semibold text-gray-800">Invalid or missing QR data</h1>
          <p className="mt-2 text-sm text-gray-500">This link may be expired or incorrect.</p>
        </div>
      </div>
    );
  }

  const formatDate = (val) =>
    val ? new Date(val).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const rows = [
    { label: "Company", value: payload.Company ?? "—" },
    { label: "Plant", value: payload.Plant ?? "—" },
    { label: "Product", value: payload.Product ?? "—" },
    { label: "Model", value: payload.Model ?? "—" },
    { label: "Line-Number", value: payload.LineNumber ?? "—" },
    { label: "Line-Name", value: payload.LineName ?? "—" },
    { label: "Barcode-tag", value: payload.BarcodeTag ?? "—" },
    { label: "Barcode Status", value: payload.BarcodeStatus ?? "—" },
    { label: "Barcode Date & Time", value: formatDate(payload.BarcodeDateTime) },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3">
          <h1 className="text-lg font-semibold text-white">Report QR details</h1>
          <p className="text-indigo-100 text-sm mt-0.5">Barcode Production Report</p>
        </div>
        <dl className="divide-y divide-gray-100 px-4 py-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="py-3 first:pt-2 last:pb-2">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
