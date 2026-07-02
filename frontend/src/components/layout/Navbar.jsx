import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import { canAccessPath } from "../../config/accessControl";

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") || "";

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set("search", val);
    else newParams.delete("search");
    setSearchParams(newParams, { replace: true });
  };

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
    if (pathname.startsWith("/maintenance")) return "Maintenance";
    return "Builtrly Management System";
  }, [pathname]);

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.name || "U").trim().slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40">
      <div className="flex items-center justify-between gap-4 bg-white/90 dark:bg-gray-900/80 backdrop-blur px-6 py-4 border-b border-gray-200 dark:border-gray-800">

        {/* Left — page title */}
        <div className="min-w-40">
          <p className="text-xs text-gray-500 dark:text-gray-400">Builtrly CRM</p>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Center — search */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="hidden md:block flex-1 max-w-2xl"
        >
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
              onChange={handleSearchChange}
              placeholder="Search leads, projects, customers..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </form>

        {/* Right — actions */}
        <div className="flex items-center gap-2">

          {/* Notifications */}
          <button
            className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition"
            title="Notifications"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              type="button"
            >
              {/* Name + role */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-4">
                  {user?.name || "Guest"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.roleName || ""}
                </p>
              </div>

              {/* Avatar */}
              <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold shadow select-none">
                {initials}
              </div>

              {/* Chevron */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className={`text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Dropdown panel */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden z-50">

                {/* User info header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {user?.name || "Guest"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || ""}
                  </p>
                  <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                    {user?.roleName || ""}
                  </span>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  {canAccessPath("/settings/company", user?.roleName) && (
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings/company"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      type="button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400 shrink-0">
                        <path d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" stroke="currentColor" strokeWidth="2" />
                        <path d="M19.4 15a7.97 7.97 0 00.1-1 7.97 7.97 0 00-.1-1l2-1.6-2-3.4-2.4 1a8.1 8.1 0 00-1.7-1l-.4-2.6H10l-.4 2.6a8.1 8.1 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7.97 7.97 0 00-.1 1 7.97 7.97 0 00.1 1l-2 1.6 2 3.4 2.4-1a8.1 8.1 0 001.7 1l.4 2.6h4.6l.4-2.6a8.1 8.1 0 001.7-1l2.4 1 2-3.4-2-1.6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      </svg>
                      Company Settings
                    </button>
                  )}

                  {canAccessPath("/settings/users", user?.roleName) && (
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings/users"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      type="button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400 shrink-0">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      User Management
                    </button>
                  )}

                  {/* Theme toggle */}
                  <button
                    onClick={() => { setProfileOpen(false); setDarkMode(!darkMode); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    type="button"
                  >
                    {darkMode ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400 shrink-0">
                        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400 shrink-0">
                        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                  <button
                    onClick={() => { setProfileOpen(false); doLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-500 shrink-0">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Logout
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-6 pb-4 bg-white/90 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <form onSubmit={(e) => e.preventDefault()}>
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
              onChange={handleSearchChange}
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
