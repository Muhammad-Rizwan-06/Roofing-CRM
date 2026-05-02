import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCustomerProjectIdSet } from "../../utils/customerScope";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function PortalPayments() {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const invoiceId = sp.get("invoiceId");

  const projects = useMemo(() => JSON.parse(localStorage.getItem("projects")) || [], []);
  const invoices = useMemo(() => JSON.parse(localStorage.getItem("invoices")) || [], []);
  const payments = useMemo(() => JSON.parse(localStorage.getItem("payments")) || [], []);

  const myProjectIds = useMemo(() => getCustomerProjectIdSet(projects, user), [projects, user]);

  const myInvoiceIds = useMemo(() => {
    return new Set(
      invoices
        .filter((inv) => myProjectIds.has(String(inv.projectId)))
        .map((inv) => String(inv.id))
    );
  }, [invoices, myProjectIds]);

  const filtered = useMemo(() => {
    let list = payments.filter((p) => {
      if (p.invoiceId && myInvoiceIds.has(String(p.invoiceId))) return true;
      if (p.projectId && myProjectIds.has(String(p.projectId))) return true;
      return false;
    });

    if (invoiceId) list = list.filter((p) => String(p.invoiceId) === String(invoiceId));
    return list;
  }, [payments, myInvoiceIds, myProjectIds, invoiceId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Payments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">Read-only</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">Payment List</div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Payment #</th>
              <th className="text-left p-3">Invoice</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Method</th>
              <th className="text-left p-3">Amount</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium">{p.paymentNo}</td>
                <td className="p-3">{p.invoiceNo || "—"}</td>
                <td className="p-3">{p.date || "—"}</td>
                <td className="p-3">{p.method || "—"}</td>
                <td className="p-3">{money(p.amount)}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500 dark:text-gray-300" colSpan={5}>
                  No payments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}