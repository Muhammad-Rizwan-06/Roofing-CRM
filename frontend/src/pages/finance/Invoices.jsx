import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InvoiceModal from "../../components/finance/InvoiceModal";
import { invoicesMock } from "../../data/financeMockData";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const calcTotal = (items = [], taxRate = 0) => {
  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  return subtotal + subtotal * Number(taxRate || 0);
};

const nextNo = (prefix, list) => {
  const max = (list || []).reduce((m, x) => {
    const n = Number(String(x.invoiceNo || "").replace(prefix + "-", "")) || 0;
    return Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
};

const Invoices = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillProjectId = searchParams.get("projectId") || "";

  const [open, setOpen] = useState(false);

  const [projects] = useState(
    () => JSON.parse(localStorage.getItem("projects")) || []
  );

  const [invoices, setInvoices] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("invoices")) || null;
    return stored ?? invoicesMock;
  });

  useEffect(() => {
    localStorage.setItem("invoices", JSON.stringify(invoices));
  }, [invoices]);

  // Auto-open when navigated from project context
  useEffect(() => {
    if (prefillProjectId) setOpen(true);
  }, [prefillProjectId]);

  const metrics = useMemo(() => {
    const totalInvoiced = invoices.reduce(
      (s, inv) => s + calcTotal(inv.items, inv.taxRate),
      0
    );
    const paid = invoices.reduce((s, inv) => s + Number(inv.amountPaid || 0), 0);
    const outstanding = totalInvoiced - paid;
    const countPaid = invoices.filter((i) => i.status === "Paid").length;
    return { totalInvoiced, paid, outstanding, countPaid };
  }, [invoices]);

  const addInvoice = (payload) => {
    const project = projects.find(
      (p) => Number(p.id) === Number(payload.projectId)
    );

    const invoiceToSave = {
      id: Date.now(),
      invoiceNo: nextNo("INV", invoices),
      ...payload,
      projectName: project?.name || payload.projectName || "",
      customer: project?.client || payload.customer,
      leadId: project?.leadId ?? null,
    };

    setInvoices((prev) => [...prev, invoiceToSave]);

    // clear query param after creating (so refresh doesn’t re-open)
    if (prefillProjectId) setSearchParams({});
  };

  const remove = (id) => setInvoices((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Invoices
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Invoices are linked to projects and used for payment tracking
          </p>
        </div>

        <button
          onClick={() => {
            setOpen(true);
            if (prefillProjectId) setSearchParams({});
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          + New Invoice
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Total Invoiced</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(metrics.totalInvoiced)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Paid</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(metrics.paid)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Outstanding</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(metrics.outstanding)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Paid Invoices</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {metrics.countPaid}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Invoice List
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Invoice #</th>
              <th className="text-left p-3">Customer</th>
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
            {invoices.map((inv) => {
              const total = calcTotal(inv.items, inv.taxRate);
              const paid = Number(inv.amountPaid || 0);

              return (
                <tr
                  key={inv.id}
                  className="border-t border-gray-100 dark:border-gray-800"
                >
                  <td className="p-3 font-medium text-gray-800 dark:text-gray-100">
                    {inv.invoiceNo}
                  </td>

                  <td className="p-3 text-gray-700 dark:text-gray-200">
                    {inv.customer}
                  </td>

                  <td className="p-3 text-gray-700 dark:text-gray-200">
                    {inv.projectId ? (
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => navigate(`/projects/${inv.projectId}`)}
                      >
                        {inv.projectName || `Project #${inv.projectId}`}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {inv.issueDate || "—"}
                  </td>

                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {inv.dueDate || "—"}
                  </td>

                  <td className="p-3 text-gray-800 dark:text-gray-100">
                    {money(total)}
                  </td>

                  <td className="p-3 text-gray-800 dark:text-gray-100">
                    {money(paid)}
                  </td>

                  <td className="p-3 text-gray-700 dark:text-gray-200">
                    {inv.status}
                  </td>

                  <td className="p-3 text-right space-x-3">
                    {/* ✅ UPDATED: opens payments modal prefilled */}
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() =>
                        navigate(`/finance/payments?invoiceId=${inv.id}`)
                      }
                      title="Record payment for this invoice"
                    >
                      Record Payment
                    </button>

                    <button
                      onClick={() => remove(inv.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {invoices.length === 0 && (
              <tr>
                <td
                  className="p-6 text-center text-gray-500 dark:text-gray-300"
                  colSpan={9}
                >
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InvoiceModal
        open={open}
        onClose={() => {
          setOpen(false);
          if (prefillProjectId) setSearchParams({});
        }}
        onSave={addInvoice}
        projects={projects}
        prefillProjectId={prefillProjectId}
      />
    </div>
  );
};

export default Invoices;