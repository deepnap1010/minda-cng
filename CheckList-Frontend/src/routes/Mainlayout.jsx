import { useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";

export default function Layout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-gray-50 ">
   
      <Sidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <div className="flex flex-col flex-1 min-w-0">
        <div className="sticky top-0 z-50">
          <Navbar
            isMobileOpen={isMobileOpen}
            onMenuClick={() => setIsMobileOpen(!isMobileOpen)}
          />
        </div>
      
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
