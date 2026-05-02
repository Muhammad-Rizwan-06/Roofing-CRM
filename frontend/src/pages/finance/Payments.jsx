import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PaymentModal from "../../components/finance/PaymentModal";
import { paymentsMock } from "../../data/financeMockData";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const nextNo = (prefix, list) => {
  const max = (list || []).reduce((m, x) => {
    const n = Number(String(x.paymentNo || "").replace(prefix + "-", "")) || 0;
    return Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
};

const calcInvoiceTotal = (inv) => {
  const items = inv?.items || [];
  const taxRate = Number(inv?.taxRate || 0);
  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  return subtotal + subtotal * taxRate;
};

const Payments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillInvoiceId = searchParams.get("invoiceId") || "";

  const [open, setOpen] = useState(false);

  const [invoices, setInvoices] = useState(
    () => JSON.parse(localStorage.getItem("invoices")) || []
  );

  const [payments, setPayments] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("payments")) || null;
    return stored ?? paymentsMock;
  });

  useEffect(() => localStorage.setItem("payments", JSON.stringify(payments)), [payments]);

  // refresh invoices when page loads
  useEffect(() => {
    setInvoices(JSON.parse(localStorage.getItem("invoices")) || []);
  }, []);

  // auto-open when coming from invoice context
  useEffect(() => {
    if (prefillInvoiceId) setOpen(true);
  }, [prefillInvoiceId]);

  const metrics = useMemo(() => {
    const totalPayments = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const count = payments.length;
    return { totalPayments, count };
  }, [payments]);

  const addPayment = (payload) => {
    setPayments((prevPayments) => {
      const newPayment = {
        id: Date.now(),
        paymentNo: nextNo("PAY", prevPayments),
        ...payload,
      };

      // update invoice totals in localStorage
      const currentInvoices = JSON.parse(localStorage.getItem("invoices")) || [];
      const updatedInvoices = currentInvoices.map((inv) => {
        if (inv.id !== payload.invoiceId) return inv;

        const total = calcInvoiceTotal(inv);
        const amountPaid = Number(inv.amountPaid || 0) + Number(payload.amount || 0);

        let status = "Partially Paid";
        if (amountPaid <= 0) status = "Unpaid";
        if (amountPaid >= total) status = "Paid";

        return { ...inv, amountPaid, status };
      });

      localStorage.setItem("invoices", JSON.stringify(updatedInvoices));
      setInvoices(updatedInvoices);

      // clear query param after save so refresh doesn't auto-open
      if (prefillInvoiceId) setSearchParams({});

      return [...prevPayments, newPayment];
    });
  };

  const remove = (id) => setPayments((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payments</h1>
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

      {/* KPI */}
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
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium text-gray-800 dark:text-gray-100">
                  {p.paymentNo}
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-200">{p.invoiceNo}</td>
                <td className="p-3 text-gray-700 dark:text-gray-200">{p.customer}</td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{p.date}</td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{p.method}</td>
                <td className="p-3 text-gray-800 dark:text-gray-100">{money(p.amount)}</td>
                <td className="p-3 text-right">
                  <button onClick={() => remove(p.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {payments.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500 dark:text-gray-300" colSpan={7}>
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaymentModal
        open={open}
        onClose={() => {
          setOpen(false);
          if (prefillInvoiceId) setSearchParams({});
        }}
        onSave={addPayment}
        invoices={invoices}
        prefillInvoiceId={prefillInvoiceId}
      />
    </div>
  );
};

export default Payments;