import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCustomerProjects, getCustomerProjectIdSet } from "../../utils/customerScope";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const calcInvoiceTotal = (inv) => {
  const items = inv?.items || [];
  const taxRate = Number(inv?.taxRate || 0);
  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  return subtotal + subtotal * taxRate;
};

export default function PortalDashboard() {
  const { user } = useAuth();

  const projects = useMemo(() => JSON.parse(localStorage.getItem("projects")) || [], []);
  const invoices = useMemo(() => JSON.parse(localStorage.getItem("invoices")) || [], []);

  const myProjects = useMemo(() => getCustomerProjects(projects, user), [projects, user]);
  const myProjectIds = useMemo(() => getCustomerProjectIdSet(projects, user), [projects, user]);

  const myInvoices = useMemo(
    () => invoices.filter((inv) => myProjectIds.has(String(inv.projectId))),
    [invoices, myProjectIds]
  );

  const stats = useMemo(() => {
    const totalProjects = myProjects.length;
    const activeProjects = myProjects.filter((p) => String(p.status) !== "Completed").length;

    const totalInvoiced = myInvoices.reduce((s, inv) => s + calcInvoiceTotal(inv), 0);
    const paid = myInvoices.reduce((s, inv) => s + Number(inv.amountPaid || 0), 0);
    const outstanding = Math.max(0, totalInvoiced - paid);

    return { totalProjects, activeProjects, totalInvoiced, paid, outstanding };
  }, [myProjects, myInvoices]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Welcome, {user?.name}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500">My Projects</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {stats.totalProjects}
          </p>
          <p className="text-xs text-gray-500 mt-1">Active: {stats.activeProjects}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500">Paid</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(stats.paid)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total invoiced: {money(stats.totalInvoiced)}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500">Outstanding</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(stats.outstanding)}
          </p>
        </div>
      </div>

      {/* My Projects (simple list, read-only) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          My Projects
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Project</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Supervisor</th>
              <th className="text-left p-3">Budget</th>
            </tr>
          </thead>
          <tbody>
            {myProjects.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium text-gray-800 dark:text-gray-100">
                  {p.name}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">{p.status || "—"}</td>
                <td className="p-3 text-gray-700 dark:text-gray-200">{p.supervisor || "—"}</td>
                <td className="p-3 text-gray-800 dark:text-gray-100">
                  {money(p.budget)}
                </td>
              </tr>
            ))}

            {myProjects.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500 dark:text-gray-300">
                  No projects assigned to your account yet.
                  <div className="text-xs mt-2">
                    (For Step 1, matching is by <b>project.client == your name</b> unless you later add clientEmail.)
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}