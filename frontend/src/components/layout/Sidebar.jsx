import React, { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { canAccessPrefix, ROLE } from "../../config/accessControl";

const linkClass = (isActive) =>
  `block px-4 py-3 rounded-lg transition font-medium ${
    isActive
      ? "bg-blue-600 text-white shadow"
      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
  }`;

const subLinkClass = (isActive) =>
  `block px-4 py-2 rounded-lg transition text-sm ${
    isActive
      ? "bg-blue-600 text-white shadow"
      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
  }`;

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const roleName = user?.roleName;

  // ✅ Customer Portal sidebar
  if (roleName === ROLE.CUSTOMER) {
    return (
      <div className="h-screen w-64 bg-white dark:bg-gray-900 shadow-xl p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-blue-600 mb-8">Customer Portal</h2>

        <nav className="space-y-3 flex-1 overflow-y-auto pr-1">
          <NavLink to="/portal" className={({ isActive }) => linkClass(isActive)}>
            Dashboard
          </NavLink>
          <NavLink to="/portal/projects" className={({ isActive }) => linkClass(isActive)}>
            My Projects
          </NavLink>
          <NavLink to="/portal/documents/contracts" className={({ isActive }) => linkClass(isActive)}>
            Contracts
          </NavLink>
          <NavLink to="/portal/finance/invoices" className={({ isActive }) => linkClass(isActive)}>
            Invoices
          </NavLink>
          <NavLink to="/portal/finance/payments" className={({ isActive }) => linkClass(isActive)}>
            Payments
          </NavLink>
        </nav>

        <div className="text-xs text-gray-400 mt-6">© 2026 Roofing ERP</div>
      </div>
    );
  }

  // Visibility flags
  const showDashboard = canAccessPrefix("/", roleName);

  const showCRM =
    canAccessPrefix("/leads", roleName) ||
    canAccessPrefix("/opportunities", roleName) ||
    canAccessPrefix("/customers", roleName);

  const showProjects = canAccessPrefix("/projects", roleName);

  // ✅ Maintenance visibility
  const showMaintenance =
    canAccessPrefix("/maintenance/contracts", roleName) ||
    canAccessPrefix("/maintenance/visits", roleName);

  const showOperations =
    canAccessPrefix("/operations/tasks", roleName) ||
    canAccessPrefix("/operations/calendar", roleName) ||
    canAccessPrefix("/operations/teams", roleName) ||
    canAccessPrefix("/operations/subcontractors", roleName);

  const showFinance =
    canAccessPrefix("/finance/estimates", roleName) ||
    canAccessPrefix("/finance/invoices", roleName) ||
    canAccessPrefix("/finance/payments", roleName) ||
    canAccessPrefix("/finance/expenses", roleName);

  const showInventory =
    canAccessPrefix("/inventory/materials", roleName) ||
    canAccessPrefix("/inventory/suppliers", roleName) ||
    canAccessPrefix("/inventory/purchase-orders", roleName);

  const showReports = canAccessPrefix("/reports", roleName);
  const showAnalytics = canAccessPrefix("/analytics", roleName);

  const showDocuments =
    canAccessPrefix("/documents/contracts", roleName) ||
    canAccessPrefix("/documents/photos", roleName) ||
    canAccessPrefix("/documents/attachments", roleName);

  const showSettings =
    canAccessPrefix("/settings/company", roleName) ||
    canAccessPrefix("/settings/users", roleName) ||
    canAccessPrefix("/settings/roles", roleName);

  const isCrmRoute = useMemo(
    () =>
      location.pathname.startsWith("/leads") ||
      location.pathname.startsWith("/opportunities") ||
      location.pathname.startsWith("/customers"),
    [location.pathname]
  );

  const isProjectsRoute = useMemo(() => location.pathname.startsWith("/projects"), [location.pathname]);
  const isMaintenanceRoute = useMemo(() => location.pathname.startsWith("/maintenance"), [location.pathname]);

  const isOperationsRoute = useMemo(
    () => location.pathname.startsWith("/operations") || location.pathname === "/tasks",
    [location.pathname]
  );

  const isFinanceRoute = useMemo(() => location.pathname.startsWith("/finance"), [location.pathname]);
  const isInventoryRoute = useMemo(
    () => location.pathname.startsWith("/inventory") || location.pathname === "/materials",
    [location.pathname]
  );
  const isReportsRoute = useMemo(() => location.pathname.startsWith("/reports"), [location.pathname]);
  const isAnalyticsRoute = useMemo(() => location.pathname.startsWith("/analytics"), [location.pathname]);
  const isDocumentsRoute = useMemo(() => location.pathname.startsWith("/documents"), [location.pathname]);
  const isSettingsRoute = useMemo(() => location.pathname.startsWith("/settings"), [location.pathname]);

  const [crmOpen, setCrmOpen] = useState(isCrmRoute);
  const [projectsOpen, setProjectsOpen] = useState(isProjectsRoute);
  const [maintenanceOpen, setMaintenanceOpen] = useState(isMaintenanceRoute);
  const [operationsOpen, setOperationsOpen] = useState(isOperationsRoute);
  const [financeOpen, setFinanceOpen] = useState(isFinanceRoute);
  const [inventoryOpen, setInventoryOpen] = useState(isInventoryRoute);
  const [reportsOpen, setReportsOpen] = useState(isReportsRoute);
  const [analyticsOpen, setAnalyticsOpen] = useState(isAnalyticsRoute);
  const [documentsOpen, setDocumentsOpen] = useState(isDocumentsRoute);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsRoute);

  return (
    <div className="h-screen w-64 bg-white dark:bg-gray-900 shadow-xl p-6 flex flex-col">
      <h2 className="text-2xl font-bold text-blue-600 mb-8">Roofing CRM</h2>

      <nav className="space-y-3 flex-1 overflow-y-auto pr-1">
        {showDashboard && (
          <NavLink to="/" className={({ isActive }) => linkClass(isActive)}>
            Dashboard
          </NavLink>
        )}

        {/* CRM */}
        {showCRM && (
          <div className="space-y-2">
            <button
              onClick={() => setCrmOpen(!crmOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition font-medium ${
                isCrmRoute
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <span>CRM</span>
              <span className="text-xs">{crmOpen ? "▲" : "▼"}</span>
            </button>

            {crmOpen && (
              <div className="ml-3 space-y-2">
                {canAccessPrefix("/leads", roleName) && (
                  <NavLink to="/leads" className={({ isActive }) => subLinkClass(isActive)}>
                    Leads
                  </NavLink>
                )}
                {canAccessPrefix("/opportunities", roleName) && (
                  <NavLink to="/opportunities" className={({ isActive }) => subLinkClass(isActive)}>
                    Opportunities
                  </NavLink>
                )}
                {canAccessPrefix("/customers", roleName) && (
                  <NavLink to="/customers" className={({ isActive }) => subLinkClass(isActive)}>
                    Customers
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* Projects */}
        {showProjects && (
          <div className="space-y-2">
            <button
              onClick={() => setProjectsOpen(!projectsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition font-medium ${
                isProjectsRoute
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <span>Projects</span>
              <span className="text-xs">{projectsOpen ? "▲" : "▼"}</span>
            </button>

            {projectsOpen && (
              <div className="ml-3 space-y-2">
                {canAccessPrefix("/projects/active-jobs", roleName) && (
                  <NavLink to="/projects/active-jobs" className={({ isActive }) => subLinkClass(isActive)}>
                    Active Jobs
                  </NavLink>
                )}
                {canAccessPrefix("/projects/schedule", roleName) && (
                  <NavLink to="/projects/schedule" className={({ isActive }) => subLinkClass(isActive)}>
                    Project Schedule
                  </NavLink>
                )}
                {canAccessPrefix("/projects/inspections", roleName) && (
                  <NavLink to="/projects/inspections" className={({ isActive }) => subLinkClass(isActive)}>
                    Inspections
                  </NavLink>
                )}
                {canAccessPrefix("/projects/work-orders", roleName) && (
                  <NavLink to="/projects/work-orders" className={({ isActive }) => subLinkClass(isActive)}>
                    Work Orders
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* ✅ Maintenance (NEW) */}
        {showMaintenance && (
          <div className="space-y-2">
            <button
              onClick={() => setMaintenanceOpen(!maintenanceOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition font-medium ${
                isMaintenanceRoute
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <span>Maintenance</span>
              <span className="text-xs">{maintenanceOpen ? "▲" : "▼"}</span>
            </button>

            {maintenanceOpen && (
              <div className="ml-3 space-y-2">
                {canAccessPrefix("/maintenance/contracts", roleName) && (
                  <NavLink to="/maintenance/contracts" className={({ isActive }) => subLinkClass(isActive)}>
                    Contracts
                  </NavLink>
                )}
                {canAccessPrefix("/maintenance/visits", roleName) && (
                  <NavLink to="/maintenance/visits" className={({ isActive }) => subLinkClass(isActive)}>
                    Visits
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* Operations */}
        {showOperations && (
          <div className="space-y-2">
            <button
              onClick={() => setOperationsOpen(!operationsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition font-medium ${
                isOperationsRoute
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <span>Operations</span>
              <span className="text-xs">{operationsOpen ? "▲" : "▼"}</span>
            </button>

            {operationsOpen && (
              <div className="ml-3 space-y-2">
                {canAccessPrefix("/operations/tasks", roleName) && (
                  <NavLink to="/operations/tasks" className={({ isActive }) => subLinkClass(isActive)}>
                    Tasks
                  </NavLink>
                )}
                {canAccessPrefix("/operations/calendar", roleName) && (
                  <NavLink to="/operations/calendar" className={({ isActive }) => subLinkClass(isActive)}>
                    Calendar
                  </NavLink>
                )}
                {canAccessPrefix("/operations/teams", roleName) && (
                  <NavLink to="/operations/teams" className={({ isActive }) => subLinkClass(isActive)}>
                    Teams / Employees
                  </NavLink>
                )}
                {canAccessPrefix("/operations/subcontractors", roleName) && (
                  <NavLink to="/operations/subcontractors" className={({ isActive }) => subLinkClass(isActive)}>
                    Subcontractors
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* Finance */}
        {showFinance && (
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setFinanceOpen(!financeOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition font-medium ${
                isFinanceRoute
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <span>Finance</span>
              <span className="text-xs">{financeOpen ? "▲" : "▼"}</span>
            </button>

            {financeOpen && (
              <div className="ml-3 space-y-2">
                {canAccessPrefix("/finance/estimates", roleName) && (
                  <NavLink to="/finance/estimates" className={({ isActive }) => subLinkClass(isActive)}>
                    Estimates
                  </NavLink>
                )}
                {canAccessPrefix("/finance/invoices", roleName) && (
                  <NavLink to="/finance/invoices" className={({ isActive }) => subLinkClass(isActive)}>
                    Invoices
                  </NavLink>
                )}
                {canAccessPrefix("/finance/payments", roleName) && (
                  <NavLink to="/finance/payments" className={({ isActive }) => subLinkClass(isActive)}>
                    Payments
                  </NavLink>
                )}
                {canAccessPrefix("/finance/expenses", roleName) && (
                  <NavLink to="/finance/expenses" className={({ isActive }) => subLinkClass(isActive)}>
                    Expenses
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* Inventory */}
        {showInventory && (
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition font-medium ${
                isInventoryRoute
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <span>Inventory</span>
              <span className="text-xs">{inventoryOpen ? "▲" : "▼"}</span>
            </button>

            {inventoryOpen && (
              <div className="ml-3 space-y-2">
                {canAccessPrefix("/inventory/materials", roleName) && (
                  <NavLink to="/inventory/materials" className={({ isActive }) => subLinkClass(isActive)}>
                    Materials
                  </NavLink>
                )}
                {canAccessPrefix("/inventory/suppliers", roleName) && (
                  <NavLink to="/inventory/suppliers" className={({ isActive }) => subLinkClass(isActive)}>
                    Suppliers
                  </NavLink>
                )}
                {canAccessPrefix("/inventory/purchase-orders", roleName) && (
                  <NavLink to="/inventory/purchase-orders" className={({ isActive }) => subLinkClass(isActive)}>
                    Purchase Orders
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reports */}
        {showReports && (
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setReportsOpen(!reportsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition font-medium ${
                isReportsRoute
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <span>Reports</span>
              <span className="text-xs">{reportsOpen ? "▲" : "▼"}</span>
            </button>

            {reportsOpen && (
              <div className="ml-3 space-y-2">
                <NavLink to="/reports/revenue" className={({ isActive }) => subLinkClass(isActive)}>
                  Revenue Reports
                </NavLink>
                <NavLink to="/reports/sales" className={({ isActive }) => subLinkClass(isActive)}>
                  Sales Reports
                </NavLink>
                <NavLink to="/reports/job-performance" className={({ isActive }) => subLinkClass(isActive)}>
                  Job Performance
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        {showAnalytics && (
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setAnalyticsOpen(!analyticsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition font-medium ${
                isAnalyticsRoute
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <span>Analytics</span>
              <span className="text-xs">{analyticsOpen ? "▲" : "▼"}</span>
            </button>

            {analyticsOpen && (
              <div className="ml-3 space-y-2">
                <NavLink to="/analytics/business" className={({ isActive }) => subLinkClass(isActive)}>
                  Business Analytics
                </NavLink>
                <NavLink to="/analytics/pipeline" className={({ isActive }) => subLinkClass(isActive)}>
                  Pipeline Analytics
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {showDocuments && (
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setDocumentsOpen(!documentsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition font-medium ${
                isDocumentsRoute
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <span>Documents</span>
              <span className="text-xs">{documentsOpen ? "▲" : "▼"}</span>
            </button>

            {documentsOpen && (
              <div className="ml-3 space-y-2">
                {canAccessPrefix("/documents/contracts", roleName) && (
                  <NavLink to="/documents/contracts" className={({ isActive }) => subLinkClass(isActive)}>
                    Contracts
                  </NavLink>
                )}
                {canAccessPrefix("/documents/photos", roleName) && (
                  <NavLink to="/documents/photos" className={({ isActive }) => subLinkClass(isActive)}>
                    Photos
                  </NavLink>
                )}
                {canAccessPrefix("/documents/attachments", roleName) && (
                  <NavLink to="/documents/attachments" className={({ isActive }) => subLinkClass(isActive)}>
                    Attachments
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {showSettings && (
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition font-medium ${
                isSettingsRoute
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              type="button"
            >
              <span>Settings</span>
              <span className="text-xs">{settingsOpen ? "▲" : "▼"}</span>
            </button>

            {settingsOpen && (
              <div className="ml-3 space-y-2">
                {canAccessPrefix("/settings/company", roleName) && (
                  <NavLink to="/settings/company" className={({ isActive }) => subLinkClass(isActive)}>
                    Company Settings
                  </NavLink>
                )}
                {canAccessPrefix("/settings/users", roleName) && (
                  <NavLink to="/settings/users" className={({ isActive }) => subLinkClass(isActive)}>
                    User Management
                  </NavLink>
                )}
                {canAccessPrefix("/settings/roles", roleName) && (
                  <NavLink to="/settings/roles" className={({ isActive }) => subLinkClass(isActive)}>
                    Roles & Permissions
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="text-xs text-gray-400 mt-6">© 2026 Roofing ERP</div>
    </div>
  );
};

export default Sidebar;