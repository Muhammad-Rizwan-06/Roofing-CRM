import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import MaintenanceScheduler from "../maintenance/MaintenanceScheduler";

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        {/* ✅ runs quietly in background */}
        <MaintenanceScheduler />

        <main className="p-6 flex-1 overflow-y-auto text-gray-800 dark:text-gray-200 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;