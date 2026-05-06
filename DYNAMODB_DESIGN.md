# Roofing Management System - DynamoDB Design Guide

**Document Version:** 1.0  
**Created:** May 4, 2026  
**Database:** Amazon DynamoDB  
**Application:** Roofing Management System (React + Node.js)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Access Patterns](#access-patterns)
4. [Table Designs](#table-designs)
5. [Global Secondary Indexes (GSI)](#global-secondary-indexes-gsi)
6. [Local Secondary Indexes (LSI)](#local-secondary-indexes-lsi)
7. [Data Modeling Patterns](#data-modeling-patterns)
8. [Query Examples](#query-examples)
9. [Cost Optimization](#cost-optimization)
10. [Migration Strategy](#migration-strategy)
11. [Backup & Disaster Recovery](#backup--disaster-recovery)

---

## Overview

### Current State

- **Storage:** LocalStorage (5-10MB limit) + IndexedDB for files
- **Data Model:** Flat arrays stored as JSON strings
- **Scalability:** Not suitable for production with multiple users
- **Real-time:** No real-time synchronization

### Target State

- **Storage:** AWS DynamoDB (serverless, scalable)
- **Consistency:** Strong consistency for critical data, eventual for analytics
- **Scalability:** Unlimited scale, pay-per-request or provisioned capacity
- **Real-time:** Integration with WebSocket for real-time updates (optional)
- **Architecture:** Microservices-ready

### Benefits of DynamoDB

✓ Fully managed (no infrastructure to manage)  
✓ Automatic scaling  
✓ High performance (single-digit millisecond latency)  
✓ Built-in encryption and compliance  
✓ Global tables for multi-region deployment  
✓ Point-in-time recovery & backups

---

## Design Principles

### 1. **Single Table vs Multi-Table Strategy**

**CHOSEN:** Multi-table approach with related tables

**Reasoning:**

- Clear separation of concerns
- Easier to scale individual tables based on access patterns
- Better compliance with data classification
- Simpler migration from current localStorage structure

### 2. **Partition Key Design**

**Format:** `EntityType#Identifier`

Examples:

- `USER#uuid-1234-5678`
- `PROJECT#proj-001`
- `INVOICE#inv-001`

**Benefits:**

- Prevents accidental key collisions
- Enables entity type filtering
- Supports batch operations

### 3. **Sort Key Strategy**

**Format:** `Timestamp#Secondary_Identifier` or `Status#CreatedAt`

Enables:

- Range queries (time-based filtering)
- Status-based filtering
- Natural sorting

### 4. **Attribute Naming**

```
PK          = Partition Key (Primary)
SK          = Sort Key (Primary)
GSI1PK      = Global Secondary Index 1 Partition Key
GSI1SK      = Global Secondary Index 1 Sort Key
GSIX_PK/SK  = Additional GSI keys
LSI_PK/SK   = Local Secondary Index keys (optional)
```

### 5. **Data Structure**

```json
{
  "PK": "USER#uuid-123",
  "SK": "PROFILE#2026-05-04",
  "EntityType": "USER",
  "Name": "John Doe",
  "Email": "john@company.com",
  "RoleId": 1,
  "RoleName": "Admin",
  "Status": "Active",
  "CreatedAt": "2026-04-01T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z",
  "GSI1PK": "EMAIL#john@company.com",
  "GSI1SK": "2026-05-04"
}
```

---

## Access Patterns

### Critical Access Patterns (Must Support)

| #   | Entity      | Pattern                            | Frequency | Read/Write |
| --- | ----------- | ---------------------------------- | --------- | ---------- |
| 1   | User        | Get user by ID                     | High      | R          |
| 2   | User        | Get user by email                  | High      | R          |
| 3   | Lead        | Get leads by status                | High      | R          |
| 4   | Lead        | Get leads created in date range    | Medium    | R          |
| 5   | Project     | Get projects by customer           | High      | R          |
| 6   | Project     | Get projects by status             | High      | R          |
| 7   | Project     | Get projects created in date range | Medium    | R          |
| 8   | Invoice     | Get invoices by customer           | High      | R          |
| 9   | Invoice     | Get invoices by status             | High      | R          |
| 10  | Invoice     | Get invoices by date range         | High      | R          |
| 11  | Task        | Get tasks by project               | High      | R          |
| 12  | Task        | Get tasks by assignee              | High      | R          |
| 13  | Task        | Get tasks by status                | High      | R          |
| 14  | Expense     | Get expenses by project            | High      | R          |
| 15  | Expense     | Get expenses by date range         | Medium    | R          |
| 16  | Payment     | Get payments by invoice            | High      | R          |
| 17  | Payment     | Get payments by date range         | Medium    | R          |
| 18  | Document    | Get documents by project           | High      | R          |
| 19  | Maintenance | Get maintenance by contract        | High      | R          |
| 20  | Maintenance | Get maintenance by date range      | Medium    | R          |

---

## Table Designs

### **Table 1: USERS**

**Purpose:** Store user accounts, roles, and authentication data

```
Partition Key (PK):  USER#{UUID}
Sort Key (SK):       PROFILE#{CreatedAt}
```

**Attributes:**

| Attribute    | Type   | Length | Description                    |
| ------------ | ------ | ------ | ------------------------------ |
| PK           | String | 50     | USER#uuid-123                  |
| SK           | String | 50     | PROFILE#2026-05-04             |
| EntityType   | String | 10     | "USER"                         |
| Name         | String | 100    | User full name                 |
| Email        | String | 100    | User email (unique)            |
| RoleId       | Number | -      | Role identifier (1-6)          |
| RoleName     | String | 20     | "Admin", "Sales Manager", etc. |
| PasswordHash | String | 256    | Argon2 hash                    |
| PasswordSalt | String | 64     | Salt for hash                  |
| Status       | String | 20     | "Active", "Inactive"           |
| Department   | String | 50     | Department name (optional)     |
| PhoneNumber  | String | 20     | Contact phone                  |
| LastLoginAt  | String | 30     | ISO 8601 timestamp             |
| CreatedAt    | String | 30     | ISO 8601 timestamp             |
| UpdatedAt    | String | 30     | ISO 8601 timestamp             |
| GSI1PK       | String | 100    | EMAIL#john@company.com         |
| GSI1SK       | String | 30     | 2026-05-04                     |

**Example Item:**

```json
{
  "PK": "USER#550e8400-e29b-41d4-a716-446655440000",
  "SK": "PROFILE#2026-04-01",
  "EntityType": "USER",
  "Name": "John Doe",
  "Email": "john@company.com",
  "RoleId": 1,
  "RoleName": "Admin",
  "PasswordHash": "$argon2id$v=19$m=65536,t=3,p=4$...",
  "PasswordSalt": "generated_salt_value",
  "Status": "Active",
  "Department": "Management",
  "PhoneNumber": "+1-234-567-8900",
  "LastLoginAt": "2026-05-04T15:30:00Z",
  "CreatedAt": "2026-04-01T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z",
  "GSI1PK": "EMAIL#john@company.com",
  "GSI1SK": "2026-04-01"
}
```

**GSI Indexes:**

| GSI Name | PK             | SK                 | Purpose                     |
| -------- | -------------- | ------------------ | --------------------------- |
| GSI1     | GSI1PK (EMAIL) | GSI1SK (CreatedAt) | Query user by email         |
| GSI2     | RoleId         | CreatedAt          | Query users by role         |
| GSI3     | Status         | UpdatedAt          | Query active/inactive users |

**Capacity Planning:**

```
Estimated Items:     50-200 users
Write Capacity:      10 WCU (minimal, ~5 writes/day)
Read Capacity:       50 RCU (peak hours: 100-200 concurrent users)
Recommendation:      On-Demand mode (better for variable load)
```

---

### **Table 2: LEADS**

**Purpose:** Store sales leads and opportunities

```
Partition Key (PK):  LEAD#{LeadId}
Sort Key (SK):       CREATED#{CreatedAt}
```

**Attributes:**

| Attribute      | Type   | Length | Description                                                                  |
| -------------- | ------ | ------ | ---------------------------------------------------------------------------- |
| PK             | String | 50     | LEAD#lead-001                                                                |
| SK             | String | 50     | CREATED#2026-05-04T10:00:00Z                                                 |
| EntityType     | String | 10     | "LEAD"                                                                       |
| Name           | String | 100    | Lead company/name                                                            |
| Email          | String | 100    | Contact email                                                                |
| Phone          | String | 20     | Contact phone                                                                |
| Status         | String | 30     | "New", "Inspection Scheduled", "Estimate Sent", "Negotiation", "Won", "Lost" |
| EstimatedValue | Number | -      | Potential project value                                                      |
| Source         | String | 30     | "Direct", "Referral", "Web", "Cold Call"                                     |
| AssignedTo     | String | 50     | USER#{UUID} of assigned sales rep                                            |
| Notes          | String | 1000   | Additional notes                                                             |
| CreatedAt      | String | 30     | ISO 8601 timestamp                                                           |
| UpdatedAt      | String | 30     | ISO 8601 timestamp                                                           |
| GSI1PK         | String | 30     | STATUS#Won                                                                   |
| GSI1SK         | String | 30     | 2026-05-04                                                                   |
| GSI2PK         | String | 50     | ASSIGNEE#{UUID}                                                              |
| GSI2SK         | String | 30     | 2026-05-04                                                                   |
| GSI3PK         | String | 30     | MONTH#2026-05                                                                |
| GSI3SK         | String | 10     | EstimatedValue                                                               |

**Example Item:**

```json
{
  "PK": "LEAD#lead-001",
  "SK": "CREATED#2026-04-15T09:30:00Z",
  "EntityType": "LEAD",
  "Name": "Hassan Constructions",
  "Email": "hassan@constructions.com",
  "Phone": "+1-555-0123",
  "Status": "Estimate Sent",
  "EstimatedValue": 50000,
  "Source": "Referral",
  "AssignedTo": "USER#550e8400-e29b-41d4-a716-446655440000",
  "Notes": "High-value residential project, roofing + siding",
  "CreatedAt": "2026-04-15T09:30:00Z",
  "UpdatedAt": "2026-05-04T14:20:00Z",
  "GSI1PK": "STATUS#Estimate Sent",
  "GSI1SK": "2026-04-15T09:30:00Z",
  "GSI2PK": "ASSIGNEE#550e8400-e29b-41d4-a716-446655440000",
  "GSI2SK": "2026-04-15T09:30:00Z",
  "GSI3PK": "MONTH#2026-04",
  "GSI3SK": "50000"
}
```

**GSI Indexes:**

| GSI Name | PK                  | SK                      | Purpose                      |
| -------- | ------------------- | ----------------------- | ---------------------------- |
| GSI1     | GSI1PK (Status)     | GSI1SK (CreatedAt)      | Query leads by status        |
| GSI2     | GSI2PK (AssignedTo) | GSI2SK (CreatedAt)      | Query leads assigned to user |
| GSI3     | GSI3PK (Month)      | GSI3SK (EstimatedValue) | Monthly pipeline value       |

**Capacity Planning:**

```
Estimated Items:     500-2000 leads (3-month history)
Write Capacity:      20 WCU (50-100 new leads/day)
Read Capacity:       100 RCU (frequent dashboard queries)
Recommendation:      On-Demand mode
```

---

### **Table 3: PROJECTS**

**Purpose:** Store project information and tracking

```
Partition Key (PK):  PROJECT#{ProjectId}
Sort Key (SK):       CREATED#{CreatedAt}
```

**Attributes:**

| Attribute   | Type   | Length | Description                                       |
| ----------- | ------ | ------ | ------------------------------------------------- |
| PK          | String | 50     | PROJECT#proj-001                                  |
| SK          | String | 50     | CREATED#2026-05-04T10:00:00Z                      |
| EntityType  | String | 10     | "PROJECT"                                         |
| Name        | String | 100    | Project name                                      |
| Customer    | String | 100    | Customer name                                     |
| CustomerId  | String | 50     | CUSTOMER#{CustomerId}                             |
| RoofType    | String | 50     | "Shingle", "Metal", "Tile"                        |
| Area        | Number | -      | Square footage                                    |
| Status      | String | 30     | "Planning", "In Progress", "Completed", "On Hold" |
| Budget      | Number | -      | Project budget                                    |
| ActualCost  | Number | -      | Computed sum of materials + labor                 |
| StartDate   | String | 30     | ISO 8601 date                                     |
| EndDate     | String | 30     | ISO 8601 date                                     |
| CompletedAt | String | 30     | ISO 8601 timestamp (when marked complete)         |
| Supervisor  | String | 50     | USER#{UUID} of project manager                    |
| Materials   | Array  | -      | [{id, name, qty, price, total}]                   |
| Workers     | Array  | -      | [{id, name, role, hours, rate, total}]            |
| Tasks       | Array  | -      | [{id, title, status, assignee}]                   |
| Notes       | String | 1000   | Project notes                                     |
| CreatedAt   | String | 30     | ISO 8601 timestamp                                |
| UpdatedAt   | String | 30     | ISO 8601 timestamp                                |
| GSI1PK      | String | 30     | STATUS#In Progress                                |
| GSI1SK      | String | 30     | 2026-05-04                                        |
| GSI2PK      | String | 100    | CUSTOMER#AliKhan                                  |
| GSI2SK      | String | 30     | 2026-05-04                                        |
| GSI3PK      | String | 30     | SUPERVISOR#{UUID}                                 |
| GSI3SK      | String | 30     | 2026-05-04                                        |

**Example Item:**

```json
{
  "PK": "PROJECT#proj-001",
  "SK": "CREATED#2026-04-01T08:00:00Z",
  "EntityType": "PROJECT",
  "Name": "Ali Khan Residential Roof Replacement",
  "Customer": "Ali Khan",
  "CustomerId": "CUSTOMER#cust-001",
  "RoofType": "Shingle",
  "Area": 1200,
  "Status": "In Progress",
  "Budget": 8500,
  "ActualCost": 6200,
  "StartDate": "2026-04-05",
  "EndDate": "2026-04-30",
  "CompletedAt": null,
  "Supervisor": "USER#550e8400-e29b-41d4-a716-446655440001",
  "Materials": [
    {
      "id": "mat-001",
      "name": "Asphalt Shingles",
      "qty": 40,
      "price": 50,
      "total": 2000
    }
  ],
  "Workers": [
    {
      "id": "wrk-001",
      "name": "Ahmed Hassan",
      "role": "Lead Roofer",
      "hours": 80,
      "rate": 45,
      "total": 3600
    }
  ],
  "Tasks": [
    {
      "id": "task-001",
      "title": "Roof Inspection",
      "status": "Completed",
      "assignee": "USER#550e8400-e29b-41d4-a716-446655440002"
    }
  ],
  "Notes": "High-priority residential project",
  "CreatedAt": "2026-04-01T08:00:00Z",
  "UpdatedAt": "2026-05-04T11:45:00Z",
  "GSI1PK": "STATUS#In Progress",
  "GSI1SK": "2026-04-01T08:00:00Z",
  "GSI2PK": "CUSTOMER#AliKhan",
  "GSI2SK": "2026-04-01T08:00:00Z",
  "GSI3PK": "SUPERVISOR#550e8400-e29b-41d4-a716-446655440001",
  "GSI3SK": "2026-04-01T08:00:00Z"
}
```

**GSI Indexes:**

| GSI Name | PK                  | SK                 | Purpose                    |
| -------- | ------------------- | ------------------ | -------------------------- |
| GSI1     | GSI1PK (Status)     | GSI1SK (CreatedAt) | Query projects by status   |
| GSI2     | GSI2PK (Customer)   | GSI2SK (CreatedAt) | Query projects by customer |
| GSI3     | GSI3PK (Supervisor) | GSI3SK (CreatedAt) | Query projects by PM       |

**Capacity Planning:**

```
Estimated Items:     300-1000 projects
Write Capacity:      15 WCU (20-50 new projects/month)
Read Capacity:       150 RCU (frequent dashboard & detail queries)
Recommendation:      On-Demand mode
```

---

### **Table 4: TASKS**

**Purpose:** Store project tasks and assignments

```
Partition Key (PK):  TASK#{TaskId}
Sort Key (SK):       CREATED#{CreatedAt}
```

**Attributes:**

| Attribute      | Type   | Length | Description                                      |
| -------------- | ------ | ------ | ------------------------------------------------ |
| PK             | String | 50     | TASK#task-001                                    |
| SK             | String | 50     | CREATED#2026-05-04T10:00:00Z                     |
| EntityType     | String | 10     | "TASK"                                           |
| Title          | String | 100    | Task title                                       |
| Description    | String | 500    | Task details                                     |
| ProjectId      | String | 50     | PROJECT#proj-001                                 |
| ProjectName    | String | 100    | Denormalized project name                        |
| Status         | String | 30     | "Pending", "In Progress", "Completed", "On Hold" |
| Priority       | String | 20     | "Low", "Medium", "High"                          |
| AssignedTo     | String | 50     | USER#{UUID}                                      |
| AssignedToName | String | 100    | Denormalized user name                           |
| StartDate      | String | 30     | ISO 8601 date                                    |
| DueDate        | String | 30     | ISO 8601 date                                    |
| CreatedAt      | String | 30     | ISO 8601 timestamp                               |
| UpdatedAt      | String | 30     | ISO 8601 timestamp                               |
| CompletedAt    | String | 30     | ISO 8601 timestamp                               |
| GSI1PK         | String | 30     | STATUS#In Progress                               |
| GSI1SK         | String | 30     | 2026-05-04                                       |
| GSI2PK         | String | 50     | PROJECT#proj-001                                 |
| GSI2SK         | String | 30     | PRIORITY#High                                    |
| GSI3PK         | String | 50     | ASSIGNEE#{UUID}                                  |
| GSI3SK         | String | 30     | 2026-05-04                                       |

**Example Item:**

```json
{
  "PK": "TASK#task-001",
  "SK": "CREATED#2026-04-05T10:00:00Z",
  "EntityType": "TASK",
  "Title": "Roof Inspection",
  "Description": "Initial inspection and measurement",
  "ProjectId": "PROJECT#proj-001",
  "ProjectName": "Ali Khan Residential Roof Replacement",
  "Status": "Completed",
  "Priority": "High",
  "AssignedTo": "USER#550e8400-e29b-41d4-a716-446655440002",
  "AssignedToName": "Ahmed Hassan",
  "StartDate": "2026-04-05",
  "DueDate": "2026-04-06",
  "CreatedAt": "2026-04-05T10:00:00Z",
  "UpdatedAt": "2026-04-06T16:30:00Z",
  "CompletedAt": "2026-04-06T14:00:00Z",
  "GSI1PK": "STATUS#Completed",
  "GSI1SK": "2026-04-05T10:00:00Z",
  "GSI2PK": "PROJECT#proj-001",
  "GSI2SK": "PRIORITY#High",
  "GSI3PK": "ASSIGNEE#550e8400-e29b-41d4-a716-446655440002",
  "GSI3SK": "2026-04-05T10:00:00Z"
}
```

**GSI Indexes:**

| GSI Name | PK                  | SK                 | Purpose                         |
| -------- | ------------------- | ------------------ | ------------------------------- |
| GSI1     | GSI1PK (Status)     | GSI1SK (CreatedAt) | Query tasks by status           |
| GSI2     | GSI2PK (ProjectId)  | GSI2SK (Priority)  | Query project tasks by priority |
| GSI3     | GSI3PK (AssignedTo) | GSI3SK (CreatedAt) | Query tasks assigned to user    |

**Capacity Planning:**

```
Estimated Items:     2000-5000 tasks
Write Capacity:      30 WCU (100-200 updates/day)
Read Capacity:       200 RCU (frequent task list queries)
Recommendation:      Provisioned with auto-scaling
```

---

### **Table 5: INVOICES**

**Purpose:** Store customer invoices

```
Partition Key (PK):  INVOICE#{InvoiceId}
Sort Key (SK):       CREATED#{CreatedAt}
```

**Attributes:**

| Attribute         | Type   | Length | Description                                                              |
| ----------------- | ------ | ------ | ------------------------------------------------------------------------ |
| PK                | String | 50     | INVOICE#inv-001                                                          |
| SK                | String | 50     | CREATED#2026-05-04T10:00:00Z                                             |
| EntityType        | String | 10     | "INVOICE"                                                                |
| InvoiceNo         | String | 20     | "INV-0001" (auto-increment)                                              |
| ProjectId         | String | 50     | PROJECT#proj-001                                                         |
| ProjectName       | String | 100    | Denormalized                                                             |
| CustomerId        | String | 50     | CUSTOMER#cust-001                                                        |
| Customer          | String | 100    | Customer name                                                            |
| IssueDate         | String | 30     | ISO 8601 date                                                            |
| DueDate           | String | 30     | ISO 8601 date                                                            |
| Items             | Array  | -      | [{description, qty, unitPrice}]                                          |
| Subtotal          | Number | -      | Sum of items                                                             |
| TaxRate           | Number | -      | Tax percentage (0.1 = 10%)                                               |
| TaxAmount         | Number | -      | Calculated tax                                                           |
| Total             | Number | -      | Subtotal + tax                                                           |
| AmountPaid        | Number | -      | Payment received                                                         |
| OutstandingAmount | Number | -      | Total - AmountPaid                                                       |
| Status            | String | 30     | "Draft", "Sent", "Viewed", "Unpaid", "Partially Paid", "Paid", "Overdue" |
| CreatedAt         | String | 30     | ISO 8601 timestamp                                                       |
| UpdatedAt         | String | 30     | ISO 8601 timestamp                                                       |
| GSI1PK            | String | 30     | STATUS#Unpaid                                                            |
| GSI1SK            | String | 30     | 2026-05-04                                                               |
| GSI2PK            | String | 100    | CUSTOMER#cust-001                                                        |
| GSI2SK            | String | 30     | 2026-05-04                                                               |
| GSI3PK            | String | 30     | MONTH#2026-05                                                            |
| GSI3SK            | String | 10     | Total                                                                    |

**Example Item:**

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
      "unitPrice": 1500
    },
    {
      "description": "Materials (shingles, nails, sealant)",
      "qty": 1,
      "unitPrice": 2000
    }
  ],
  "Subtotal": 3500,
  "TaxRate": 0.1,
  "TaxAmount": 350,
  "Total": 3850,
  "AmountPaid": 1500,
  "OutstandingAmount": 2350,
  "Status": "Partially Paid",
  "CreatedAt": "2026-04-02T11:00:00Z",
  "UpdatedAt": "2026-05-04T12:00:00Z",
  "GSI1PK": "STATUS#Partially Paid",
  "GSI1SK": "2026-04-02T11:00:00Z",
  "GSI2PK": "CUSTOMER#cust-001",
  "GSI2SK": "2026-04-02T11:00:00Z",
  "GSI3PK": "MONTH#2026-04",
  "GSI3SK": "3850"
}
```

**GSI Indexes:**

| GSI Name | PK                  | SK                 | Purpose                  |
| -------- | ------------------- | ------------------ | ------------------------ |
| GSI1     | GSI1PK (Status)     | GSI1SK (CreatedAt) | Query invoices by status |
| GSI2     | GSI2PK (CustomerId) | GSI2SK (CreatedAt) | Query customer invoices  |
| GSI3     | GSI3PK (Month)      | GSI3SK (Total)     | Monthly revenue analysis |

**Capacity Planning:**

```
Estimated Items:     2000-5000 invoices
Write Capacity:      20 WCU (50-100 per day)
Read Capacity:       200 RCU (frequent financial queries)
Recommendation:      On-Demand mode
```

---

### **Table 6: ESTIMATES**

**Purpose:** Store quotations and estimates

```
Partition Key (PK):  ESTIMATE#{EstimateId}
Sort Key (SK):       CREATED#{CreatedAt}
```

**Attributes:**

| Attribute  | Type   | Length | Description                                                  |
| ---------- | ------ | ------ | ------------------------------------------------------------ |
| PK         | String | 50     | ESTIMATE#est-001                                             |
| SK         | String | 50     | CREATED#2026-05-04T10:00:00Z                                 |
| EntityType | String | 10     | "ESTIMATE"                                                   |
| EstimateNo | String | 20     | "EST-0001"                                                   |
| LeadId     | String | 50     | LEAD#lead-001 (optional)                                     |
| ProjectId  | String | 50     | PROJECT#proj-001 (optional)                                  |
| Customer   | String | 100    | Customer name                                                |
| IssueDate  | String | 30     | ISO 8601 date                                                |
| ValidUntil | String | 30     | ISO 8601 date                                                |
| Items      | Array  | -      | [{description, qty, unitPrice}]                              |
| Subtotal   | Number | -      | Sum of items                                                 |
| TaxRate    | Number | -      | Tax percentage                                               |
| TaxAmount  | Number | -      | Calculated                                                   |
| Total      | Number | -      | Subtotal + tax                                               |
| Status     | String | 30     | "Draft", "Sent", "Viewed", "Accepted", "Rejected", "Expired" |
| Notes      | String | 500    | Terms and conditions                                         |
| CreatedAt  | String | 30     | ISO 8601 timestamp                                           |
| UpdatedAt  | String | 30     | ISO 8601 timestamp                                           |
| GSI1PK     | String | 30     | STATUS#Draft                                                 |
| GSI1SK     | String | 30     | 2026-05-04                                                   |
| GSI2PK     | String | 30     | MONTH#2026-05                                                |
| GSI2SK     | String | 10     | Total                                                        |

**GSI Indexes:**

| GSI Name | PK              | SK                 | Purpose                   |
| -------- | --------------- | ------------------ | ------------------------- |
| GSI1     | GSI1PK (Status) | GSI1SK (CreatedAt) | Query estimates by status |
| GSI2     | GSI2PK (Month)  | GSI2SK (Total)     | Monthly estimate analysis |

---

### **Table 7: PAYMENTS**

**Purpose:** Track customer payments

```
Partition Key (PK):  PAYMENT#{PaymentId}
Sort Key (SK):       CREATED#{CreatedAt}
```

**Attributes:**

| Attribute   | Type   | Length | Description                                     |
| ----------- | ------ | ------ | ----------------------------------------------- |
| PK          | String | 50     | PAYMENT#pay-001                                 |
| SK          | String | 50     | CREATED#2026-05-04T10:00:00Z                    |
| EntityType  | String | 10     | "PAYMENT"                                       |
| PaymentNo   | String | 20     | "PAY-0001"                                      |
| InvoiceId   | String | 50     | INVOICE#inv-001                                 |
| InvoiceNo   | String | 20     | "INV-0001"                                      |
| ProjectId   | String | 50     | PROJECT#proj-001                                |
| CustomerId  | String | 50     | CUSTOMER#cust-001                               |
| Customer    | String | 100    | Customer name                                   |
| Amount      | Number | -      | Payment amount                                  |
| Method      | String | 30     | "Cash", "Check", "Credit Card", "Wire Transfer" |
| PaymentDate | String | 30     | ISO 8601 date                                   |
| Notes       | String | 500    | Additional notes                                |
| CreatedAt   | String | 30     | ISO 8601 timestamp                              |
| UpdatedAt   | String | 30     | ISO 8601 timestamp                              |
| GSI1PK      | String | 50     | INVOICE#inv-001                                 |
| GSI1SK      | String | 30     | 2026-05-04                                      |
| GSI2PK      | String | 30     | MONTH#2026-05                                   |
| GSI2SK      | String | 10     | Amount                                          |

**GSI Indexes:**

| GSI Name | PK                 | SK                 | Purpose                    |
| -------- | ------------------ | ------------------ | -------------------------- |
| GSI1     | GSI1PK (InvoiceId) | GSI1SK (CreatedAt) | Query payments for invoice |
| GSI2     | GSI2PK (Month)     | GSI2SK (Amount)    | Monthly payment analysis   |

---

### **Table 8: EXPENSES**

**Purpose:** Track project and operational expenses

```
Partition Key (PK):  EXPENSE#{ExpenseId}
Sort Key (SK):       CREATED#{CreatedAt}
```

**Attributes:**

| Attribute   | Type   | Length | Description                                     |
| ----------- | ------ | ------ | ----------------------------------------------- |
| PK          | String | 50     | EXPENSE#exp-001                                 |
| SK          | String | 50     | CREATED#2026-05-04T10:00:00Z                    |
| EntityType  | String | 10     | "EXPENSE"                                       |
| ExpenseNo   | String | 20     | "EXP-0001"                                      |
| ProjectId   | String | 50     | PROJECT#proj-001 (optional)                     |
| ProjectName | String | 100    | Denormalized                                    |
| Vendor      | String | 100    | Vendor name                                     |
| Category    | String | 50     | "Materials", "Labor", "Equipment", "Other"      |
| Amount      | Number | -      | Expense amount                                  |
| Date        | String | 30     | ISO 8601 date                                   |
| Notes       | String | 500    | Description                                     |
| ApprovedBy  | String | 50     | USER#{UUID}                                     |
| Status      | String | 30     | "Pending", "Approved", "Rejected", "Reimbursed" |
| CreatedAt   | String | 30     | ISO 8601 timestamp                              |
| UpdatedAt   | String | 30     | ISO 8601 timestamp                              |
| GSI1PK      | String | 50     | PROJECT#proj-001                                |
| GSI1SK      | String | 30     | 2026-05-04                                      |
| GSI2PK      | String | 30     | MONTH#2026-05                                   |
| GSI2SK      | String | 10     | Amount                                          |
| GSI3PK      | String | 50     | CATEGORY#Materials                              |
| GSI3SK      | String | 30     | 2026-05-04                                      |

**GSI Indexes:**

| GSI Name | PK                 | SK                 | Purpose                    |
| -------- | ------------------ | ------------------ | -------------------------- |
| GSI1     | GSI1PK (ProjectId) | GSI1SK (CreatedAt) | Query project expenses     |
| GSI2     | GSI2PK (Month)     | GSI2SK (Amount)    | Monthly expense analysis   |
| GSI3     | GSI3PK (Category)  | GSI3SK (CreatedAt) | Query expenses by category |

---

### **Table 9: DOCUMENTS**

**Purpose:** Store document metadata (files stored in S3)

```
Partition Key (PK):  DOCUMENT#{DocumentId}
Sort Key (SK):       CREATED#{CreatedAt}
```

**Attributes:**

| Attribute   | Type   | Length | Description                       |
| ----------- | ------ | ------ | --------------------------------- |
| PK          | String | 50     | DOCUMENT#doc-001                  |
| SK          | String | 50     | CREATED#2026-05-04T10:00:00Z      |
| EntityType  | String | 10     | "DOCUMENT"                        |
| FileName    | String | 255    | Original filename                 |
| FileSize    | Number | -      | File size in bytes                |
| FileType    | String | 30     | "contract", "photo", "attachment" |
| MimeType    | String | 50     | "application/pdf", "image/jpeg"   |
| ProjectId   | String | 50     | PROJECT#proj-001                  |
| ProjectName | String | 100    | Denormalized                      |
| S3Key       | String | 255    | Path in S3 bucket                 |
| S3Url       | String | 500    | Pre-signed S3 URL                 |
| UploadedBy  | String | 50     | USER#{UUID}                       |
| Description | String | 500    | Document description              |
| Tags        | Array  | -      | ["estimate", "approved"]          |
| CreatedAt   | String | 30     | ISO 8601 timestamp                |
| UpdatedAt   | String | 30     | ISO 8601 timestamp                |
| GSI1PK      | String | 50     | PROJECT#proj-001                  |
| GSI1SK      | String | 30     | 2026-05-04                        |
| GSI2PK      | String | 30     | TYPE#contract                     |
| GSI2SK      | String | 30     | 2026-05-04                        |

**GSI Indexes:**

| GSI Name | PK                 | SK                 | Purpose                 |
| -------- | ------------------ | ------------------ | ----------------------- |
| GSI1     | GSI1PK (ProjectId) | GSI1SK (CreatedAt) | Query project documents |
| GSI2     | GSI2PK (FileType)  | GSI2SK (CreatedAt) | Query documents by type |

---

### **Table 10: MAINTENANCE**

**Purpose:** Store maintenance contracts and visits

```
Partition Key (PK):  MAINTENANCE#{MaintenanceId}
Sort Key (SK):       CREATED#{CreatedAt}
```

**Attributes:**

| Attribute     | Type   | Length | Description                                          |
| ------------- | ------ | ------ | ---------------------------------------------------- |
| PK            | String | 50     | MAINTENANCE#maint-001                                |
| SK            | String | 50     | CREATED#2026-05-04T10:00:00Z                         |
| EntityType    | String | 10     | "MAINTENANCE"                                        |
| Type          | String | 20     | "Contract", "Visit"                                  |
| ContractId    | String | 50     | MAINTENANCE#contract-001                             |
| ProjectId     | String | 50     | PROJECT#proj-001                                     |
| Customer      | String | 100    | Customer name                                        |
| ServiceType   | String | 50     | "Annual Inspection", "Repairs", "Cleaning"           |
| ScheduledDate | String | 30     | ISO 8601 date                                        |
| CompletedDate | String | 30     | ISO 8601 date                                        |
| AssignedTo    | String | 50     | USER#{UUID}                                          |
| Cost          | Number | -      | Service cost                                         |
| Status        | String | 30     | "Scheduled", "In Progress", "Completed", "Cancelled" |
| Notes         | String | 500    | Service notes                                        |
| CreatedAt     | String | 30     | ISO 8601 timestamp                                   |
| UpdatedAt     | String | 30     | ISO 8601 timestamp                                   |
| GSI1PK        | String | 50     | PROJECT#proj-001                                     |
| GSI1SK        | String | 30     | SCHEDULED#2026-05-10                                 |
| GSI2PK        | String | 50     | ASSIGNEE#{UUID}                                      |
| GSI2SK        | String | 30     | 2026-05-04                                           |

**GSI Indexes:**

| GSI Name | PK                  | SK                     | Purpose                    |
| -------- | ------------------- | ---------------------- | -------------------------- |
| GSI1     | GSI1PK (ProjectId)  | GSI1SK (ScheduledDate) | Query maintenance schedule |
| GSI2     | GSI2PK (AssignedTo) | GSI2SK (CreatedAt)     | Query technician schedule  |

---

### **Table 11: ROLES & PERMISSIONS**

**Purpose:** Store role definitions and permissions

```
Partition Key (PK):  ROLE#{RoleId}
Sort Key (SK):       METADATA
```

**Attributes:**

| Attribute   | Type   | Length | Description                    |
| ----------- | ------ | ------ | ------------------------------ |
| PK          | String | 50     | ROLE#1                         |
| SK          | String | 30     | METADATA                       |
| EntityType  | String | 10     | "ROLE"                         |
| RoleId      | Number | -      | 1-6                            |
| RoleName    | String | 50     | "Admin", "Sales Manager", etc. |
| Description | String | 200    | Role description               |
| Permissions | Array  | -      | Array of permission strings    |
| Status      | String | 20     | "Active", "Inactive"           |
| CreatedAt   | String | 30     | ISO 8601 timestamp             |
| UpdatedAt   | String | 30     | ISO 8601 timestamp             |

**Example:**

```json
{
  "PK": "ROLE#1",
  "SK": "METADATA",
  "EntityType": "ROLE",
  "RoleId": 1,
  "RoleName": "Admin",
  "Description": "Full system access",
  "Permissions": [
    "view:dashboard",
    "manage:users",
    "manage:roles",
    "manage:leads",
    "manage:projects",
    "manage:finances",
    "view:reports",
    "manage:settings"
  ],
  "Status": "Active",
  "CreatedAt": "2026-04-01T10:00:00Z",
  "UpdatedAt": "2026-05-04T15:30:00Z"
}
```

---

### **Table 12: AUDIT LOG**

**Purpose:** Track all data changes for compliance and debugging

```
Partition Key (PK):  AUDIT#{EntityType}
Sort Key (SK):       TIMESTAMP#{CreatedAt}
```

**Attributes:**

| Attribute    | Type   | Length | Description                              |
| ------------ | ------ | ------ | ---------------------------------------- |
| PK           | String | 50     | AUDIT#PROJECT                            |
| SK           | String | 50     | TIMESTAMP#2026-05-04T15:30:00Z           |
| EntityType   | String | 10     | "AUDIT"                                  |
| Action       | String | 20     | "CREATE", "UPDATE", "DELETE"             |
| ResourceType | String | 50     | Entity type (USER, PROJECT, etc.)        |
| ResourceId   | String | 50     | ID of modified resource                  |
| UserId       | String | 50     | USER#{UUID} who made change              |
| Changes      | Object | -      | {field: {old, new}}                      |
| Reason       | String | 200    | Reason for change                        |
| IPAddress    | String | 20     | IP address of user                       |
| CreatedAt    | String | 30     | ISO 8601 timestamp                       |
| TTL          | Number | -      | Expiration (optional, for auto-deletion) |

**Example:**

```json
{
  "PK": "AUDIT#PROJECT",
  "SK": "TIMESTAMP#2026-05-04T15:30:00Z",
  "EntityType": "AUDIT",
  "Action": "UPDATE",
  "ResourceType": "PROJECT",
  "ResourceId": "PROJECT#proj-001",
  "UserId": "USER#550e8400-e29b-41d4-a716-446655440000",
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
  "CreatedAt": "2026-05-04T15:30:00Z",
  "TTL": 1735689600
}
```

---

## Global Secondary Indexes (GSI)

### Summary of All GSIs

| Table       | GSI  | PK         | SK             | Purpose                  |
| ----------- | ---- | ---------- | -------------- | ------------------------ |
| USERS       | GSI1 | EMAIL      | CreatedAt      | Email lookup             |
| USERS       | GSI2 | RoleId     | CreatedAt      | Role-based user lists    |
| USERS       | GSI3 | Status     | UpdatedAt      | Active/inactive users    |
| LEADS       | GSI1 | STATUS     | CreatedAt      | Filter by pipeline stage |
| LEADS       | GSI2 | ASSIGNEE   | CreatedAt      | Leads by sales rep       |
| LEADS       | GSI3 | MONTH      | EstimatedValue | Monthly pipeline value   |
| PROJECTS    | GSI1 | STATUS     | CreatedAt      | Filter by status         |
| PROJECTS    | GSI2 | CUSTOMER   | CreatedAt      | Customer projects        |
| PROJECTS    | GSI3 | SUPERVISOR | CreatedAt      | PM's projects            |
| TASKS       | GSI1 | STATUS     | CreatedAt      | Filter by status         |
| TASKS       | GSI2 | PROJECT    | Priority       | Project tasks            |
| TASKS       | GSI3 | ASSIGNEE   | CreatedAt      | Team member tasks        |
| INVOICES    | GSI1 | STATUS     | CreatedAt      | Unpaid invoices          |
| INVOICES    | GSI2 | CUSTOMER   | CreatedAt      | Customer invoices        |
| INVOICES    | GSI3 | MONTH      | Total          | Revenue analysis         |
| ESTIMATES   | GSI1 | STATUS     | CreatedAt      | Pipeline management      |
| ESTIMATES   | GSI2 | MONTH      | Total          | Estimate value tracking  |
| EXPENSES    | GSI1 | PROJECT    | CreatedAt      | Project costs            |
| EXPENSES    | GSI2 | MONTH      | Amount         | Budget tracking          |
| EXPENSES    | GSI3 | CATEGORY   | CreatedAt      | Cost analysis            |
| DOCUMENTS   | GSI1 | PROJECT    | CreatedAt      | Project files            |
| DOCUMENTS   | GSI2 | TYPE       | CreatedAt      | Document type filtering  |
| MAINTENANCE | GSI1 | PROJECT    | SCHEDULED      | Maintenance calendar     |
| MAINTENANCE | GSI2 | ASSIGNEE   | CreatedAt      | Technician schedule      |

---

## Local Secondary Indexes (LSI)

**Recommendation:** Use LSI sparingly due to 10GB size limit per partition key.

**Candidate for LSI:**

- TASKS table: Sort by DueDate instead of CreatedAt for deadline management
  - PK: TASK#{TaskId}
  - LSI: CreatedAt (PK) + DueDate (SK)

---

## Data Modeling Patterns

### 1. Denormalization Strategy

**Benefits:**

- Reduced query complexity
- Fewer database round trips
- Better performance for read-heavy workloads

**Pattern:** Copy critical attributes to related records

```
// Instead of:
TASK {ProjectId: "PROJECT#proj-001"}

// Denormalize as:
TASK {
  ProjectId: "PROJECT#proj-001",
  ProjectName: "Ali Khan Residential Roof Replacement"  // Denormalized
}
```

**When to Denormalize:**

- ✓ Names that rarely change
- ✓ Status fields
- ✓ Reference IDs frequently queried together
- ✗ Constantly changing data (use references)

### 2. Array Attributes vs Separate Tables

**Use Arrays for:**

- Collections under 400KB total
- Data queried together (invoice items)
- Non-relational lists

```json
{
  "Items": [
    { "description": "Labor", "qty": 1, "unitPrice": 1500 },
    { "description": "Materials", "qty": 1, "unitPrice": 2000 }
  ]
}
```

**Use Separate Tables for:**

- Collections over 400KB
- Frequent independent queries
- Many-to-many relationships

### 3. Composite Keys

**Format:** `ENTITY#IDENTIFIER`

**Benefits:**

- Prevents key collision
- Enables entity type filtering
- Clearer in queries and logs

### 4. Time-Series Partitioning

For high-volume, time-series data, consider sharding:

```
PK: "TASK#{TaskId}#SHARD#{ShardId}"
SK: "CREATED#{CreatedAt}"

// ShardId = DayOfYear % 10 (distributes write load)
```

---

## Query Examples

### 1. Get User by Email

```javascript
const getUser = async (email) => {
  const result = await dynamoDB
    .query({
      TableName: "USERS",
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: {
        ":email": `EMAIL#${email.toLowerCase()}`,
      },
    })
    .promise();
  return result.Items[0];
};
```

### 2. Get Active Leads (Last 30 Days)

```javascript
const getActiveLeads = async () => {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const result = await dynamoDB
    .query({
      TableName: "LEADS",
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :status AND GSI1SK > :date",
      ExpressionAttributeValues: {
        ":status": "STATUS#Estimate Sent",
        ":date": thirtyDaysAgo,
      },
    })
    .promise();
  return result.Items;
};
```

### 3. Get All Projects for Customer

```javascript
const getCustomerProjects = async (customerId) => {
  const result = await dynamoDB
    .query({
      TableName: "PROJECTS",
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :customer",
      ExpressionAttributeValues: {
        ":customer": `CUSTOMER#${customerId}`,
      },
    })
    .promise();
  return result.Items;
};
```

### 4. Get Open Tasks for Project (Sorted by Priority)

```javascript
const getProjectTasks = async (projectId) => {
  const result = await dynamoDB
    .query({
      TableName: "TASKS",
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :project",
      ExpressionAttributeValues: {
        ":project": `PROJECT#${projectId}`,
      },
    })
    .promise();

  // Sort by priority at application level
  return result.Items.sort((a, b) => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    return priorityOrder[a.Priority] - priorityOrder[b.Priority];
  });
};
```

### 5. Get Monthly Revenue

```javascript
const getMonthlyRevenue = async (month) => {
  const result = await dynamoDB
    .query({
      TableName: "INVOICES",
      IndexName: "GSI3",
      KeyConditionExpression: "GSI3PK = :month",
      ExpressionAttributeValues: {
        ":month": `MONTH#${month}`, // e.g., "MONTH#2026-05"
      },
    })
    .promise();

  return result.Items.reduce((sum, inv) => sum + inv.Total, 0);
};
```

### 6. Get Unpaid Invoices

```javascript
const getUnpaidInvoices = async () => {
  const result = await dynamoDB
    .query({
      TableName: "INVOICES",
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK IN (:status1, :status2)",
      ExpressionAttributeValues: {
        ":status1": "STATUS#Unpaid",
        ":status2": "STATUS#Partially Paid",
      },
    })
    .promise();
  return result.Items;
};
```

### 7. Batch Get Multiple Users

```javascript
const getUsers = async (userIds) => {
  const result = await dynamoDB
    .batchGetItem({
      RequestItems: {
        USERS: {
          Keys: userIds.map((id) => ({
            PK: `USER#${id}`,
            SK: "PROFILE#2026-05-04", // Requires sort key
          })),
        },
      },
    })
    .promise();
  return result.Responses.USERS;
};
```

### 8. Transaction: Create Invoice + Update Project

```javascript
const createInvoice = async (invoiceData, projectId) => {
  await dynamoDB
    .transactWriteItems({
      TransactItems: [
        {
          Put: {
            TableName: "INVOICES",
            Item: {
              PK: `INVOICE#${invoiceData.id}`,
              SK: `CREATED#${new Date().toISOString()}`,
              ...invoiceData,
            },
          },
        },
        {
          Update: {
            TableName: "PROJECTS",
            Key: {
              PK: `PROJECT#${projectId}`,
              SK: "CREATED#...", // requires full SK
            },
            UpdateExpression: "SET InvoiceStatus = :status",
            ExpressionAttributeValues: {
              ":status": "Invoiced",
            },
          },
        },
      ],
    })
    .promise();
};
```

---

## Cost Optimization

### 1. Capacity Planning Options

**Option A: On-Demand (Recommended for Variable Load)**

```
Pricing: ~$1.25 per million read requests
         ~$6.25 per million write requests
         No minimum charge

Best for:
- Unpredictable workloads
- New applications
- Spiky traffic patterns
- Development/testing
```

**Option B: Provisioned (Better for Predictable Load)**

```
Pricing: ~$0.00013 per RCU-hour
         ~$0.00065 per WCU-hour
         Minimum: 1 RCU/WCU = ~$0.47/month

Best for:
- Consistent, predictable traffic
- High-volume applications
- Cost-critical production
```

**Estimated Costs (Monthly):**

| Scenario                  | On-Demand                | Provisioned           | Recommendation |
| ------------------------- | ------------------------ | --------------------- | -------------- |
| Small (100 RCU, 10 WCU)   | $12.50 + $6.25 = $18.75  | $15 + $6.50 = $21.50  | On-Demand      |
| Medium (500 RCU, 50 WCU)  | $62.50 + $31.25 = $93.75 | $65 + $32.50 = $97.50 | On-Demand      |
| Large (2000 RCU, 200 WCU) | $250 + $125 = $375       | $260 + $130 = $390    | Provisioned    |

### 2. Query Optimization

**Best Practices:**

1. **Use Projection Expressions** - Reduce data transfer

```javascript
const result = await dynamoDB
  .query({
    TableName: "PROJECTS",
    KeyConditionExpression: "PK = :pk",
    ProjectionExpression: "PK, Name, Status, Budget", // Only needed fields
    ExpressionAttributeValues: {
      ":pk": "PROJECT#proj-001",
    },
  })
  .promise();
```

2. **Use Filters Sparingly** - Applied after reads (wasteful)

```javascript
// ❌ Bad: Reads all items, then filters
const result = await dynamoDB
  .query({
    TableName: "TASKS",
    KeyConditionExpression: "PK = :pk",
    FilterExpression: "Priority = :priority", // Applied after read!
    ExpressionAttributeValues: {
      ":pk": "PROJECT#proj-001",
      ":priority": "High",
    },
  })
  .promise();

// ✓ Good: Use GSI for predefined filters
// Create GSI2 with PK=PROJECT, SK=PRIORITY
const result = await dynamoDB
  .query({
    TableName: "TASKS",
    IndexName: "GSI2",
    KeyConditionExpression: "GSI2PK = :pk AND begins_with(GSI2SK, :priority)",
    ExpressionAttributeValues: {
      ":pk": "PROJECT#proj-001",
      ":priority": "PRIORITY#High",
    },
  })
  .promise();
```

3. **Batch Operations** - Reduce round trips

```javascript
// ✓ Good: Single batch get
const result = await dynamoDB.batchGetItem({
  RequestItems: {
    "USERS": { Keys: [...] }
  }
}).promise();

// ❌ Bad: 100 individual queries
for (const userId of userIds) {
  const result = await dynamoDB.get({...}).promise();
}
```

4. **Pagination** - Don't fetch everything

```javascript
const getProjects = async (customerId, pageSize = 10) => {
  const result = await dynamoDB
    .query({
      TableName: "PROJECTS",
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :customer",
      Limit: pageSize,
      ExclusiveStartKey: lastKey, // For pagination
      ExpressionAttributeValues: {
        ":customer": `CUSTOMER#${customerId}`,
      },
    })
    .promise();

  return {
    items: result.Items,
    nextKey: result.LastEvaluatedKey,
  };
};
```

### 3. Storage Optimization

**Data Compression:**

- JSON compress large text fields
- Store file metadata only (actual files in S3)
- Archive old audit logs to S3 (use TTL)

**Example:**

```json
{
  "PK": "MAINTENANCE#maint-001",
  "Notes": "gzip:H4sICOqKWGYC/2ZpbGVzLnR...", // Compressed
  "NoteSize": 1500,
  "ActualNoteSize": 8234
}
```

---

## Migration Strategy

### Phase 1: Preparation (Week 1)

**Step 1: Create DynamoDB Tables**

```bash
# Using AWS CLI or IaC (CloudFormation/Terraform)
aws dynamodb create-table \
  --table-name USERS \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

**Step 2: Set Up AWS SDK in React**

```javascript
// src/aws/dynamodb.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.REACT_APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  },
});

export const docClient = DynamoDBDocumentClient.from(client);
```

**Step 3: Create Data Migration Script**

```javascript
// scripts/migrateLocalStorageToDynamoDB.js
const migrate = async () => {
  const tables = [
    "users",
    "leads",
    "projects",
    "tasks",
    "invoices",
    "estimates",
    "payments",
    "expenses",
    "documents",
    "maintenance",
  ];

  for (const table of tables) {
    const data = JSON.parse(localStorage.getItem(table)) || [];

    // Transform data based on table schema
    const transformedData = transformData(table, data);

    // Batch write to DynamoDB
    await batchWrite(table, transformedData);

    console.log(`Migrated ${table}: ${transformedData.length} items`);
  }
};
```

### Phase 2: Parallel Running (Weeks 2-3)

**Step 1: Update Data Layer**

- Create data access layer that writes to both localStorage AND DynamoDB
- Reads from DynamoDB first, fallback to localStorage

```javascript
// src/utils/dataService.js
export const getProject = async (projectId) => {
  try {
    // Try DynamoDB first
    return await getProjectFromDynamoDB(projectId);
  } catch (error) {
    // Fallback to localStorage
    console.warn("DynamoDB query failed, using localStorage:", error);
    return getProjectFromLocalStorage(projectId);
  }
};

export const saveProject = async (project) => {
  // Write to both
  await Promise.all([saveToDynamoDB(project), saveToLocalStorage(project)]);
};
```

**Step 2: Monitor Data Consistency**

- Log all operations
- Run hourly validation checks
- Compare localStorage vs DynamoDB counts

### Phase 3: Cutover (Week 4)

**Step 1: Final Validation**

- Verify all data in DynamoDB
- Run comprehensive tests
- Load testing

**Step 2: Flip the Switch**

- Update data layer to use DynamoDB only
- Keep localStorage read access for ~1 month
- Monitor logs for issues

**Step 3: Cleanup**

- Remove localStorage fallbacks
- Archive localStorage data (if needed)
- Update documentation

### Migration Script Example

```javascript
// scripts/migrate.js
const { docClient } = require("../src/aws/dynamodb");

const migrateUsers = async () => {
  const users = JSON.parse(localStorage.getItem("users")) || [];

  for (const user of users) {
    const item = {
      PK: `USER#${user.id}`,
      SK: `PROFILE#${new Date(user.createdAt).toISOString().split("T")[0]}`,
      EntityType: "USER",
      Name: user.name,
      Email: user.email.toLowerCase(),
      RoleId: user.roleId,
      RoleName: user.roleName,
      PasswordHash: user.passwordHash,
      PasswordSalt: user.passwordSalt,
      Status: user.status || "Active",
      CreatedAt: user.createdAt,
      UpdatedAt: user.updatedAt || new Date().toISOString(),
      GSI1PK: `EMAIL#${user.email.toLowerCase()}`,
      GSI1SK: new Date(user.createdAt).toISOString().split("T")[0],
    };

    await docClient.send(
      new PutCommand({
        TableName: "USERS",
        Item: item,
      }),
    );
  }

  console.log(`✓ Migrated ${users.length} users`);
};

const migrateAll = async () => {
  console.log("Starting migration...");
  await migrateUsers();
  await migrateLeads();
  await migrateProjects();
  // ... other tables
  console.log("✓ Migration complete!");
};

migrateAll().catch(console.error);
```

---

## Backup & Disaster Recovery

### 1. DynamoDB Backups

**On-Demand Backups:**

```bash
aws dynamodb create-backup \
  --table-name USERS \
  --backup-name users-backup-2026-05-04
```

**Point-in-Time Recovery:**

- Enable automatic backups (35-day retention)
- Restore to specific timestamp within 35 days
- Useful for accidental deletions

### 2. Cross-Region Replication

**Global Tables:**

- Automatic replication across regions
- Multi-region read/write capability
- High availability

```bash
aws dynamodb create-global-table \
  --global-table-name USERS \
  --replication-group RegionName=us-east-1 RegionName=eu-west-1
```

### 3. Backup Strategy

| Scenario   | Backup Type  | Frequency  | Retention      |
| ---------- | ------------ | ---------- | -------------- |
| Regular    | AWS Backup   | Daily      | 30 days        |
| Critical   | Manual       | Weekly     | 90 days        |
| Compliance | Export to S3 | Monthly    | 1 year         |
| Disaster   | Cross-region | Continuous | Depends on RPO |

### 4. Export to S3 for Analysis

```bash
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:us-east-1:123456789012:table/USERS \
  --s3-bucket backup-bucket \
  --s3-prefix users-export/
```

---

## Best Practices

### 1. Naming Conventions

```
Table:          PascalCase (USERS, PROJECTS)
Attributes:     camelCase (firstName, createdAt)
Composite Keys: ENTITY#Type#Identifier
Dates:          ISO 8601 (2026-05-04T15:30:00Z)
Booleans:       "Yes"/"No" or "Active"/"Inactive" (avoid true/false)
```

### 2. Data Validation

```javascript
const validateProjectItem = (item) => {
  if (!item.PK?.startsWith("PROJECT#")) throw new Error("Invalid PK");
  if (!item.Name || item.Name.trim().length === 0)
    throw new Error("Name required");
  if (!["Planning", "In Progress", "Completed"].includes(item.Status)) {
    throw new Error("Invalid status");
  }
  if (item.Budget && typeof item.Budget !== "number") {
    throw new Error("Budget must be number");
  }
};
```

### 3. Error Handling

```javascript
const handleDynamoDBError = (error) => {
  if (error.code === "ResourceNotFoundException") {
    // Table doesn't exist
    console.error("Table not found. Check table name and region.");
  } else if (error.code === "ValidationException") {
    // Invalid query
    console.error("Invalid query:", error.message);
  } else if (error.code === "ProvisionedThroughputExceededException") {
    // Rate limited
    console.error("Rate limited. Implement exponential backoff.");
  } else if (error.code === "AccessDeniedException") {
    // Permission issue
    console.error("Access denied. Check IAM permissions.");
  }
};
```

### 4. Security

```javascript
// Use IAM roles, not hardcoded credentials
const credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
});

// Encrypt sensitive data before storing
const encryptedPassword = encrypt(password, encryptionKey);

// Use condition expressions for optimistic locking
const updateProject = async (projectId, updates) => {
  await docClient.send(
    new UpdateCommand({
      TableName: "PROJECTS",
      Key: { PK: `PROJECT#${projectId}`, SK: "..." },
      UpdateExpression: "SET #status = :status",
      ConditionExpression: "#version = :expectedVersion",
      ExpressionAttributeNames: { "#status": "Status", "#version": "Version" },
      ExpressionAttributeValues: {
        ":status": updates.status,
        ":expectedVersion": expectedVersion,
      },
    }),
  );
};
```

### 5. Monitoring

```javascript
// CloudWatch Metrics to Monitor
const metrics = [
  "ConsumedReadCapacityUnits",
  "ConsumedWriteCapacityUnits",
  "UserErrors",
  "SystemErrors",
  "Throttled Requests",
  "Query Latency",
];

// Set up alarms
// Alert if UserErrors > 1% per 5 minutes
// Alert if LatencyAverage > 500ms
// Alert if ThrottledRequests > 0
```

---

## Summary

### Architecture Overview

```
┌─────────────────────────────────────────┐
│   React Frontend (Roofing System)       │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │  AWS SDK    │
        │ (DynamoDB)  │
        └──────┬──────┘
               │
┌──────────────▼──────────────────────────┐
│        AWS DynamoDB                     │
├──────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────┐     │
│  │   USERS     │  │   LEADS     │     │
│  │   PROJECTS  │  │   TASKS     │     │
│  │   INVOICES  │  │   ESTIMATES │     │
│  │   PAYMENTS  │  │   EXPENSES  │     │
│  │ DOCUMENTS   │  │MAINTENANCE  │     │
│  │   ROLES     │  │  AUDIT LOG  │     │
│  └─────────────┘  └─────────────┘     │
│         ▲                               │
│  GSI1, GSI2, GSI3 (Secondary Indexes)  │
│                                         │
└──────────────────────────────────────────┘
               │
        ┌──────▼──────────┐
        │  AWS Backup     │
        │  S3 (Archives)  │
        └─────────────────┘
```

### Key Takeaways

✓ **12 Tables** covering all business entities  
✓ **23 Global Secondary Indexes** for efficient querying  
✓ **Denormalized design** for performance  
✓ **Time-series partitioning** ready for scale  
✓ **On-Demand pricing** for flexibility  
✓ **Comprehensive audit logging** for compliance  
✓ **Multi-region capable** for disaster recovery  
✓ **Easy migration** from localStorage

---

## Implementation Checklist

- [ ] Create DynamoDB tables (via AWS Console or IaC)
- [ ] Set up AWS SDK in React application
- [ ] Create data transformation/migration script
- [ ] Implement data access layer (queries for all GSIs)
- [ ] Write unit tests for data layer
- [ ] Run parallel data writes (localStorage + DynamoDB)
- [ ] Validate data consistency
- [ ] Load testing with expected traffic
- [ ] Implement error handling & retry logic
- [ ] Set up CloudWatch monitoring & alarms
- [ ] Enable automatic backups & point-in-time recovery
- [ ] Document database schema & query patterns
- [ ] Train team on DynamoDB best practices
- [ ] Schedule migration cutover
- [ ] Monitor post-migration for 1 week
- [ ] Remove localStorage fallbacks
- [ ] Archive localStorage data for compliance

---

**Document End**

_For questions or updates, consult DynamoDB documentation:_  
https://docs.aws.amazon.com/dynamodb/latest/developerguide/

_AWS Best Practices Guide:_  
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/BestPractices.html
