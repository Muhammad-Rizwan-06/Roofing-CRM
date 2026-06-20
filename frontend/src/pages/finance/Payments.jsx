import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PaymentModal from "../../components/finance/PaymentModal";
import { usePayments } from "../../context/PaymentsContext";
import { useInvoices } from "../../context/InvoicesContext";

import { useCompany } from "../../context/CompanyContext";


const Payments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillInvoiceId = searchParams.get("invoiceId") || "";
  const searchQuery = searchParams.get("search") || "";

  const [open, setOpen] = useState(false);


  const { company, getCompany } = useCompany();

  useEffect(() => {
    getCompany();
  }, [getCompany]);

  
  const money = (n) => `${company?.currency} ${Number(n || 0).toFixed(2)}`;

  const {
    payments,
    loading: paymentsLoading,
    error: paymentsError,
    fetchPayments,
    addPayment,
    deletePayment,
  } = usePayments();

  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
    getAllInvoices: fetchInvoices,
  } = useInvoices();

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, []);

  // auto-open modal when coming from invoice context
  useEffect(() => {
    if (prefillInvoiceId) setOpen(true);
  }, [prefillInvoiceId]);

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments || [];
    const q = searchQuery.toLowerCase();
    return (payments || []).filter((p) => {
      const paymentNo = (p.paymentNo || "").toLowerCase();
      const invoiceNo = (p.invoiceNo || "").toLowerCase();
      const customer = (p.customer || "").toLowerCase();
      const method = (p.method || "").toLowerCase();
      return (
        paymentNo.includes(q) ||
        invoiceNo.includes(q) ||
        customer.includes(q) ||
        method.includes(q)
      );
    });
  }, [payments, searchQuery]);

  // ── Metrics ────────────────────────────────────────────────────────────────
  const metrics = useMemo(
    () => ({
      totalPayments: filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0),
      count: filteredPayments.length,
    }),
    [filteredPayments],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSave = async (payload) => {
    await addPayment(payload);
    await fetchInvoices(); // sync invoice amountPaid + status after payment

    if (prefillInvoiceId) setSearchParams({});
    setOpen(false);
  };

  const handleDelete = async (paymentId) => {
    await deletePayment(paymentId);
    await fetchInvoices(); // sync invoice amountPaid + status after reversal
  };

  const handleClose = () => {
    setOpen(false);
    if (prefillInvoiceId) setSearchParams({});
  };

  // ── Loading / Error ────────────────────────────────────────────────────────
  const loading = paymentsLoading || invoicesLoading;
  const error = paymentsError || invoicesError;



  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Payments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Record payments against invoices (linked)
          </p>
        </div>
        <button
          onClick={() => {
            setOpen(true);
            if (prefillInvoiceId) setSearchParams({});
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          + Record Payment
        </button>
      </div>
     {error && (
      <div className="flex text-red-500">
        {error}
      </div>
      )}
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Total Payments</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(metrics.totalPayments)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Count</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {metrics.count}
          </p>
        </div>
      </div>
      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Payment List
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Payment #</th>
              <th className="text-left p-3">Invoice</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Method</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPayments.map((p) => (
              <tr
                key={p.paymentId}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="p-3 font-medium text-gray-800 dark:text-gray-100">
                  {p.paymentNo}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">
                  {p.invoiceNo}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">
                  {p.customer}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {p.date}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {p.method}
                </td>
                <td className="p-3 text-gray-800 dark:text-gray-100">
                  {money(p.amount)}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDelete(p.paymentId)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredPayments.length === 0 && (
              <tr>
                <td
                  className="p-6 text-center text-gray-500 dark:text-gray-300"
                  colSpan={7}
                >
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal */}
      <PaymentModal
        open={open}
        onClose={handleClose}
        onSave={handleSave}
        invoices={invoices}
        prefillInvoiceId={prefillInvoiceId}
      />
    </div>
  );
};

export default Payments;
