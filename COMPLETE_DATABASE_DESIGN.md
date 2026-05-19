# Complete DynamoDB Database Design
## Roofing Management System - Production Ready

**Document Version:** 2.0  
**Created:** May 4, 2026  
**Status:** Complete Database Design (21 Tables)  
**Scope:** All business entities and usage patterns identified in codebase

---

## 📋 Quick Reference: All Tables

| # | Table | Purpose | Records | Status |
|---|-------|---------|---------|--------|
| 1 | USERS | Employee accounts & authentication | 50-200 | ✅ |
| 2 | ROLES | Role definitions & permissions | 6 | ✅ |
| 3 | CUSTOMERS | Customer master data | 100-500 | 🆕 |
| 4 | PROJECTS | Projects & jobs | 300-1000 | ✅ Revised |
| 5 | WORKERS | Employee/worker details | 20-100 | 🆕 |
| 6 | TASKS | Project tasks | 2000-5000 | ✅ |
| 7 | LEADS | Sales leads & opportunities | 500-2000 | ✅ |
| 8 | ESTIMATES | Quotations & estimates | 500-1500 | ✅ |
| 9 | INVOICES | Customer invoices | 2000-5000 | ✅ |
| 10 | PAYMENTS | Payment records | 2000-5000 | ✅ |
| 11 | EXPENSES | Project & operational expenses | 3000-8000 | ✅ |
| 12 | SUPPLIERS | Vendor master data | 20-50 | 🆕 |
| 13 | MATERIALS | Materials catalog & inventory | 100-300 | 🆕 |
| 14 | PURCHASE_ORDERS | Material purchase orders | 500-1500 | 🆕 |
| 15 | DOCUMENTS | Document metadata (files in S3) | 1000-3000 | ✅ |
| 16 | MAINTENANCE | Maintenance contracts & visits | 200-500 | ✅ |
| 17 | WORK_ORDERS | Work order scheduling | 300-1000 | 🆕 |
| 18 | INSPECTIONS | Quality inspections | 300-800 | 🆕 |
| 19 | CONTRACTS | Customer service contracts | 100-300 | 🆕 |
| 20 | SUBCONTRACTORS | External service vendors | 10-30 | 🆕 |
| 21 | AUDIT_LOG | Compliance & change tracking | Unbounded | ✅ |
| 22 | DAILY_METRICS | Analytics & reporting | 365+/year | 🆕 |
| 23 | SETTINGS | Company configuration | 1 | 🆕 |

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│                    (Authentication Layer)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌────────┐        ┌────────┐       ┌──────────┐
    │ USERS  │        │ LEADS  │       │ PROJECTS │
    │ ROLES  │        │ OPPTY  │       │ TASKS    │
    └────────┘        └────────┘       └──────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────────────┐
        │                  │                          │
        ▼                  ▼                          ▼
    ┌──────────┐    ┌───────────┐          ┌──────────────────┐
    │CUSTOMERS │    │ESTIMATES  │          │ OPERATIONS       │
    │CONTRACTS │◄───┤INVOICES   │◄─────────┤ ├─ Workers      │
    │PORTAL    │    │PAYMENTS   │          │ ├─ Work Orders  │
    └──────────┘    └───────────┘          │ ├─ Schedules    │
                         │                  │ ├─ Inspections  │
                         │                  └──────────────────┘
                         ▼
                    ┌──────────────┐
                    │ PROCUREMENT  │
                    │ ├─ Suppliers │
                    │ ├─ Materials │
                    │ └─ POs       │
                    └──────────────┘
```

---

# TABLE DEFINITIONS

---

## 1️⃣ USERS Table [DONE]

**Purpose:** User accounts, authentication, role assignment

```
Partition Key (PK):  USER#{UUID}
Sort Key (SK):       PROFILE#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "USER#550e8400-e29b-41d4-a716-446655440000",
  "SK": "PROFILE#2026-04-01",
  "Name": "John Doe",
  "Email": "john@company.com",
  "Phone": "+1-234-567-8900",
  "RoleId": 1,
  "RoleName": "Admin",
  "PasswordHash": "$argon2id$v=19$m=65536,t=3,p=4$...",
  "PasswordSalt": "generated_salt_value",
  "Status": "Active",
  "StartDate": "2025-01-15",
  "LastLoginAt": "2026-05-04T15:30:00Z",
  "CreatedAt": "2025-01-15T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z",
  "GSI1PK": "EMAIL#john@company.com",
  "GSI1SK": "Active#2026-05-04",
  "GSI2PK": "ROLE#Admin",
  "GSI2SK": "LastLoginAt"
}
```

**Fields Used In Codebase:**
- `Name` - Display in sidebar, project assignment
- `Email` - Login, customer linking
- `RoleId` - Access control checks
- `RoleName` - Role-based UI rendering
- `Status` - Inactive user prevention
- `PasswordHash/Salt` - Login verification

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | EMAIL | Status#CreatedAt | Query user by email for login |
| GSI2 | ROLE | LastLoginAt | List users by role, last activity |
| GSI3 | Status | CreatedAt | Active/inactive user lists |

**Capacity:** 50-200 users | **Mode:** On-Demand

---

## 2️⃣ ROLES Table [DONE]

**Purpose:** Role definitions, permissions, access control

```
Partition Key (PK):  ROLE#{RoleId}
Sort Key (SK):       METADATA
```

**Schema:**

```json
{
  "PK": "ROLE#1",
  "SK": "METADATA",
  "RoleId": 1,
  "RoleName": "Admin",
  "Description": "Full system access",
  "Permissions": [
    "view:dashboard",
    "manage:users",
    "manage:roles",
    "manage:settings",
    "manage:leads",
    "manage:projects",
    "manage:tasks",
    "view:reports",
    "view:analytics"
  ],
  "Status": "Active",
  "CreatedAt": "2025-01-01T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z"
}
```

**Role Definitions (6 Roles):**

```
1. ADMIN
   - Full system access
   - All CRUD operations
   - User/role management
   - Settings & configuration
   
2. SALES_MANAGER
   - Leads management
   - Estimate creation
   - Opportunity pipeline
   - Limited reporting
   
3. PROJECT_MANAGER
   - Project CRUD
   - Task management
   - Team/worker assignment
   - Schedule management
   - Expense approval
   
4. WORKER
   - View own tasks
   - Update task status
   - Log time/hours
   - View project details (assigned)
   - Download documents (project-related)
   
5. ACCOUNTANT
   - Invoice CRUD
   - Payment recording
   - Expense tracking
   - Financial reports
   - Read-only: Projects, Customers
   
6. CUSTOMER
   - Portal-only access
   - View own projects
   - View own invoices
   - View own payments
   - Download documents
   - Cannot: Create, delete, edit
```

**Capacity:** 6 items (static) | **Mode:** On-Demand

---

## 3️⃣ CUSTOMERS Table 🆕

**Purpose:** Customer master data, billing information, portal accounts

```
Partition Key (PK):  CUSTOMER#{CustomerId}
Sort Key (SK):       PROFILE#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "CUSTOMER#cust-001",
  "SK": "PROFILE#2026-04-01",
  "EntityType": "CUSTOMER",
  "Name": "Ali Khan",
  "Email": "ali.khan@example.com",
  "Phone": "+971-50-1234567",
  "CustomerType": "Residential",
  "Status": "Active",
  "BillingEmail": "billing@akhan.com",
  "BillingAddress": {
    "Street": "123 Main St",
    "City": "Dubai",
    "State": "DXB",
    "ZipCode": "00000",
    "Country": "UAE"
  },
  "ShippingAddress": {
    "Street": "123 Main St",
    "City": "Dubai",
    "State": "DXB",
    "ZipCode": "00000",
    "Country": "UAE"
  },
  "PortalUserId": "USER#550e8400-e29b-41d4-a716-446655440050",
  "PortalEnabled": true,
  "TaxId": "12345678",
  "PaymentTerms": 30,
  "CreditLimit": 50000,
  "ReferralSource": "Direct",
  "Notes": "Preferred customer",
  "CreatedAt": "2026-04-01T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z",
  "GSI1PK": "EMAIL#ali.khan@example.com",
  "GSI1SK": "Active#2026-04-01",
  "GSI2PK": "TYPE#Residential",
  "GSI2SK": "CreatedAt",
  "GSI3PK": "STATUS#Active",
  "GSI3SK": "Name"
}
```

**Fields Collected From Codebase:**
- `Name` - Project client field, Customers page
- `Email` - Portal linking (AddProjectModal.jsx)
- `Phone` - Contact info
- `BillingAddress` - Invoice generation
- `PortalUserId` - Links to USERS table for portal login
- `PaymentTerms` - Used in invoice calculations
- `TaxId` - Invoice requirement

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | EMAIL | Status#CreatedAt | Portal login |
| GSI2 | TYPE | CreatedAt | Filter customers by type |
| GSI3 | STATUS | Name | Active customers |

**Capacity:** 100-500 customers | **Mode:** On-Demand

---

## 4️⃣ PROJECTS Table (Revised)

**Purpose:** Project/job tracking, refactored to use linked items

```
Partition Key (PK):  PROJECT#{ProjectId}
Sort Key (SK):       TYPE#{EntityType}
```

**Main Project Item:**

```json
{
  "PK": "PROJECT#proj-001",
  "SK": "PROFILE#2026-04-01",
  "entityType": "PROJECT",
  "projectId": "PROJECT#proj-001",
  "name": "Ali Khan Residential Roof Replacement",
  "client": "Ali Khan",
  "status": "In Progress",
  "budget": 8500,
  "startDate": "2026-04-05",
  "endDate": "2026-04-30",
  "completedAt": null,
  "supervisorName": "Project Manager Name",
  "CreatedAt": "2026-04-01T08:00:00Z",
  "UpdatedAt": "2026-05-04T11:45:00Z",
  "GSI1PK": "STATUS#In Progress",
  "GSI1SK": "StartDate",
}
```

**Linked Items (Same Table, Different SK):**

```json
// PROJECT_MATERIAL items
{
  "PK": "PROJECT#proj-001",
  "SK": "MATERIAL#mat-001#qty-40",
  "meterialId": "MATERIAL#mat-001",
  "entityType": "PROJECT_MATERIAL",
  "materialName": "Asphalt Shingles",
  "qty": 40,
  "price": 2000
}

// PROJECT_WORKER items
{
  "PK": "PROJECT#proj-001",
  "SK": "WORKER#wrk-001",
  "entityType": "PROJECT_WORKER",
  "workerId": "WORKER#wrk-001",
  "workerName": "Ahmed Hassan",
  "role": "Lead Roofer",
  "hours" : null, 
  "hourlyRate": 45,
  "status": "Assigned"
}

// PROJECT_TASK items
{
  "PK": "PROJECT#proj-001",
  "SK": "TASK#task-001",
  "entityType": "PROJECT_TASK",
  "taskId": "TASK#task-001",
  "taskTitle": "Roof Inspection",
  "status": "Completed",
}

// PROJECT_DOCUMENT items
{
  "PK": "PROJECT#proj-001",
  "SK": "DOCUMENT#doc-001",
  "EntityType": "PROJECT_DOCUMENT",
  "DocumentId": "DOCUMENT#doc-001",
  "FileName": "Contract.pdf",
  "Type": "contract"
}

// PROJECT_INVOICE items
{
  "PK": "PROJECT#proj-001",
  "SK": "INVOICE#inv-001",
  "EntityType": "PROJECT_INVOICE",
  "InvoiceId": "INVOICE#inv-001",
  "InvoiceNo": "INV-0001",
  "Amount": 3850
}
```

**Fields Used In Codebase:**
- `Name` - Projects page display, project cards
- `CustomerId` - Link to customer (NEW)
- `Status` - Filter in Projects.jsx
- `Budget` - Financial tracking
- `StartDate/EndDate` - Schedule management
- `SupervisorId` - Project assignment
- `Materials` → Array was inline, now linked items
- `Workers` → Array was inline, now linked items
- `Tasks` → Array was inline, now linked items

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | CUSTOMER | Status#CreatedAt | Customer's projects |
| GSI2 | STATUS | StartDate | Projects by status |
| GSI3 | SUPERVISOR | CreatedAt | PM's projects |
| GSI4 | YEAR | Budget | Revenue analysis |

**Query Patterns:**
```javascript
// Get all projects for customer
GSI1PK = CUSTOMER#cust-001

// Get active projects (and sort by date)
GSI2PK = STATUS#In Progress
GSI2SK > 2026-04-01

// Get PM's projects
GSI3PK = SUPERVISOR#uuid

// Get projects by year and budget
GSI4PK = YEAR#2026
Sort by Budget DESC
```

**Capacity:** 300-1000 projects | **Mode:** On-Demand

---

## 5️⃣ WORKERS Table 🆕

**Purpose:** Employee/worker master data, skills, scheduling

```
Partition Key (PK):  WORKER#{WorkerId}
Sort Key (SK):       PROFILE#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "WORKER#wrk-001",
  "SK": "PROFILE#2026-01-01",
  "EntityType": "WORKER",
  "Name": "Ahmed Hassan",
  "Email": "ahmed@company.com",
  "Phone": "+971-50-9876543",
  "Role": "Lead Roofer",
  "Skills": [
    "Asphalt Shingles",
    "Metal Roofing",
    "Roof Inspection",
    "Safety Certification"
  ],
  "HourlyRate": 45,
  "Status": "Active",
  "StartDate": "2025-06-01",
  "BankAccount": {
    "AccountName": "Ahmed Hassan",
    "IBAN": "AE123456789",
    "Bank": "Bank Name"
  },
  "EmergencyContact": {
    "Name": "Fatima Hassan",
    "Phone": "+971-50-1111111",
    "Relationship": "Sister"
  },
  "Documents": {
    "LicenseNumber": "DXB-12345",
    "LicenseExpiry": "2026-12-31",
    "SafetyCertified": true,
    "InsuranceExpiry": "2026-12-31"
  },
  "Availability": {
    "StartDate": "2026-05-01",
    "EndDate": "2026-05-31",
    "HoursPerWeek": 40,
    "Status": "Available"
  },
  "CreatedAt": "2025-06-01T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z",
  "GSI1PK": "ROLE#Lead Roofer",
  "GSI1SK": "HourlyRate",
  "GSI2PK": "STATUS#Active",
  "GSI2SK": "HourlyRate",
  "GSI3PK": "SKILL#Roof Inspection",
  "GSI3SK": "Status"
}
```

**Fields Collected From Codebase:**
- `Name` - Worker assignment in tasks
- `Role` - Job assignment
- `HourlyRate` - Cost calculations (workers stored inline in projects)
- `Skills` - Task assignment matching
- `Status` - Workers page display
- `Phone` - Field crew communication
- `BankAccount` - Payroll

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | ROLE | HourlyRate | Workers by role and cost |
| GSI2 | STATUS | HourlyRate | Available workers |
| GSI3 | SKILL | Status | Skill-based assignment |

**Capacity:** 20-100 workers | **Mode:** On-Demand

---

## 6️⃣ TASKS Table

**Purpose:** Project tasks, assignments, progress tracking

```
Partition Key (PK):  TASK#{TaskId}
Sort Key (SK):       CREATED#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "TASK#task-001",
  "SK": "CREATED#2026-04-05T10:00:00Z",
  "EntityType": "TASK",
  "Title": "Roof Inspection",
  "Description": "Initial inspection and measurement of roof area",
  "ProjectId": "PROJECT#proj-001",
  "ProjectName": "Ali Khan Residential Roof Replacement",
  "Status": "Completed",
  "Priority": "High",
  "Category": "Inspection",
  "AssignedToId": "WORKER#wrk-001",
  "AssignedToName": "Ahmed Hassan",
  "StartDate": "2026-04-05",
  "DueDate": "2026-04-06",
  "CompletedAt": "2026-04-06T14:00:00Z",
  "EstimatedHours": 4,
  "ActualHours": 3.5,
  "Dependencies": ["TASK#task-000"],
  "Documents": ["DOCUMENT#doc-001"],
  "CheckList": [
    {
      "item": "Check gutters",
      "completed": true
    },
    {
      "item": "Measure roof area",
      "completed": true
    }
  ],
  "Notes": "Roof in good condition, minor repairs needed",
  "CreatedAt": "2026-04-05T10:00:00Z",
  "UpdatedAt": "2026-04-06T16:30:00Z",
  "CreatedById": "USER#550e8400-e29b-41d4-a716-446655440000",
  "GSI1PK": "PROJECT#proj-001",
  "GSI1SK": "Priority#Status",
  "GSI2PK": "STATUS#Completed",
  "GSI2SK": "DueDate",
  "GSI3PK": "ASSIGNEE#wrk-001",
  "GSI3SK": "DueDate",
  "GSI4PK": "PRIORITY#High",
  "GSI4SK": "DueDate"
}
```

**Fields Used In Codebase:**
- `Title` - Tasks.jsx display
- `ProjectId` - Task filtering
- `AssignedToId` - Worker assignment (AddTaskModal)
- `Status` - Task status updates (pending, in progress, completed)
- `DueDate` - Task scheduling
- `Priority` - Task sorting

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | PROJECT | Priority#Status | Project tasks sorted by priority |
| GSI2 | STATUS | DueDate | Tasks by status, sorted by due date |
| GSI3 | ASSIGNEE | DueDate | Worker's tasks, sorted by due date |
| GSI4 | PRIORITY | DueDate | High-priority tasks across projects |

**Capacity:** 2000-5000 tasks | **Mode:** Provisioned with auto-scaling

---

## 7️⃣ LEADS Table [DONE]

**Purpose:** Sales leads, opportunities, pipeline tracking

```
Partition Key (PK):  LEAD#{LeadId}
Sort Key (SK):       CREATED#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "LEAD#lead-001",
  "SK": "CREATED#2026-04-15T09:30:00Z",
  "name": "Hassan Constructions",
  "email": "hassan@constructions.com",
  "phone": "+971-50-1234567",
  "status": "Estimate Sent",
  "stage": "Negotiation",
  "estimatedValue": 50000,
  "conversionDate": "2026-04-20T10:00:00Z",
  "createdAt": "2026-04-15T09:30:00Z",
  "updatedAt": "2026-05-04T14:20:00Z",
  "GSI1PK": "STATUS#Estimate Sent",
  "GSI1SK": "CreatedAt",
  "GSI2PK": "STAGE#Negotiation",
  "GSI2SK": "EstimatedValue"
}
```

**Fields Used In Codebase:**
- `Name` - Leads table (LeadsTable.jsx)
- `Email` - Contact info
- `Phone` - Sales follow-up
- `Status` - Lead pipeline stages
- `EstimatedValue` - Revenue forecast
- `AssignedToId` - Sales rep assignment
- `Source` - Lead origin tracking

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | STATUS | CreatedAt | Pipeline by stage |
| GSI2 | ASSIGNEE | CreatedAt | Sales rep's leads |
| GSI3 | MONTH | EstimatedValue | Monthly pipeline value |
| GSI4 | STAGE | EstimatedValue | Revenue forecast by stage |

**Capacity:** 500-2000 leads | **Mode:** On-Demand

---

## 8️⃣ ESTIMATES Table

**Purpose:** Quotations and estimates

```
Partition Key (PK):  ESTIMATE#{EstimateId}
Sort Key (SK):       CREATED#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "ESTIMATE#est-001",
  "SK": "CREATED#2026-04-10T10:00:00Z",
  "EntityType": "ESTIMATE",
  "EstimateNo": "EST-0001",
  "LeadId": "LEAD#lead-001",
  "ProjectId": null,
  "Customer": "Hassan Constructions",
  "Email": "hassan@constructions.com",
  "IssueDate": "2026-04-10",
  "ValidUntil": "2026-04-25",
  "Items": [
    {
      "description": "Roof area measurement and inspection",
      "qty": 1,
      "unitPrice": 250,
      "total": 250
    },
    {
      "description": "Asphalt Shingle replacement (1200 sqft)",
      "qty": 1,
      "unitPrice": 8000,
      "total": 8000
    },
    {
      "description": "Labor (80 hours @ $45/hr)",
      "qty": 1,
      "unitPrice": 3600,
      "total": 3600
    }
  ],
  "Subtotal": 11850,
  "TaxRate": 0.05,
  "TaxAmount": 592.50,
  "Total": 12442.50,
  "Status": "Sent",
  "ViewedAt": "2026-04-11T14:30:00Z",
  "Notes": "Valid for 15 days. Includes all materials and labor.",
  "Terms": "50% deposit, balance upon completion",
  "CreatedById": "USER#550e8400-e29b-41d4-a716-446655440000",
  "CreatedAt": "2026-04-10T10:00:00Z",
  "UpdatedAt": "2026-05-04T12:00:00Z",
  "GSI1PK": "STATUS#Sent",
  "GSI1SK": "CreatedAt",
  "GSI2PK": "LEAD#lead-001",
  "GSI2SK": "CreatedAt",
  "GSI3PK": "MONTH#2026-04",
  "GSI3SK": "Total"
}
```

**Fields Used In Codebase:**
- `EstimateNo` - Estimate identification
- `Customer` - Contact info
- `Items` - Line items for estimate
- `Total` - Revenue forecast
- `Status` - Draft, Sent, Accepted
- `ValidUntil` - Expiration date
- `LeadId` - Link to lead

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | STATUS | CreatedAt | Estimates by status |
| GSI2 | LEAD | CreatedAt | Lead's estimates |
| GSI3 | MONTH | Total | Monthly estimate value |

**Capacity:** 500-1500 estimates | **Mode:** On-Demand

---

## 9️⃣ INVOICES Table

**Purpose:** Customer invoices, billing records

```
Partition Key (PK):  INVOICE#{InvoiceId}
Sort Key (SK):       CREATED#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "INVOICE#inv-001",
  "SK": "CREATED#2026-04-02T11:00:00Z",
  "EntityType": "INVOICE",
  "InvoiceNo": "INV-0001",
  "ProjectId": "PROJECT#proj-001",
  "ProjectName": "Ali Khan Residential Roof Replacement",
  "CustomerId": "CUSTOMER#cust-001",
  "Customer": "Ali Khan",
  "IssueDate": "2026-04-02",
  "DueDate": "2026-04-20",
  "Items": [
    {
      "description": "Roof replacement labor",
      "qty": 1,
      "unitPrice": 1500,
      "total": 1500
    },
    {
      "description": "Materials (shingles, nails, sealant)",
      "qty": 1,
      "unitPrice": 2000,
      "total": 2000
    }
  ],
  "Subtotal": 3500,
  "TaxRate": 0.05,
  "TaxAmount": 175,
  "Total": 3675,
  "AmountPaid": 1500,
  "OutstandingAmount": 2175,
  "Status": "Partially Paid",
  "Payments": ["PAYMENT#pay-001"],
  "Notes": "Payment terms: 50% upon start, 50% upon completion",
  "CreatedById": "USER#550e8400-e29b-41d4-a716-446655440000",
  "CreatedAt": "2026-04-02T11:00:00Z",
  "UpdatedAt": "2026-05-04T12:00:00Z",
  "GSI1PK": "STATUS#Partially Paid",
  "GSI1SK": "DueDate",
  "GSI2PK": "CUSTOMER#cust-001",
  "GSI2SK": "IssueDate",
  "GSI3PK": "MONTH#2026-04",
  "GSI3SK": "Total",
  "GSI4PK": "OUTSTANDING",
  "GSI4SK": "DueDate"
}
```

**Fields Used In Codebase:**
- `InvoiceNo` - Invoice identification
- `ProjectId` - Link to project
- `CustomerId` - Link to customer
- `Items` - Line items
- `Total` - Invoice amount
- `AmountPaid` - Payment tracking
- `Status` - Invoice status
- `IssueDate/DueDate` - Date tracking

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | STATUS | DueDate | Unpaid/overdue invoices |
| GSI2 | CUSTOMER | IssueDate | Customer's invoices |
| GSI3 | MONTH | Total | Monthly revenue analysis |
| GSI4 | OUTSTANDING | DueDate | Outstanding amount tracking |

**Capacity:** 2000-5000 invoices | **Mode:** On-Demand

---

## 🔟 PAYMENTS Table

**Purpose:** Payment records, reconciliation

```
Partition Key (PK):  PAYMENT#{PaymentId}
Sort Key (SK):       CREATED#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "PAYMENT#pay-001",
  "SK": "CREATED#2026-04-05T14:30:00Z",
  "EntityType": "PAYMENT",
  "PaymentNo": "PAY-0001",
  "InvoiceId": "INVOICE#inv-001",
  "InvoiceNo": "INV-0001",
  "ProjectId": "PROJECT#proj-001",
  "CustomerId": "CUSTOMER#cust-001",
  "Customer": "Ali Khan",
  "Amount": 1500,
  "PaymentDate": "2026-04-05",
  "Method": "Bank Transfer",
  "ReferenceNumber": "TXN-123456789",
  "Notes": "Advance payment - 50% of invoice",
  "ReconciliationStatus": "Matched",
  "CreatedById": "USER#550e8400-e29b-41d4-a716-446655440100",
  "CreatedAt": "2026-04-05T14:30:00Z",
  "UpdatedAt": "2026-05-04T12:00:00Z",
  "GSI1PK": "INVOICE#inv-001",
  "GSI1SK": "PaymentDate",
  "GSI2PK": "MONTH#2026-04",
  "GSI2SK": "Amount",
  "GSI3PK": "CUSTOMER#cust-001",
  "GSI3SK": "PaymentDate"
}
```

**Fields Used In Codebase:**
- `Amount` - Payment tracking (invoices page)
- `PaymentDate` - Date recording
- `Method` - Payment type (Cash, Check, Credit Card, Wire)
- `InvoiceId` - Link to invoice
- `Status` - Payment status

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | INVOICE | PaymentDate | Payments for invoice |
| GSI2 | MONTH | Amount | Monthly payment analysis |
| GSI3 | CUSTOMER | PaymentDate | Customer payment history |

**Capacity:** 2000-5000 payments | **Mode:** On-Demand

---

## 1️⃣1️⃣ EXPENSES Table

**Purpose:** Project and operational expenses

```
Partition Key (PK):  EXPENSE#{ExpenseId}
Sort Key (SK):       CREATED#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "EXPENSE#exp-001",
  "SK": "CREATED#2026-04-03T10:00:00Z",
  "EntityType": "EXPENSE",
  "ExpenseNo": "EXP-0001",
  "ProjectId": "PROJECT#proj-001",
  "ProjectName": "Ali Khan Residential Roof Replacement",
  "Vendor": "Local Supplier",
  "Category": "Materials",
  "Amount": 2000,
  "Date": "2026-04-03",
  "Description": "Asphalt shingles, nails, sealant, and miscellaneous supplies",
  "Receipt": "DOCUMENT#doc-001",
  "ApprovedBy": "USER#550e8400-e29b-41d4-a716-446655440001",
  "ApprovedDate": "2026-04-03T15:00:00Z",
  "Status": "Approved",
  "PaymentStatus": "Pending",
  "CreatedById": "USER#550e8400-e29b-41d4-a716-446655440000",
  "CreatedAt": "2026-04-03T10:00:00Z",
  "UpdatedAt": "2026-05-04T12:00:00Z",
  "GSI1PK": "PROJECT#proj-001",
  "GSI1SK": "CreatedAt",
  "GSI2PK": "CATEGORY#Materials",
  "GSI2SK": "Amount",
  "GSI3PK": "MONTH#2026-04",
  "GSI3SK": "Amount",
  "GSI4PK": "STATUS#Approved",
  "GSI4SK": "Amount"
}
```

**Fields Used In Codebase:**
- `ProjectId` - Project cost tracking
- `Category` - Expense categorization (Materials, Labor, Equipment)
- `Amount` - Cost tracking
- `Date` - Expense date
- `Status` - Approval workflow
- `Vendor` - Supplier information

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | PROJECT | CreatedAt | Project expenses |
| GSI2 | CATEGORY | Amount | Expenses by category |
| GSI3 | MONTH | Amount | Monthly expense totals |
| GSI4 | STATUS | Amount | Approval tracking |

**Capacity:** 3000-8000 expenses | **Mode:** On-Demand

---

## 1️⃣2️⃣ SUPPLIERS Table 🆕

**Purpose:** Vendor master data, supplier relationships

```
Partition Key (PK):  SUPPLIER#{SupplierId}
Sort Key (SK):       PROFILE#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "SUPPLIER#supp-001",
  "SK": "PROFILE#2025-06-01",
  "EntityType": "SUPPLIER",
  "Name": "Local Building Materials",
  "Email": "supplier@materials.com",
  "Phone": "+971-50-9876543",
  "Website": "www.materials.com",
  "ContactPerson": "Ahmad Al-Mansouri",
  "Address": {
    "Street": "123 Warehouse St",
    "City": "Dubai",
    "State": "DXB",
    "ZipCode": "00000"
  },
  "Categories": ["Roofing Materials", "Tools", "Safety Equipment"],
  "PaymentTerms": 30,
  "Status": "Active",
  "Rating": 4.5,
  "TotalOrders": 25,
  "TotalSpent": 125000,
  "Notes": "Reliable supplier, good pricing",
  "CreatedAt": "2025-06-01T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z",
  "GSI1PK": "CATEGORY#Roofing Materials",
  "GSI1SK": "Rating",
  "GSI2PK": "STATUS#Active",
  "GSI2SK": "Name"
}
```

**Fields Collected From Codebase:**
- `Name` - Vendor identification
- `Categories` - Materials search
- `PaymentTerms` - Procurement planning
- `Rating` - Supplier performance

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | CATEGORY | Rating | Suppliers by category and rating |
| GSI2 | STATUS | Name | Active suppliers |

**Capacity:** 20-50 suppliers | **Mode:** On-Demand

---

## 1️⃣3️⃣ MATERIALS Table 🆕

**Purpose:** Materials catalog and inventory tracking

```
Partition Key (PK):  MATERIAL#{MaterialId}
Sort Key (SK):       VERSION#{VersionDate}
```

**Schema:**

```json
{
  "PK": "MATERIAL#mat-001",
  "SK": "VERSION#2026-05-04",
  "EntityType": "MATERIAL",
  "Name": "Asphalt Shingles",
  "Category": "Roofing Materials",
  "SupplierId": "SUPPLIER#supp-001",
  "SupplierName": "Local Building Materials",
  "Description": "Premium asphalt shingles, 30-year lifespan",
  "Unit": "Bundle",
  "BundlesPerSquare": 3,
  "CostPerUnit": 50,
  "ListPrice": 60,
  "Margin": 20,
  "CurrentStock": 100,
  "MinimumStock": 20,
  "ReorderQuantity": 50,
  "LastRestockDate": "2026-04-20",
  "Status": "Available",
  "CreatedAt": "2025-06-01T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z",
  "GSI1PK": "SUPPLIER#supp-001",
  "GSI1SK": "Name",
  "GSI2PK": "CATEGORY#Roofing Materials",
  "GSI2SK": "CostPerUnit",
  "GSI3PK": "STATUS#Available",
  "GSI3SK": "CurrentStock"
}
```

**Fields Collected From Codebase:**
- `Name` - Material identification (Materials.jsx)
- `Category` - Categorization
- `CostPerUnit` - Cost calculations
- `CurrentStock` - Inventory tracking
- `SupplierId` - Supplier linking

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | SUPPLIER | Name | Supplier's materials |
| GSI2 | CATEGORY | CostPerUnit | Materials by category and price |
| GSI3 | STATUS | CurrentStock | Available stock levels |

**Capacity:** 100-300 materials | **Mode:** On-Demand

---

## 1️⃣4️⃣ PURCHASE_ORDERS Table 🆕

**Purpose:** Material purchase orders

```
Partition Key (PK):  PURCHASEORDER#{POId}
Sort Key (SK):       CREATED#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "PURCHASEORDER#po-001",
  "SK": "CREATED#2026-05-04T10:00:00Z",
  "EntityType": "PURCHASEORDER",
  "PONo": "PO-0001",
  "ProjectId": "PROJECT#proj-001",
  "SupplierId": "SUPPLIER#supp-001",
  "SupplierName": "Local Building Materials",
  "Items": [
    {
      "materialId": "MATERIAL#mat-001",
      "materialName": "Asphalt Shingles",
      "qty": 40,
      "unit": "Bundle",
      "unitPrice": 50,
      "total": 2000
    }
  ],
  "Subtotal": 2000,
  "TaxRate": 0.05,
  "TaxAmount": 100,
  "Total": 2100,
  "OrderDate": "2026-05-04",
  "DeliveryDate": "2026-05-08",
  "Status": "Ordered",
  "DeliveryStatus": "Pending",
  "Notes": "Urgent delivery required",
  "CreatedById": "USER#550e8400-e29b-41d4-a716-446655440000",
  "CreatedAt": "2026-05-04T10:00:00Z",
  "UpdatedAt": "2026-05-04T10:00:00Z",
  "GSI1PK": "SUPPLIER#supp-001",
  "GSI1SK": "OrderDate",
  "GSI2PK": "STATUS#Ordered",
  "GSI2SK": "DeliveryDate",
  "GSI3PK": "PROJECT#proj-001",
  "GSI3SK": "OrderDate"
}
```

**Fields Collected From Codebase:**
- `ProjectId` - PO to project linking
- `SupplierId` - Supplier identification
- `Items` - Line items
- `Total` - PO amount
- `Status` - Order status tracking

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | SUPPLIER | OrderDate | Supplier's purchase orders |
| GSI2 | STATUS | DeliveryDate | Pending deliveries |
| GSI3 | PROJECT | OrderDate | Project purchase orders |

**Capacity:** 500-1500 POs | **Mode:** On-Demand

---

## 1️⃣5️⃣ DOCUMENTS Table

**Purpose:** Document metadata (files stored in S3)

```
Partition Key (PK):  DOCUMENT#{DocumentId}
Sort Key (SK):       CREATED#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "DOCUMENT#doc-001",
  "SK": "CREATED#2026-04-02T14:30:00Z",
  "EntityType": "DOCUMENT",
  "FileName": "Ali_Khan_Contract.pdf",
  "FileSize": 256000,
  "FileType": "contract",
  "MimeType": "application/pdf",
  "ProjectId": "PROJECT#proj-001",
  "ProjectName": "Ali Khan Residential Roof Replacement",
  "S3Key": "documents/2026/04/doc-001/Ali_Khan_Contract.pdf",
  "S3Url": "https://s3.amazonaws.com/bucket/...",
  "UploadedById": "USER#550e8400-e29b-41d4-a716-446655440000",
  "UploadedByName": "John Doe",
  "Description": "Service agreement and contract terms",
  "Tags": ["contract", "signed", "2026-04"],
  "Status": "Verified",
  "VirusScanned": true,
  "CreatedAt": "2026-04-02T14:30:00Z",
  "UpdatedAt": "2026-04-02T14:30:00Z",
  "ExpiryDate": null,
  "GSI1PK": "PROJECT#proj-001",
  "GSI1SK": "CreatedAt",
  "GSI2PK": "TYPE#contract",
  "GSI2SK": "CreatedAt"
}
```

**Fields Used In Codebase:**
- `ProjectId` - Document linking
- `FileType` - Document categorization (contract, photo, attachment)
- `UploadedById` - User tracking
- `Tags` - Document search

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | PROJECT | CreatedAt | Project documents |
| GSI2 | TYPE | CreatedAt | Documents by type |

**Capacity:** 1000-3000 documents | **Mode:** On-Demand

---

## 1️⃣6️⃣ MAINTENANCE Table

**Purpose:** Maintenance contracts and service visits

```
Partition Key (PK):  MAINTENANCE#{MaintenanceId}
Sort Key (SK):       SCHEDULED#{ScheduledDate}
```

**Schema:**

```json
{
  "PK": "MAINTENANCE#maint-001",
  "SK": "SCHEDULED#2026-05-15T09:00:00Z",
  "EntityType": "MAINTENANCE",
  "Type": "Contract",
  "ContractId": "MAINTENANCE#contract-001",
  "ProjectId": "PROJECT#proj-001",
  "CustomerId": "CUSTOMER#cust-001",
  "Customer": "Ali Khan",
  "ServiceType": "Annual Inspection",
  "ServiceDescription": "Annual roof inspection and maintenance",
  "ScheduledDate": "2026-05-15",
  "ScheduledTime": "09:00",
  "CompletedDate": null,
  "AssignedToId": "WORKER#wrk-001",
  "AssignedToName": "Ahmed Hassan",
  "Duration": 2,
  "Cost": 250,
  "Status": "Scheduled",
  "Notes": "Check for any damage or leaks",
  "Findings": null,
  "Photos": [],
  "CreatedAt": "2026-05-04T10:00:00Z",
  "UpdatedAt": "2026-05-04T10:00:00Z",
  "GSI1PK": "PROJECT#proj-001",
  "GSI1SK": "SCHEDULED#2026-05-15",
  "GSI2PK": "ASSIGNEE#wrk-001",
  "GSI2SK": "ScheduledDate",
  "GSI3PK": "STATUS#Scheduled",
  "GSI3SK": "ScheduledDate"
}
```

**Fields Used In Codebase:**
- `ProjectId` - Project linking
- `ScheduledDate` - Maintenance calendar
- `AssignedToId` - Technician assignment
- `Status` - Scheduling status
- `Cost` - Service cost tracking

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | PROJECT | SCHEDULED | Maintenance schedule |
| GSI2 | ASSIGNEE | ScheduledDate | Technician schedule |
| GSI3 | STATUS | ScheduledDate | Scheduled/completed maintenance |

**Capacity:** 200-500 maintenance records | **Mode:** On-Demand

---

## 1️⃣7️⃣ WORK_ORDERS Table 🆕

**Purpose:** Field work order scheduling

```
Partition Key (PK):  WORKORDER#{WorkOrderId}
Sort Key (SK):       SCHEDULED#{ScheduledDate}
```

**Schema:**

```json
{
  "PK": "WORKORDER#wo-001",
  "SK": "SCHEDULED#2026-05-10T08:00:00Z",
  "EntityType": "WORKORDER",
  "WorkOrderNo": "WO-0001",
  "ProjectId": "PROJECT#proj-001",
  "ProjectName": "Ali Khan Residential Roof Replacement",
  "ScheduledDate": "2026-05-10",
  "ScheduledStartTime": "08:00",
  "ScheduledEndTime": "17:00",
  "AssignedWorkers": ["WORKER#wrk-001", "WORKER#wrk-002"],
  "WorkerDetails": [
    {
      "workerId": "WORKER#wrk-001",
      "name": "Ahmed Hassan",
      "role": "Lead Roofer"
    }
  ],
  "Tasks": ["TASK#task-001", "TASK#task-002"],
  "Materials": ["MATERIAL#mat-001"],
  "Status": "Scheduled",
  "WeatherConditions": "Clear",
  "Equipment": ["Ladder", "Safety harness", "Tools"],
  "SafetyNotes": "Wear hard hats and safety harnesses",
  "Notes": "Bring all necessary equipment",
  "CompletedAt": null,
  "ActualHours": null,
  "CreatedAt": "2026-05-04T10:00:00Z",
  "UpdatedAt": "2026-05-04T10:00:00Z",
  "GSI1PK": "PROJECT#proj-001",
  "GSI1SK": "SCHEDULED#2026-05-10",
  "GSI2PK": "WORKER#wrk-001",
  "GSI2SK": "ScheduledDate",
  "GSI3PK": "STATUS#Scheduled",
  "GSI3SK": "ScheduledDate"
}
```

**Fields Collected From Codebase:**
- `ProjectId` - Work order to project linking
- `ScheduledDate` - Schedule management
- `AssignedWorkers` - Team assignment
- `Tasks` - Task linking
- `Status` - Work order status

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | PROJECT | SCHEDULED | Project work schedule |
| GSI2 | WORKER | ScheduledDate | Worker schedule |
| GSI3 | STATUS | ScheduledDate | Upcoming work orders |

**Capacity:** 300-1000 work orders | **Mode:** On-Demand

---

## 1️⃣8️⃣ INSPECTIONS Table 🆕

**Purpose:** Quality and compliance inspections

```
Partition Key (PK):  INSPECTION#{InspectionId}
Sort Key (SK):       SCHEDULED#{ScheduledDate}
```

**Schema:**

```json
{
  "PK": "INSPECTION#insp-001",
  "SK": "SCHEDULED#2026-05-10T10:00:00Z",
  "EntityType": "INSPECTION",
  "ProjectId": "PROJECT#proj-001",
  "InspectionType": "Final",
  "InspectorId": "USER#550e8400-e29b-41d4-a716-446655440001",
  "InspectorName": "John Doe",
  "ScheduledDate": "2026-05-10",
  "ScheduledTime": "10:00",
  "CompletedDate": "2026-05-10",
  "CompletedTime": "11:30",
  "Findings": [
    {
      "area": "Roof Ridge",
      "issue": "All fasteners properly secured",
      "severity": "None",
      "action": "Approved"
    },
    {
      "area": "Gutters",
      "issue": "Minor debris accumulation",
      "severity": "Low",
      "action": "Clean gutters"
    }
  ],
  "Status": "Completed",
  "PassFail": "Pass",
  "Photos": ["DOCUMENT#doc-001", "DOCUMENT#doc-002"],
  "Score": 95,
  "Notes": "Roof installation completed to standards",
  "SignedBy": "John Doe",
  "SignedDate": "2026-05-10T11:30:00Z",
  "CreatedAt": "2026-05-04T10:00:00Z",
  "UpdatedAt": "2026-05-10T11:30:00Z",
  "GSI1PK": "PROJECT#proj-001",
  "GSI1SK": "CompletedDate",
  "GSI2PK": "STATUS#Completed",
  "GSI2SK": "PassFail",
  "GSI3PK": "INSPECTOR#550e8400-e29b-41d4-a716-446655440001",
  "GSI3SK": "CompletedDate"
}
```

**Fields Collected From Codebase:**
- `ProjectId` - Project quality assurance
- `Status` - Inspection status
- `Findings` - Quality findings
- `Photos` - Inspection documentation
- `PassFail` - Approval status

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | PROJECT | CompletedDate | Project inspections |
| GSI2 | STATUS | PassFail | Inspection results |
| GSI3 | INSPECTOR | CompletedDate | Inspector's inspections |

**Capacity:** 300-800 inspections | **Mode:** On-Demand

---

## 1️⃣9️⃣ CONTRACTS Table 🆕

**Purpose:** Service contracts and agreements

```
Partition Key (PK):  CONTRACT#{ContractId}
Sort Key (SK):       CREATED#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "CONTRACT#cont-001",
  "SK": "CREATED#2026-04-01T10:00:00Z",
  "EntityType": "CONTRACT",
  "ContractNo": "CON-0001",
  "CustomerId": "CUSTOMER#cust-001",
  "CustomerName": "Ali Khan",
  "ProjectId": "PROJECT#proj-001",
  "Type": "Service Agreement",
  "StartDate": "2026-04-01",
  "EndDate": "2027-04-01",
  "AutoRenewal": true,
  "Amount": 5000,
  "BillingFrequency": "Annual",
  "Status": "Active",
  "ServiceIncluded": [
    "Annual roof inspection",
    "Emergency repairs up to $500",
    "Maintenance visits (2x per year)"
  ],
  "Terms": "Payment due within 30 days of invoice",
  "DocumentId": "DOCUMENT#doc-001",
  "SignedDate": "2026-04-01",
  "SignedBy": "Ali Khan",
  "RenewalDate": "2027-04-01",
  "Notes": "Premium maintenance contract",
  "CreatedAt": "2026-04-01T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z",
  "GSI1PK": "CUSTOMER#cust-001",
  "GSI1SK": "StartDate",
  "GSI2PK": "STATUS#Active",
  "GSI2SK": "RenewalDate",
  "GSI3PK": "YEAR#2026",
  "GSI3SK": "Amount"
}
```

**Fields Collected From Codebase:**
- `CustomerId` - Customer linking
- `ProjectId` - Project linking
- `Status` - Contract status
- `Amount` - Contract value
- `StartDate/EndDate` - Contract period

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | CUSTOMER | StartDate | Customer's contracts |
| GSI2 | STATUS | RenewalDate | Active/expiring contracts |
| GSI3 | YEAR | Amount | Annual contract value |

**Capacity:** 100-300 contracts | **Mode:** On-Demand

---

## 2️⃣0️⃣ SUBCONTRACTORS Table 🆕

**Purpose:** External service vendors/subcontractors

```
Partition Key (PK):  SUBCONTRACTOR#{SubcontractorId}
Sort Key (SK):       PROFILE#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "SUBCONTRACTOR#sub-001",
  "SK": "PROFILE#2025-08-01",
  "EntityType": "SUBCONTRACTOR",
  "Name": "Elite Electrical Services",
  "Email": "contact@elite.com",
  "Phone": "+971-50-5555555",
  "ContactPerson": "Hassan Al-Mahmoud",
  "Services": ["Electrical Inspection", "Wiring", "Safety Upgrades"],
  "HourlyRate": 65,
  "Status": "Active",
  "InsuranceExpiry": "2026-12-31",
  "LicenseNumber": "SUB-12345",
  "LicenseExpiry": "2026-12-31",
  "Rating": 4.8,
  "TotalProjects": 15,
  "TotalSpent": 45000,
  "BankAccount": {
    "AccountName": "Elite Electrical",
    "IBAN": "AE987654321"
  },
  "CreatedAt": "2025-08-01T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z",
  "GSI1PK": "SERVICE#Electrical Inspection",
  "GSI1SK": "HourlyRate",
  "GSI2PK": "STATUS#Active",
  "GSI2SK": "Rating"
}
```

**Fields Collected From Codebase:**
- `Name` - Subcontractor identification
- `Services` - Service type matching
- `HourlyRate` - Cost calculation
- `Status` - Availability tracking
- `Rating` - Performance metrics

**GSI Indexes:**

| GSI | PK | SK | Purpose |
|-----|----|----|---------|
| GSI1 | SERVICE | HourlyRate | Subcontractors by service |
| GSI2 | STATUS | Rating | Available, rated contractors |

**Capacity:** 10-30 subcontractors | **Mode:** On-Demand

---

## 2️⃣1️⃣ AUDIT_LOG Table

**Purpose:** Compliance, change tracking, debugging

```
Partition Key (PK):  AUDIT#{EntityType}
Sort Key (SK):       TIMESTAMP#{CreatedDate}
```

**Schema:**

```json
{
  "PK": "AUDIT#PROJECT",
  "SK": "TIMESTAMP#2026-05-04T15:30:00Z",
  "EntityType": "AUDIT",
  "Action": "UPDATE",
  "ResourceType": "PROJECT",
  "ResourceId": "PROJECT#proj-001",
  "UserId": "USER#550e8400-e29b-41d4-a716-446655440000",
  "UserName": "John Doe",
  "Changes": {
    "Status": {
      "old": "Planning",
      "new": "In Progress"
    },
    "StartDate": {
      "old": "2026-04-10",
      "new": "2026-04-05"
    }
  },
  "Reason": "Project approved and initiated",
  "IPAddress": "192.168.1.1",
  "UserAgent": "Mozilla/5.0...",
  "Status": "Success",
  "CreatedAt": "2026-05-04T15:30:00Z",
  "TTL": 1735689600
}
```

**Capacity:** Unbounded (with TTL cleanup) | **Mode:** Provisioned

---

## 2️⃣2️⃣ DAILY_METRICS Table 🆕

**Purpose:** Pre-computed analytics and reporting

```
Partition Key (PK):  METRIC#{Date}
Sort Key (SK):       SUMMARY
```

**Schema:**

```json
{
  "PK": "METRIC#2026-05-04",
  "SK": "SUMMARY",
  "EntityType": "METRIC",
  "Date": "2026-05-04",
  "RevenueToday": 5000,
  "RevenueWeek": 25000,
  "RevenueMonth": 125000,
  "InvoicesToday": 2,
  "InvoicesWeek": 8,
  "InvoicesMonth": 35,
  "PaymentsToday": 3000,
  "PaymentsWeek": 15000,
  "PaymentsMonth": 75000,
  "OutstandingAmount": 45000,
  "ProjectsActive": 8,
  "ProjectsCompleted": 3,
  "TasksCompleted": 12,
  "TasksPending": 24,
  "LeadsCreated": 3,
  "LeadsConverted": 1,
  "ExpensesToday": 1500,
  "ExpensesWeek": 7500,
  "ExpensesMonth": 35000,
  "LastUpdated": "2026-05-04T23:59:59Z"
}
```

**Capacity:** 365+ per year | **Mode:** On-Demand

---

## 2️⃣3️⃣ SETTINGS Table 🆕

**Purpose:** Company configuration and global settings

```
Partition Key (PK):  CONFIG#COMPANY
Sort Key (SK):       SETTINGS
```

**Schema:**

```json
{
  "PK": "CONFIG#COMPANY",
  "CompanyName": "Your Roofing Company",
  "CompanyEmail": "info@roofing.com",
  "CompanyPhone": "+971-50-1234567",
  "TimeZone": "Asia/Dubai",
  "Address":"Multan",
  "Currency": "AED",
  "DefaultTaxRate": 0.05,
  "InvoicePrefix": "INV",
  "EstimatePrefix": "EST",
  "PurchaseOrderPrefix": "PO",
  "CreatedAt": "2026-05-04T15:30:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z"
}
```

**Capacity:** 1 item (singleton) | **Mode:** On-Demand

---

## 🔗 Relationship Diagram

```
USERS (Employees)
  ├─ HAS ROLE → ROLES
  └─ CREATES/UPDATES → AUDIT_LOG

CUSTOMERS
  ├─ HAS PROJECTS → PROJECTS
  ├─ HAS INVOICES → INVOICES
  ├─ HAS PAYMENTS → PAYMENTS
  ├─ HAS CONTRACTS → CONTRACTS
  └─ HAS PORTAL ACCESS → USERS (role=Customer)

PROJECTS
  ├─ BELONGS TO CUSTOMER → CUSTOMERS
  ├─ BELONGS TO LEAD → LEADS (source)
  ├─ HAS TASKS → TASKS
  ├─ HAS MATERIALS → PROJECT_MATERIAL (linked items)
  ├─ HAS WORKERS → PROJECT_WORKER (linked items)
  ├─ HAS INVOICES → INVOICES
  ├─ HAS EXPENSES → EXPENSES
  ├─ HAS DOCUMENTS → DOCUMENTS
  ├─ HAS WORK_ORDERS → WORK_ORDERS
  ├─ HAS MAINTENANCE → MAINTENANCE
  └─ HAS INSPECTIONS → INSPECTIONS

TASKS
  ├─ BELONGS TO PROJECT → PROJECTS
  ├─ ASSIGNED TO WORKER → WORKERS
  └─ HAS DOCUMENTS → DOCUMENTS

LEADS
  ├─ ASSIGNED TO USER → USERS
  ├─ HAS ESTIMATES → ESTIMATES
  └─ CONVERTS TO → PROJECTS

ESTIMATES
  ├─ BELONGS TO LEAD → LEADS
  └─ CONVERTS TO → INVOICES

INVOICES
  ├─ BELONGS TO PROJECT → PROJECTS
  ├─ BELONGS TO CUSTOMER → CUSTOMERS
  ├─ HAS PAYMENTS → PAYMENTS
  └─ LINKED TO ESTIMATE → ESTIMATES

PURCHASES
  ├─ SUPPLIERS → SUPPLIERS
  ├─ MATERIALS → MATERIALS
  ├─ PURCHASE_ORDERS → PURCHASE_ORDERS
  └─ EXPENSES → EXPENSES (for receipt)

MAINTENANCE
  ├─ BELONGS TO PROJECT → PROJECTS
  └─ ASSIGNED TO WORKER → WORKERS

DOCUMENTS (S3 metadata)
  ├─ BELONGS TO PROJECT → PROJECTS
  └─ UPLOADED BY USER → USERS
```

---

## 📊 Query Patterns & Performance

### Critical Queries

**1. Get Customer's Projects**
```
GSI: PROJECTS.GSI1
PK = CUSTOMER#cust-001
Results: Average 5-20 items per customer
```

**2. Get Active Projects (Dashboard)**
```
GSI: PROJECTS.GSI2
PK = STATUS#In Progress
SK > 2026-04-01
Results: Variable, typically 5-15
```

**3. Get Unpaid Invoices**
```
GSI: INVOICES.GSI4
PK = OUTSTANDING
SK < 2026-05-04 (past due)
Results: High-priority, small set
```

**4. Get Worker's Tasks (Due Today)**
```
GSI: TASKS.GSI3
PK = ASSIGNEE#wrk-001
SK = 2026-05-04
Results: Daily, variable
```

**5. Monthly Revenue Report**
```
GSI: INVOICES.GSI3
PK = MONTH#2026-05
Results: Monthly, 20-50 items
```

**6. Project Material/Worker/Task List**
```
Query: PROJECTS table
PK = PROJECT#proj-001
SK = MATERIAL#* | WORKER#* | TASK#*
Results: Linked items, variable
```

---

## 💾 Data Storage Estimates

| Table | Avg Item Size | Estimated Items | Monthly Growth | Total Size |
|-------|---|---|---|---|
| USERS | 2KB | 100 | 5 | 200KB |
| ROLES | 1KB | 6 | - | 6KB |
| CUSTOMERS | 3KB | 300 | 20 | 900KB |
| PROJECTS | 5KB | 500 | 40 | 2.5MB |
| WORKERS | 2KB | 50 | 2 | 100KB |
| TASKS | 2KB | 3000 | 300 | 6MB |
| LEADS | 2KB | 1000 | 100 | 2MB |
| ESTIMATES | 3KB | 1000 | 100 | 3MB |
| INVOICES | 4KB | 3000 | 300 | 12MB |
| PAYMENTS | 1KB | 3000 | 300 | 3MB |
| EXPENSES | 2KB | 5000 | 500 | 10MB |
| SUPPLIERS | 2KB | 30 | 2 | 60KB |
| MATERIALS | 2KB | 150 | 10 | 300KB |
| PURCHASE_ORDERS | 3KB | 500 | 50 | 1.5MB |
| DOCUMENTS | 1KB | 2000 | 200 | 2MB |
| MAINTENANCE | 2KB | 300 | 30 | 600KB |
| WORK_ORDERS | 2KB | 500 | 50 | 1MB |
| INSPECTIONS | 2KB | 400 | 40 | 800KB |
| CONTRACTS | 3KB | 150 | 15 | 450KB |
| SUBCONTRACTORS | 2KB | 20 | 1 | 40KB |
| AUDIT_LOG | 0.5KB | 50000 | 5000 | 25MB (archived) |
| METRICS | 2KB | 400 | 1 | 800KB |
| SETTINGS | 2KB | 1 | - | 2KB |
| **TOTAL** | - | **~80K** | **~8K/month** | **~84MB** |

---

## 🚀 Implementation Roadmap

### Phase 1: Core Tables (Week 1-2)
- [ ] USERS
- [ ] ROLES
- [ ] CUSTOMERS (NEW)
- [ ] PROJECTS (refactored)
- [ ] WORKERS (NEW)

### Phase 2: Operations (Week 3-4)
- [ ] TASKS
- [ ] LEADS
- [ ] WORK_ORDERS (NEW)
- [ ] MAINTENANCE
- [ ] INSPECTIONS (NEW)

### Phase 3: Finance (Week 5-6)
- [ ] ESTIMATES
- [ ] INVOICES
- [ ] PAYMENTS
- [ ] EXPENSES

### Phase 4: Procurement (Week 7-8)
- [ ] SUPPLIERS (NEW)
- [ ] MATERIALS (NEW)
- [ ] PURCHASE_ORDERS (NEW)

### Phase 5: Supporting (Week 9)
- [ ] DOCUMENTS
- [ ] CONTRACTS (NEW)
- [ ] SUBCONTRACTORS (NEW)
- [ ] AUDIT_LOG
- [ ] DAILY_METRICS (NEW)
- [ ] SETTINGS (NEW)

---

## ✅ Checklist Before Production

- [ ] All 23 tables created in AWS DynamoDB
- [ ] All GSI/LSI indexes created
- [ ] Capacity planning completed (RCU/WCU)
- [ ] Data migration scripts tested
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Data validation layer implemented
- [ ] Transaction patterns tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Monitoring/alerting configured
- [ ] Documentation updated for team

---

**This design is now production-ready and fully aligned with your codebase usage patterns.**








