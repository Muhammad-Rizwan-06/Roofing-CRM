# Roofing Management System - Project Architecture & Structure

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Overall Architecture](#overall-architecture)
4. [Authentication & Authorization Flow](#authentication--authorization-flow)
5. [Component Structure](#component-structure)
6. [Data Flow & Storage](#data-flow--storage)
7. [Module Features](#module-features)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Navigation Structure](#navigation-structure)

---

## 📱 Project Overview

**Roofing Management System** is a comprehensive web-based ERP application for roofing companies. It provides tools for:
- Sales & Lead Management (CRM)
- Project Management
- Financial Operations (Invoices, Estimates, Payments)
- Operations & Team Management
- Inventory & Procurement
- Document Management
- Maintenance Contracts
- Analytics & Reporting
- Customer Portal

**Tech Stack:**
- **Frontend Framework:** React 19.2.4 + React Router 7.14.0
- **Build Tool:** Vite 8.0.4
- **UI Framework:** TailwindCSS 4.2.2
- **Icons:** Lucide React 1.7.0
- **Charts:** Recharts 3.8.1
- **Storage:** LocalStorage (browser) + IndexedDB (file storage)

---

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  App.jsx → AppRoutes.jsx (Router Configuration)      │   │
│  └──────────────────────────────────────────────────────┘   │
│           ↓                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Context Providers (Global State)                    │   │
│  │  ├─ ThemeContext (Dark/Light mode)                   │   │
│  │  └─ AuthContext (User session, login/logout)         │   │
│  └──────────────────────────────────────────────────────┘   │
│           ↓                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Authentication Layer                                │   │
│  │  ├─ RequireAuth (Protect routes, redirect to login)  │   │
│  │  └─ AccessGuard (Role-based access control)          │   │
│  └──────────────────────────────────────────────────────┘   │
│           ↓                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Layout Component                                    │   │
│  │  ├─ Sidebar (Navigation Menu)                        │   │
│  │  ├─ Navbar (Header)                                  │   │
│  │  └─ Main Content (Outlet - Dynamic Pages)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   LocalStorage & IndexedDB                   │
│  ├─ users (admin/employee data)                             │
│  ├─ session_user (current logged-in user)                   │
│  └─ IDB Files (document storage)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization Flow

### Step 1: Initial Load
```
App Starts
    ↓
Check if users exist in localStorage
    ├─ YES → Show Login page
    └─ NO → Show Setup Admin page (first-time setup)
```

### Step 2: Login Process
```
User enters email & password
    ↓
AuthContext.login() verifies credentials:
    ├─ Hash password with stored salt
    ├─ Compare hash with stored passwordHash
    └─ If match → Create session
    
Session stored in localStorage (session_user)
    ↓
User redirected to Dashboard (or intended page)
```

### Step 3: Route Protection
```
User navigates to protected route
    ↓
RequireAuth component checks:
    ├─ Is user logged in? (check localStorage session_user)
    ├─ If NO → Redirect to /login
    └─ If YES → Check role-based access
    
AccessGuard component verifies:
    ├─ Does user's role have access to this path?
    ├─ Check against accessControl.js rules
    ├─ If YES → Render page
    └─ If NO → Redirect to /unauthorized
```

### Step 4: Role-Based Access Control
**Available Roles:**
- **Admin** - Full system access
- **Sales Manager** - CRM, estimates, leads
- **Project Manager** - Projects, operations, maintenance
- **Worker** - Tasks, calendar, maintenance visits
- **Accountant** - Finance modules (invoices, payments, expenses)
- **Customer** - Limited portal access (view projects & invoices)

---

## 🧩 Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── RequireAuth.jsx        ← Route protection wrapper
│   │   ├── AccessGuard.jsx        ← Role-based access check
│   │   └── AuthShell.jsx          ← Auth layout shell
│   │
│   ├── layout/
│   │   ├── Layout.jsx             ← Main app layout
│   │   ├── Navbar.jsx             ← Top navigation bar
│   │   └── Sidebar.jsx            ← Left navigation menu
│   │
│   ├── ui/
│   │   ├── Button.jsx             ← Reusable button
│   │   ├── Card.jsx               ← Card container
│   │   ├── InputField.jsx         ← Form input
│   │   ├── SelectField.jsx        ← Dropdown select
│   │   ├── Table.jsx              ← Data table
│   │   ├── KanbanColumn.jsx       ← Kanban board column
│   │   └── TaskKanbanColumn.jsx   ← Task-specific kanban
│   │
│   ├── customers/
│   │   ├── CustomersTable.jsx     ← Customer list
│   │   └── CustomerProjects.jsx   ← Customer's projects
│   │
│   ├── leads/
│   │   ├── LeadsTable.jsx         ← Lead list
│   │   └── AddLeadModal.jsx       ← New lead form
│   │
│   ├── projects/
│   │   ├── ProjectsTable.jsx      ← Project list
│   │   ├── AddProjectModal.jsx    ← New project form
│   │   ├── TaskSection.jsx        ← Project tasks display
│   │   ├── AddTaskModal.jsx       ← Task creation
│   │   ├── AssignWorkerModal.jsx  ← Task assignment
│   │   └── ProjectInfoCard.jsx    ← Project summary
│   │
│   ├── finance/
│   │   ├── EstimateModal.jsx      ← Create estimate
│   │   ├── InvoiceModal.jsx       ← Create invoice
│   │   ├── PaymentModal.jsx       ← Record payment
│   │   └── ExpenseModal.jsx       ← Record expense
│   │
│   ├── documents/
│   │   └── UploadDocumentModal.jsx ← File upload
│   │
│   ├── dashboard/
│   │   ├── StatCard.jsx           ← Dashboard metric card
│   │   └── LeadsTable.jsx         ← Dashboard leads table
│   │
│   └── maintenance/
│       └── MaintenanceScheduler.jsx ← Background scheduler
│
├── pages/
│   ├── auth/
│   │   ├── Login.jsx              ← Login page
│   │   └── SetupAdmin.jsx         ← First-time setup
│   │
│   ├── Dashboard.jsx              ← Main dashboard
│   ├── Leads.jsx                  ← Lead management
│   ├── Opportunities.jsx          ← Opportunity pipeline
│   ├── Customers.jsx              ← Customer list
│   ├── CustomerDetails.jsx        ← Customer profile
│   ├── Projects.jsx               ← Project list
│   ├── ProjectDetail.jsx          ← Project detail page
│   ├── Tasks.jsx                  ← Task management
│   ├── Workers.jsx                ← Worker/team list
│   ├── Materials.jsx              ← Material catalog
│   ├── LeadsPipeline.jsx          ← Sales pipeline view
│   ├── Unauthorized.jsx           ← 403 error page
│   │
│   ├── finance/
│   │   ├── Estimates.jsx
│   │   ├── Invoices.jsx
│   │   ├── Payments.jsx
│   │   └── Expenses.jsx
│   │
│   ├── documents/
│   │   ├── Contracts.jsx
│   │   ├── Photos.jsx
│   │   └── Attachments.jsx
│   │
│   ├── operations/
│   │   ├── Calendar.jsx           ← Event calendar
│   │   ├── TeamsEmployees.jsx     ← Team management
│   │   └── Subcontractors.jsx     ← Subcontractor list
│   │
│   ├── inventory/
│   │   ├── Suppliers.jsx
│   │   └── PurchaseOrders.jsx
│   │
│   ├── projects/
│   │   ├── ProjectSchedule.jsx
│   │   ├── Inspections.jsx
│   │   └── WorkOrders.jsx
│   │
│   ├── maintenance/
│   │   ├── MaintenanceContracts.jsx
│   │   └── MaintenanceVisits.jsx
│   │
│   ├── analytics/
│   │   ├── BusinessAnalytics.jsx
│   │   └── PipelineAnalytics.jsx
│   │
│   ├── reports/
│   │   ├── RevenueReports.jsx
│   │   ├── SalesReports.jsx
│   │   └── JobPerformance.jsx
│   │
│   ├── settings/
│   │   ├── CompanySettings.jsx
│   │   ├── UserManagement.jsx
│   │   └── RolesPermissions.jsx
│   │
│   └── portal/                     ← Customer-only section
│       ├── PortalDashboard.jsx
│       ├── PortalProjects.jsx
│       ├── PortalProjectDetail.jsx
│       ├── PortalInvoices.jsx
│       └── PortalPayments.jsx
│
├── context/
│   ├── AuthContext.jsx            ← User session & auth
│   └── ThemeContext.jsx           ← Dark/light mode
│
├── config/
│   └── accessControl.js           ← Role-based permission rules
│
├── utils/
│   ├── password.js                ← Password hashing (Argon2)
│   ├── customerScope.js           ← Customer data filtering
│   ├── documentsMetaStore.js      ← Document metadata
│   ├── idbFileStore.js            ← IndexedDB file storage
│   ├── maintenanceScheduler.js    ← Maintenance scheduling
│   └── maintenanceStore.js        ← Maintenance data
│
├── forms/
│   ├── LeadForm.jsx               ← Reusable lead form
│   ├── ProjectForm.jsx            ← Reusable project form
│   └── TaskForm.jsx               ← Reusable task form
│
├── data/
│   ├── mockData.js                ← Sample data (leads, projects)
│   ├── financeMockData.js         ← Sample finance data
│   └── teamsData.js               ← Sample teams data
│
├── constants/
│   └── leadPipeline.js            ← Pipeline stage definitions
│
└── routes/
    └── AppRoutes.jsx              ← Route configuration
```

---

## 💾 Data Flow & Storage

### 1. **LocalStorage** (Browser Storage)
```javascript
// User Management
localStorage.setItem("users", JSON.stringify([
  {
    id: "uuid",
    name: "John Doe",
    email: "john@company.com",
    roleId: 1,
    roleName: "Admin",
    passwordSalt: "...",
    passwordHash: "...",
    status: "Active"
  }
]))

// Current Session
localStorage.setItem("session_user", JSON.stringify({
  id: "uuid",
  name: "John Doe",
  email: "john@company.com",
  roleId: 1,
  roleName: "Admin"
}))

// Other data models stored similarly
```

### 2. **IndexedDB** (File Storage)
```
idbFileStore.js
├─ Stores document files (contracts, photos, attachments)
├─ Metadata: filename, type, size, upload date
└─ Supports file retrieval & deletion
```

### 3. **In-Memory State** (React Hooks)
- Component-level state for forms, modals, UI interactions
- No global state management (Redux/Zustand) currently used

### Data Models

```
User
├─ id: UUID
├─ name: String
├─ email: String
├─ roleId: Number
├─ roleName: String
├─ passwordHash: String
├─ passwordSalt: String
└─ status: "Active" | "Inactive"

Lead
├─ id: Number
├─ name: String
├─ email: String
├─ phone: String
├─ status: Pipeline stage
├─ estimatedValue: Number
└─ notes: String

Project
├─ id: Number
├─ name: String
├─ status: "Planning" | "In Progress" | "Completed"
├─ customer: Reference
├─ startDate: Date
├─ endDate: Date
├─ budget: Number
└─ tasks: Array

Task
├─ id: Number
├─ title: String
├─ status: "Todo" | "In Progress" | "Done"
├─ project: Reference
├─ assignee: Reference
└─ dueDate: Date
```

---

## 🎯 Module Features

### **1. CRM (Lead Management)**
- **Leads** - Track new leads, status pipeline
- **Opportunities** - Pipeline analysis
- **Customers** - Customer database & history
- **Customer Details** - Individual customer profile
- **Lead Pipeline** - Visual sales pipeline (Kanban view)

### **2. Projects**
- **Projects** - List all projects with status
- **Project Details** - Full project view with tasks
- **Project Schedule** - Timeline/calendar view
- **Work Orders** - Job assignments
- **Inspections** - Quality checks

### **3. Operations**
- **Tasks** - Team task management
- **Calendar** - Event/schedule calendar
- **Teams & Employees** - Team structure & assignments
- **Subcontractors** - Third-party contractor management

### **4. Finance**
- **Estimates** - Create & send estimates to customers
- **Invoices** - Generate & track invoices
- **Payments** - Record customer payments
- **Expenses** - Track project expenses

### **5. Maintenance**
- **Maintenance Contracts** - Contract terms & schedules
- **Maintenance Visits** - Service visit tracking
- **Scheduler** - Background maintenance scheduling

### **6. Inventory & Procurement**
- **Materials** - Material catalog
- **Suppliers** - Supplier database
- **Purchase Orders** - Procurement requests

### **7. Documents**
- **Contracts** - Contract storage & management
- **Photos** - Project photo gallery
- **Attachments** - File attachments for projects

### **8. Analytics & Reporting**
- **Business Analytics** - KPIs & business metrics
- **Pipeline Analytics** - Sales pipeline trends
- **Revenue Reports** - Financial summaries
- **Sales Reports** - Salesforce performance
- **Job Performance** - Project completion metrics

### **9. Settings** (Admin Only)
- **Company Settings** - Business configuration
- **User Management** - Create/edit user accounts
- **Roles & Permissions** - Access control configuration

### **10. Customer Portal** (Customer Role Only)
- **Portal Dashboard** - Customer overview
- **My Projects** - Customer's assigned projects
- **Contracts** - Contract access
- **Invoices** - Bill viewing
- **Payments** - Payment tracking

---

## 👥 User Roles & Permissions

### Permission Matrix

```
┌────────────────┬───────┬──────┬────┬────────┬────────────┬──────────┐
│ Feature        │ Admin │ Sales│ PM │ Worker │ Accountant │ Customer │
├────────────────┼───────┼──────┼────┼────────┼────────────┼──────────┤
│ Dashboard      │   ✓   │   ✓  │ ✓  │   ✓    │     ✓      │    -     │
│ Leads          │   ✓   │   ✓  │ -  │   -    │     -      │    -     │
│ Opportunities  │   ✓   │   ✓  │ ✓  │   -    │     -      │    -     │
│ Customers      │   ✓   │   ✓  │ ✓  │   -    │     ✓      │    -     │
│ Projects       │   ✓   │   -  │ ✓  │   ✓    │     ✓      │    ✓     │
│ Tasks          │   ✓   │   -  │ ✓  │   ✓    │     -      │    -     │
│ Operations     │   ✓   │   -  │ ✓  │   ✓    │     -      │    -     │
│ Maintenance    │   ✓   │   -  │ ✓  │   ✓    │     -      │    -     │
│ Estimates      │   ✓   │   ✓  │ -  │   -    │     ✓      │    -     │
│ Invoices       │   ✓   │   -  │ -  │   -    │     ✓      │    ✓     │
│ Payments       │   ✓   │   -  │ -  │   -    │     ✓      │    ✓     │
│ Expenses       │   ✓   │   -  │ -  │   -    │     ✓      │    -     │
│ Documents      │   ✓   │   ✓  │ ✓  │   ✓    │     ✓      │    ✓     │
│ Inventory      │   ✓   │   -  │ ✓  │   -    │     ✓      │    -     │
│ Analytics      │   ✓   │   ✓  │ ✓  │   -    │     ✓      │    -     │
│ Reports        │   ✓   │   ✓  │ ✓  │   -    │     ✓      │    -     │
│ Settings       │   ✓   │   -  │ -  │   -    │     -      │    -     │
│ Customer Portal│   -   │   -  │ -  │   -    │     -      │    ✓     │
└────────────────┴───────┴──────┴────┴────────┴────────────┴──────────┘
```

---

## 🧭 Navigation Structure

### **Employee/Admin Sidebar Menu**

```
DASHBOARD
  └─ Home

CRM
  ├─ Leads
  ├─ Opportunities
  └─ Customers
      └─ Customer Details

PROJECTS
  ├─ Projects List
  ├─ Project Details
  ├─ Project Schedule
  ├─ Work Orders
  └─ Inspections

OPERATIONS
  ├─ Tasks
  ├─ Calendar
  ├─ Teams & Employees
  └─ Subcontractors

MAINTENANCE
  ├─ Maintenance Contracts
  └─ Maintenance Visits

FINANCE
  ├─ Estimates
  ├─ Invoices
  ├─ Payments
  └─ Expenses

INVENTORY
  ├─ Materials
  ├─ Suppliers
  └─ Purchase Orders

DOCUMENTS
  ├─ Contracts
  ├─ Photos
  └─ Attachments

ANALYTICS
  ├─ Business Analytics
  └─ Pipeline Analytics

REPORTS
  ├─ Revenue Reports
  ├─ Sales Reports
  └─ Job Performance

SETTINGS (Admin Only)
  ├─ Company Settings
  ├─ User Management
  └─ Roles & Permissions
```

### **Customer Portal Sidebar Menu**

```
CUSTOMER PORTAL
├─ Dashboard
├─ My Projects
├─ Contracts
├─ Invoices
└─ Payments
```

---

## 🔄 Application Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   User Visits App                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          Check if admin user exists?                        │
├─────────────────────────────────────────────────────────────┤
│         NO (First Time)          │          YES             │
│              ↓                   │           ↓              │
│    Show SetupAdmin Page          │   Show Login Page        │
│  (Create first admin user)       │                          │
│              ↓                   │           ↓              │
│  User creates admin account →────┼──→ User enters creds     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│     Verify credentials via AuthContext.login()              │
│  (Hash password, compare with stored hash)                  │
├─────────────────────────────────────────────────────────────┤
│              Credentials Valid? YES                         │
│                      ↓                                      │
│    Create session_user in localStorage                      │
│         Update AuthContext.user                             │
│              ↓                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│    Redirect to Dashboard (or intended page)                 │
│              ↓                                              │
│    RequireAuth checks: Is user logged in?                   │
│         ├─ YES → Check role-based access (AccessGuard)      │
│         ├─ YES → Render page with Layout                    │
│         └─ NO → Redirect to /login                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Render Layout Component                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────────────────────────┐  │
│  │   Sidebar    │  │  Navbar + Outlet (Page Content)    │  │
│  │              │  │  ┌────────────────────────────────┐│  │
│  │ Navigation   │  │  │  [Dynamic Page Content]        ││  │
│  │ Menu         │  │  │  (Dashboard/Leads/Projects)    ││  │
│  │              │  │  │  etc.                          ││  │
│  │ (Role-based) │  │  └────────────────────────────────┘│  │
│  └──────────────┘  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│     User Interacts (Form, Table, Modal)                     │
│              ↓                                              │
│    Data stored in:                                          │
│    ├─ localStorage (users, leads, projects, etc.)           │
│    ├─ IndexedDB (files/documents)                           │
│    └─ Component state (temp form data)                      │
│              ↓                                              │
│    MaintenanceScheduler runs in background                  │
│    (auto-scheduling maintenance tasks)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         User Logout                                         │
│    ├─ Clear localStorage session_user                       │
│    ├─ Update AuthContext.user = null                        │
│    ├─ Redirect to /login                                    │
│    └─ Sidebar/Navbar re-render                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Key Features Summary

| Feature | Status | Implementation |
|---------|--------|-----------------|
| Authentication | ✓ | Email/password with Argon2 hashing |
| Authorization | ✓ | Role-based access control (RBAC) |
| Dark Mode | ✓ | Theme context + Tailwind classes |
| Responsive UI | ✓ | Tailwind + Flexbox layout |
| File Storage | ✓ | IndexedDB for documents |
| Data Persistence | ✓ | LocalStorage for models |
| Forms & Validation | 🔄 | Partial (modal forms exist) |
| Search/Filter | 🔄 | Table components support it |
| Export/Import | ⏳ | Not yet implemented |
| Real-time Sync | ⏳ | No backend connection yet |
| Notifications | ⏳ | No notification system yet |
| Mobile Responsive | 🔄 | Sidebar collapses but needs mobile work |

---

## 🚀 How Data Flows Through the App

### Example: Creating a New Lead

```
1. User clicks "Add Lead" button
   ↓
2. AddLeadModal.jsx opens (component state: isOpen)
   ↓
3. User fills LeadForm.jsx
   ├─ name, email, phone, status, estimatedValue
   └─ Component state updates as user types
   ↓
4. User clicks "Create Lead"
   ├─ Read existing leads from localStorage
   ├─ Add new lead with auto-generated ID
   ├─ Save updated array to localStorage
   └─ Component state: leadsData updates
   ↓
5. Table re-renders showing new lead
   ↓
6. Modal closes, form resets
```

### Example: User Authorization Flow

```
1. Admin logs in (email: admin@company.com)
   ↓
2. AuthContext sets session_user in localStorage
   ↓
3. Admin navigates to /finance/invoices
   ├─ RequireAuth checks: Is user logged in? YES
   ├─ AccessGuard checks: Can "Admin" access "/finance/invoices"?
   ├─ accessControl.js rule: { prefix: "/finance/invoices", roles: [ADMIN, ACCOUNTANT] }
   ├─ Admin is in allowed roles? YES
   └─ Render Invoices page
   ↓
4. Worker tries same URL
   ├─ RequireAuth checks: Is user logged in? YES
   ├─ AccessGuard checks: Can "Worker" access "/finance/invoices"?
   ├─ accessControl.js rule: Worker NOT in [ADMIN, ACCOUNTANT]
   └─ Redirect to /unauthorized
```

---

## 📝 Conclusion

This is a **full-featured SPA (Single Page Application)** built with modern React patterns:

- **Modular Components** - Reusable, organized by feature
- **Secure Authentication** - Password hashing with Argon2
- **Role-Based Access** - Granular permission control
- **Local Data Storage** - Browser-based persistence (no backend yet)
- **Responsive UI** - TailwindCSS styling
- **Dark Mode Support** - Theme context
- **Multiple User Roles** - Admin, Sales, PM, Worker, Accountant, Customer

The architecture supports scaling to a backend API by replacing localStorage calls with API endpoints.
