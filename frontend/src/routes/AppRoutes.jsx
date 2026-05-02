import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "../components/layout/layout";
import { AuthProvider, useAuth } from "../context/AuthContext";
import RequireAuth from "../components/auth/RequireAuth";
import AccessGuard from "../components/auth/AccessGuard";

import { ROLE } from "../config/accessControl";

import SetupAdmin from "../pages/auth/SetupAdmin";
import Login from "../pages/auth/Login";
import Unauthorized from "../pages/Unauthorized";

import Dashboard from "../pages/Dashboard";
import Leads from "../pages/Leads";
import Opportunities from "../pages/Opportunities";
import Projects from "../pages/Projects";
import Tasks from "../pages/Tasks";
import ProjectDetail from "../pages/ProjectDetail";
import Customers from "../pages/Customers";
import CustomerDetails from "../pages/CustomerDetails";
import Materials from "../pages/Materials";
import Workers from "../pages/Workers";
import LeadsPipeline from "../pages/LeadsPipeline";

// Finance
import Estimates from "../pages/finance/Estimates";
import Invoices from "../pages/finance/Invoices";
import Payments from "../pages/finance/Payments";
import Expenses from "../pages/finance/Expenses";

// Reports
import RevenueReports from "../pages/reports/RevenueReports";
import SalesReports from "../pages/reports/SalesReports";
import JobPerformance from "../pages/reports/JobPerformance";

// Analytics
import BusinessAnalytics from "../pages/analytics/BusinessAnalytics";
import PipelineAnalytics from "../pages/analytics/PipelineAnalytics";

// Documents
import Contracts from "../pages/documents/Contracts";
import Photos from "../pages/documents/Photos";
import Attachments from "../pages/documents/Attachments";

// Inventory
import Suppliers from "../pages/inventory/Suppliers";
import PurchaseOrders from "../pages/inventory/PurchaseOrders";

// Operations
import TeamsEmployees from "../pages/operations/TeamsEmployees";
import Calendar from "../pages/operations/Calendar";
import Subcontractors from "../pages/operations/Subcontractors";

// Projects pages
import ProjectSchedule from "../pages/projects/ProjectSchedule";
import Inspections from "../pages/projects/Inspections";
import WorkOrders from "../pages/projects/WorkOrders";

// Settings
import CompanySettings from "../pages/settings/CompanySettings";
import UserManagement from "../pages/settings/UserManagement";
import RolesPermissions from "../pages/settings/RolesPermissions";

// Customer Portal pages
import PortalDashboard from "../pages/portal/PortalDashboard";
import PortalProjects from "../pages/portal/PortalProjects";
import PortalProjectDetail from "../pages/portal/PortalProjectDetail";
import PortalInvoices from "../pages/portal/PortalInvoices";
import PortalPayments from "../pages/portal/PortalPayments";

// Maintenance pages
import MaintenanceContracts from "../pages/maintenance/MaintenanceContracts";
import MaintenanceVisits from "../pages/maintenance/MaintenanceVisits";

const Home = () => {
  const { user } = useAuth();
  if (user?.roleName === ROLE.CUSTOMER) return <Navigate to="/portal" replace />;
  return <Dashboard />;
};

const AppRoutes = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/setup" element={<SetupAdmin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected */}
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              {/* Home */}
              <Route
                path="/"
                element={
                  <AccessGuard allow="/">
                    <Home />
                  </AccessGuard>
                }
              />

              {/* Customer Portal */}
              <Route
                path="/portal"
                element={
                  <AccessGuard allow="/portal">
                    <Outlet />
                  </AccessGuard>
                }
              >
                <Route index element={<PortalDashboard />} />
                <Route path="projects" element={<PortalProjects />} />
                <Route path="projects/:id" element={<PortalProjectDetail />} />

                <Route path="documents" element={<Navigate to="documents/contracts" replace />} />
                <Route path="documents/contracts" element={<Contracts />} />

                <Route path="finance" element={<Navigate to="finance/invoices" replace />} />
                <Route path="finance/invoices" element={<PortalInvoices />} />
                <Route path="finance/payments" element={<PortalPayments />} />
              </Route>

              {/* Maintenance */}
              <Route path="/maintenance" element={<Navigate to="/maintenance/contracts" replace />} />

              <Route
                path="/maintenance/contracts"
                element={
                  <AccessGuard allow="/maintenance/contracts">
                    <MaintenanceContracts />
                  </AccessGuard>
                }
              />
              <Route
                path="/maintenance/visits"
                element={
                  <AccessGuard allow="/maintenance/visits">
                    <MaintenanceVisits />
                  </AccessGuard>
                }
              />

              {/* CRM */}
              <Route path="/crm" element={<Navigate to="/leads" replace />} />

              <Route
                path="/leads"
                element={
                  <AccessGuard allow="/leads">
                    <Leads />
                  </AccessGuard>
                }
              />
              <Route
                path="/leads/pipeline"
                element={
                  <AccessGuard allow="/leads">
                    <LeadsPipeline />
                  </AccessGuard>
                }
              />
              <Route
                path="/opportunities"
                element={
                  <AccessGuard allow="/opportunities">
                    <Opportunities />
                  </AccessGuard>
                }
              />
              <Route
                path="/customers"
                element={
                  <AccessGuard allow="/customers">
                    <Customers />
                  </AccessGuard>
                }
              />
              <Route
                path="/customers/:name"
                element={
                  <AccessGuard allow="/customers">
                    <CustomerDetails />
                  </AccessGuard>
                }
              />

              {/* Projects */}
              <Route
                path="/projects"
                element={
                  <AccessGuard allow="/projects">
                    <Projects />
                  </AccessGuard>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <AccessGuard allow="/projects">
                    <ProjectDetail />
                  </AccessGuard>
                }
              />
              <Route
                path="/projects/active-jobs"
                element={
                  <AccessGuard allow="/projects">
                    <Projects />
                  </AccessGuard>
                }
              />

              {/* ✅ UPDATED allow values (important for RBAC) */}
              <Route
                path="/projects/schedule"
                element={
                  <AccessGuard allow="/projects/schedule">
                    <ProjectSchedule />
                  </AccessGuard>
                }
              />
              <Route
                path="/projects/inspections"
                element={
                  <AccessGuard allow="/projects/inspections">
                    <Inspections />
                  </AccessGuard>
                }
              />
              <Route
                path="/projects/work-orders"
                element={
                  <AccessGuard allow="/projects/work-orders">
                    <WorkOrders />
                  </AccessGuard>
                }
              />

              {/* Operations */}
              <Route path="/tasks" element={<Navigate to="/operations/tasks" replace />} />

              <Route
                path="/operations/tasks"
                element={
                  <AccessGuard allow="/operations/tasks">
                    <Tasks />
                  </AccessGuard>
                }
              />
              <Route
                path="/operations/calendar"
                element={
                  <AccessGuard allow="/operations/calendar">
                    <Calendar />
                  </AccessGuard>
                }
              />
              <Route
                path="/operations/teams"
                element={
                  <AccessGuard allow="/operations/teams">
                    <TeamsEmployees />
                  </AccessGuard>
                }
              />
              <Route
                path="/operations/subcontractors"
                element={
                  <AccessGuard allow="/operations/subcontractors">
                    <Subcontractors />
                  </AccessGuard>
                }
              />

              {/* Finance */}
              <Route path="/finance" element={<Navigate to="/finance/estimates" replace />} />

              <Route
                path="/finance/estimates"
                element={
                  <AccessGuard allow="/finance/estimates">
                    <Estimates />
                  </AccessGuard>
                }
              />
              <Route
                path="/finance/invoices"
                element={
                  <AccessGuard allow="/finance/invoices">
                    <Invoices />
                  </AccessGuard>
                }
              />
              <Route
                path="/finance/payments"
                element={
                  <AccessGuard allow="/finance/payments">
                    <Payments />
                  </AccessGuard>
                }
              />
              <Route
                path="/finance/expenses"
                element={
                  <AccessGuard allow="/finance/expenses">
                    <Expenses />
                  </AccessGuard>
                }
              />

              {/* Inventory */}
              <Route
                path="/inventory/materials"
                element={
                  <AccessGuard allow="/inventory/materials">
                    <Materials />
                  </AccessGuard>
                }
              />
              <Route
                path="/inventory/suppliers"
                element={
                  <AccessGuard allow="/inventory/suppliers">
                    <Suppliers />
                  </AccessGuard>
                }
              />
              <Route
                path="/inventory/purchase-orders"
                element={
                  <AccessGuard allow="/inventory/purchase-orders">
                    <PurchaseOrders />
                  </AccessGuard>
                }
              />

              {/* Reports */}
              <Route path="/reports" element={<Navigate to="/reports/revenue" replace />} />

              <Route
                path="/reports/revenue"
                element={
                  <AccessGuard allow="/reports">
                    <RevenueReports />
                  </AccessGuard>
                }
              />
              <Route
                path="/reports/sales"
                element={
                  <AccessGuard allow="/reports">
                    <SalesReports />
                  </AccessGuard>
                }
              />
              <Route
                path="/reports/job-performance"
                element={
                  <AccessGuard allow="/reports">
                    <JobPerformance />
                  </AccessGuard>
                }
              />

              {/* Analytics */}
              <Route path="/analytics" element={<Navigate to="/analytics/business" replace />} />

              <Route
                path="/analytics/business"
                element={
                  <AccessGuard allow="/analytics">
                    <BusinessAnalytics />
                  </AccessGuard>
                }
              />
              <Route
                path="/analytics/pipeline"
                element={
                  <AccessGuard allow="/analytics">
                    <PipelineAnalytics />
                  </AccessGuard>
                }
              />

              {/* Documents */}
              <Route path="/documents" element={<Navigate to="/documents/contracts" replace />} />

              <Route
                path="/documents/contracts"
                element={
                  <AccessGuard allow="/documents/contracts">
                    <Contracts />
                  </AccessGuard>
                }
              />
              <Route
                path="/documents/photos"
                element={
                  <AccessGuard allow="/documents/photos">
                    <Photos />
                  </AccessGuard>
                }
              />
              <Route
                path="/documents/attachments"
                element={
                  <AccessGuard allow="/documents/attachments">
                    <Attachments />
                  </AccessGuard>
                }
              />

              {/* Settings */}
              <Route path="/settings" element={<Navigate to="/settings/company" replace />} />

              <Route
                path="/settings/company"
                element={
                  <AccessGuard allow="/settings/company">
                    <CompanySettings />
                  </AccessGuard>
                }
              />
              <Route
                path="/settings/users"
                element={
                  <AccessGuard allow="/settings/users">
                    <UserManagement />
                  </AccessGuard>
                }
              />
              <Route
                path="/settings/roles"
                element={
                  <AccessGuard allow="/settings/roles">
                    <RolesPermissions />
                  </AccessGuard>
                }
              />

              {/* Legacy routes */}
              <Route
                path="/materials"
                element={
                  <AccessGuard allow="/inventory/materials">
                    <Navigate to="/inventory/materials" replace />
                  </AccessGuard>
                }
              />
              <Route
                path="/workers"
                element={
                  <AccessGuard allow="/workers">
                    <Workers />
                  </AccessGuard>
                }
              />
            </Route>
          </Route>

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;