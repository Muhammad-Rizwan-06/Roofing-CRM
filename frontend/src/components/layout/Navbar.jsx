import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { canAccessPath } from "../../config/accessControl";

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [query, setQuery] = useState("");

  const pageTitle = useMemo(() => {
    if (pathname === "/") return "Dashboard";
    if (pathname.startsWith("/leads/pipeline")) return "Opportunities Pipeline";
    if (pathname.startsWith("/leads")) return "Leads";
    if (pathname.startsWith("/projects")) return "Projects";
    if (pathname.startsWith("/customers")) return "Customers";
    if (pathname.startsWith("/operations")) return "Operations";
    if (pathname.startsWith("/finance")) return "Finance";
    if (pathname.startsWith("/inventory")) return "Inventory";
    if (pathname.startsWith("/reports")) return "Reports";
    if (pathname.startsWith("/analytics")) return "Analytics";
    if (pathname.startsWith("/documents")) return "Documents";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Roofing Management System";
  }, [pathname]);

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const goSettings = () => {
    if (!user) return;
    if (!canAccessPath("/settings/company", user.roleName)) {
      alert("You do not have permission to access Settings.");
      return;
    }
    navigate("/settings/company");
  };

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.name || "U").trim().slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40">
      <div className="flex items-center justify-between gap-4 bg-white/90 dark:bg-gray-900/80 backdrop-blur px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        {/* Left title */}
        <div className="min-w-[220px]">
          <p className="text-xs text-gray-500 dark:text-gray-400">Roofing CRM</p>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="hidden md:block flex-1 max-w-2xl">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
                <path
                  d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads, projects, customers..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            onClick={goSettings}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Settings"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M19.4 15a7.97 7.97 0 00.1-1 7.97 7.97 0 00-.1-1l2-1.6-2-3.4-2.4 1a8.1 8.1 0 00-1.7-1l-.4-2.6H10l-.4 2.6a8.1 8.1 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7.97 7.97 0 00-.1 1 7.97 7.97 0 00.1 1l-2 1.6 2 3.4 2.4-1a8.1 8.1 0 001.7 1l.4 2.6h4.6l.4-2.6a8.1 8.1 0 001.7-1l2.4 1 2-3.4-2-1.6z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-4">
                {user?.name || "Guest"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.roleName || ""}
              </p>
            </div>

            <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold shadow">
              {initials}
            </div>

            <button
              onClick={doLogout}
              className="ml-2 px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition text-sm"
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-6 pb-4 bg-white/90 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </form>
      </div>
    </header>
  );
};

export default Navbar;