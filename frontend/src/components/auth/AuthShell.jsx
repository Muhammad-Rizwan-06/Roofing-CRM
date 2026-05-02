import React from "react";

const AuthShell = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-blue-600">Roofing CRM</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Roofing Management System
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              {subtitle}
            </p>
          </div>

          {children}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Roofing ERP
        </p>
      </div>
    </div>
  );
};

export default AuthShell;