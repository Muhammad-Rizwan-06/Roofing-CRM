import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import InvoiceModal from "../../components/finance/InvoiceModal";
import { useInvoices } from "../../context/InvoicesContext";
import { useProjects } from "../../context/ProjectsContext";

import { useCompany } from "../../context/CompanyContext";


const calcTotal = (items = [], taxRate = 0) => {
  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0,
  );
  return subtotal + subtotal * Number(taxRate || 0);
};

const Invoices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo;
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillProjectId = searchParams.get("projectId") || "";
  const searchQuery = searchParams.get("search") || "";

  const [open, setOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const { company, getCompany } = useCompany();

  useEffect(() => {
    getCompany();
  }, [getCompany]);

  
  const money = (n) => `${company?.currency} ${Number(n || 0).toFixed(2)}`;

  // Use API contexts instead of localStorage
  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
    getAllInvoices,
    addInvoice: addInvoiceAPI,
    deleteInvoice: deleteInvoiceAPI,
  } = useInvoices();

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    getAll: getAllProjects,
  } = useProjects();

  // Fetch invoices and projects on mount
  useEffect(() => {
    getAllInvoices();
    getAllProjects();
  }, [getAllInvoices, getAllProjects]);

  // Auto-open when navigated from project context
  useEffect(() => {
    if (prefillProjectId) setOpen(true);
  }, [prefillProjectId]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices || [];
    const q = searchQuery.toLowerCase();
    return (invoices || []).filter((inv) => {
      const invoiceNo = (inv.invoiceNo || "").toLowerCase();
      const customer = (inv.customer || "").toLowerCase();
      const projectName = (inv.projectName || "").toLowerCase();
      const status = (inv.status || "").toLowerCase();
      return (
        invoiceNo.includes(q) ||
        customer.includes(q) ||
        projectName.includes(q) ||
        status.includes(q)
      );
    });
  }, [invoices, searchQuery]);

  const metrics = useMemo(() => {
    const totalInvoiced = filteredInvoices.reduce(
      (s, inv) => s + calcTotal(inv.items, inv.taxRate),
      0,
    );
    const paid = filteredInvoices.reduce(
      (s, inv) => s + Number(inv.amountPaid || 0),
      0,
    );
    const outstanding = totalInvoiced - paid;
    const countPaid = filteredInvoices.filter((i) => i.status === "Paid").length;
    return { totalInvoiced, paid, outstanding, countPaid };
  }, [filteredInvoices]);

  const addInvoice = async (payload) => {
    try {
      setApiError(null);
      const project = projects.find(
        (p) => (p.projectId) === (payload.projectId),
      );

      const invoiceToSave = {
        ...payload,
        projectName: project?.name || payload.projectName || "",
        customer: project?.client || payload.customer,
        leadId: project?.leadId ?? null,
        userId: project?.userId ?? null,
      };


      const result = await addInvoiceAPI(invoiceToSave);

      if (result.ok) {
        // clear query param after creating (so refresh doesn't re-open)
        if (prefillProjectId) setSearchParams({});
        // Navigate back to project if coming from project context
        if (returnTo) {
          setTimeout(() => navigate(returnTo), 0);
        }
        return result;
      } else {
        setApiError(result.message || "Failed to create invoice");
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || "Failed to create invoice";
      setApiError(errorMsg);
      return { ok: false, message: errorMsg };
    }
  };

  const remove = async (id) => {
    try {
      setApiError(null);
      const result = await deleteInvoiceAPI(id);
      if (!result.ok) {
        setApiError(result.message || "Failed to delete invoice");
      }
      return result;
    } catch (err) {
      const errorMsg = err.message || "Failed to delete invoice";
      setApiError(errorMsg);
      return { ok: false, message: errorMsg };
    }
  };

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
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          disabled={projectsLoading}
        >
          + New Invoice
        </button>
      </div>

      {/* Error Display */}
      {(apiError || invoicesError || projectsError) && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
          {apiError || invoicesError || projectsError}
        </div>
      )}

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
            {filteredInvoices.map((inv) => {
              const total = calcTotal(inv.items, inv.taxRate);
              const paid = Number(inv.amountPaid || 0);

              return (
                <tr
                  key={inv.invoiceId}
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
                        navigate(`/finance/payments?invoiceId=${inv.invoiceId}`)
                      }
                      title="Record payment for this invoice"
                    >
                      Record Payment
                    </button>

                    <button
                      onClick={() => remove(inv.invoiceId)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredInvoices.length === 0 && !invoicesLoading && (
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
          // Navigate back to project if coming from project context
          if (returnTo) {
            setTimeout(() => navigate(returnTo), 0);
          }
        }}
        onSave={addInvoice}
        projects={projects}
        prefillProjectId={prefillProjectId}
      />
    </div>
  );
};

export default Invoices;
