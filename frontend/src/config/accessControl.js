// src/config/accessControl.js

export const ROLE = {
  ADMIN: "Admin",
  SALES: "Sales Manager",
  PM: "Project Manager",
  WORKER: "Worker",
  ACCOUNTANT: "Accountant",
  CUSTOMER: "Customer",
};

export const ROLES = ROLE;

/**
 * IMPORTANT:
 * Rules are checked in order. Put more specific prefixes first.
 */
const rules = [
  // ----- Settings (Admin only)
  { prefix: "/settings", roles: [ROLE.ADMIN] },

  // ----- Customer Portal (customer only)
  { prefix: "/portal", roles: [ROLE.CUSTOMER] },

  // ----- Maintenance (industry: PM manages contracts, worker executes visits)
  { prefix: "/maintenance/contracts", roles: [ROLE.ADMIN, ROLE.PM] },
  { prefix: "/maintenance/visits", roles: [ROLE.ADMIN, ROLE.PM, ROLE.WORKER] },
  { prefix: "/maintenance", roles: [ROLE.ADMIN, ROLE.PM, ROLE.WORKER] },

  // ----- Finance
  // Sales: estimates only
  { prefix: "/finance/estimates", roles: [ROLE.ADMIN, ROLE.SALES, ROLE.ACCOUNTANT] },

  // Accountant: invoices/payments/expenses
  { prefix: "/finance/invoices", roles: [ROLE.ADMIN, ROLE.ACCOUNTANT] },
  { prefix: "/finance/payments", roles: [ROLE.ADMIN, ROLE.ACCOUNTANT] },
  { prefix: "/finance/expenses", roles: [ROLE.ADMIN, ROLE.ACCOUNTANT] },

  // Finance root (so sales/accountant can open /finance and get redirected)
  { prefix: "/finance", roles: [ROLE.ADMIN, ROLE.ACCOUNTANT, ROLE.SALES] },

  // ----- Operations
  // Teams/subcontractors: Admin/PM only
  { prefix: "/operations/teams", roles: [ROLE.ADMIN, ROLE.PM] },
  { prefix: "/operations/subcontractors", roles: [ROLE.ADMIN, ROLE.PM] },

  // Tasks/calendar: Admin/PM/Worker (worker updates status only at UI level later)
  { prefix: "/operations/tasks", roles: [ROLE.ADMIN, ROLE.PM, ROLE.WORKER] },
  { prefix: "/operations/calendar", roles: [ROLE.ADMIN, ROLE.PM, ROLE.WORKER] },

  { prefix: "/operations", roles: [ROLE.ADMIN, ROLE.PM] },

  // ----- CRM (Sales + PM + Admin)
  { prefix: "/leads", roles: [ROLE.ADMIN, ROLE.SALES, ROLE.PM] },
  { prefix: "/opportunities", roles: [ROLE.ADMIN, ROLE.SALES, ROLE.PM] },
  { prefix: "/customers", roles: [ROLE.ADMIN, ROLE.SALES, ROLE.PM] },

  // ----- Projects (fine-grained)
  // PM/Admin: can access schedule/inspections/work orders
  { prefix: "/projects/schedule", roles: [ROLE.ADMIN, ROLE.PM] },
  { prefix: "/projects/inspections", roles: [ROLE.ADMIN, ROLE.PM] },
  { prefix: "/projects/work-orders", roles: [ROLE.ADMIN, ROLE.PM] },

  // Base projects access:
  // - PM/Admin full
  // - Worker read-only (UI level later)
  // - Accountant read-only (useful for finance context)
  { prefix: "/projects", roles: [ROLE.ADMIN, ROLE.PM, ROLE.WORKER, ROLE.ACCOUNTANT] },

  // ----- Inventory
  // PM: read/write, Accountant: read (UI level later), Admin: full
  { prefix: "/inventory", roles: [ROLE.ADMIN, ROLE.PM, ROLE.ACCOUNTANT] },

  // ----- Documents
  // Worker: only photos/attachments (NOT contracts)
  { prefix: "/documents/contracts", roles: [ROLE.ADMIN, ROLE.PM] },
  { prefix: "/documents/photos", roles: [ROLE.ADMIN, ROLE.PM, ROLE.WORKER] },
  { prefix: "/documents/attachments", roles: [ROLE.ADMIN, ROLE.PM, ROLE.WORKER] },
  { prefix: "/documents", roles: [ROLE.ADMIN, ROLE.PM] },

  // ----- Reports (read)
  { prefix: "/reports", roles: [ROLE.ADMIN, ROLE.PM, ROLE.ACCOUNTANT, ROLE.SALES] },

  // ----- Analytics (Sales should NOT)
  { prefix: "/analytics", roles: [ROLE.ADMIN, ROLE.PM, ROLE.ACCOUNTANT] },

  // ----- Legacy route protection (important!)
  // You have /workers route in AppRoutes; without a rule it was allowed to everyone.
  { prefix: "/workers", roles: [ROLE.ADMIN, ROLE.PM] },
];

export function canAccessPath(pathname, roleName) {
  if (!roleName) return false;
  if (roleName === ROLE.ADMIN) return true;

  // Always allow dashboard/home for logged-in users
  if (pathname === "/") return true;

  const rule = rules.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix));

  // Keep your current behavior to avoid breaking unknown legacy routes
  if (!rule) return true;

  return rule.roles.includes(roleName);
}

export function canAccessPrefix(prefix, roleName) {
  return canAccessPath(prefix, roleName);
}