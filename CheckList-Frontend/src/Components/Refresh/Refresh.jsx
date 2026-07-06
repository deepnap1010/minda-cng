import React from 'react';
import { RefreshCw } from "lucide-react";

const Refresh = () => {
  return (
    <div className="absolute inset-0 z-10 gap-4 p-16 flex items-center justify-center   rounded-2xl">
      <RefreshCw size={34} className="text-blue-600 animate-spin" />
      <p className="text-gray-400">Loading...</p>
    </div>
  )
}

export default Refresh;