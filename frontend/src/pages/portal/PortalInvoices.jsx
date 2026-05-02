import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCustomerProjectIdSet } from "../../utils/customerScope";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const calcTotal = (items = [], taxRate = 0) => {
  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  return subtotal + subtotal * Number(taxRate || 0);
};

export default function PortalInvoices() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const projectId = sp.get("projectId");

  const projects = useMemo(() => JSON.parse(localStorage.getItem("projects")) || [], []);
  const invoices = useMemo(() => JSON.parse(localStorage.getItem("invoices")) || [], []);

  const myProjectIds = useMemo(() => getCustomerProjectIdSet(projects, user), [projects, user]);

  const filtered = useMemo(() => {
    let list = invoices.filter((inv) => myProjectIds.has(String(inv.projectId)));
    if (projectId) list = list.filter((inv) => String(inv.projectId) === String(projectId));
    return list;
  }, [invoices, myProjectIds, projectId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Invoices</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">Read-only</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">Invoice List</div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Invoice #</th>
              <th className="text-left p-3">Project</th>
              <th className="text-left p-3">Issue</th>
              <th className="text-left p-3">Due</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Paid</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((inv) => {
              const total = calcTotal(inv.items, inv.taxRate);
              return (
                <tr key={inv.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-3 font-medium">{inv.invoiceNo}</td>
                  <td className="p-3">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => nav(`/portal/projects/${inv.projectId}`)}
                    >
                      {inv.projectName || `Project #${inv.projectId}`}
                    </button>
                  </td>
                  <td className="p-3">{inv.issueDate || "—"}</td>
                  <td className="p-3">{inv.dueDate || "—"}</td>
                  <td className="p-3">{money(total)}</td>
                  <td className="p-3">{money(inv.amountPaid)}</td>
                  <td className="p-3">{inv.status}</td>
                  <td className="p-3 text-right">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => nav(`/portal/finance/payments?invoiceId=${inv.id}`)}
                    >
                      View Payments
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500 dark:text-gray-300" colSpan={8}>
                  No invoices.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}