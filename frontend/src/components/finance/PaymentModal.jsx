import React, { useEffect, useMemo, useState } from "react";

const calcInvoiceTotal = (inv) => {
  const items = inv?.items || [];
  const taxRate = Number(inv?.taxRate || 0);
  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  return subtotal + subtotal * taxRate;
};

const PaymentModal = ({
  open,
  onClose,
  onSave,
  invoices = [],
  prefillInvoiceId = "",
}) => {
  const [form, setForm] = useState({
    invoiceId: "",
    date: "",
    method: "Cash",
    amount: "",
    note: "",
  });

  const selectedInvoice = useMemo(() => {
    return invoices.find((x) => String(x.id) === String(form.invoiceId));
  }, [invoices, form.invoiceId]);

  const outstanding = useMemo(() => {
    if (!selectedInvoice) return 0;
    const total = calcInvoiceTotal(selectedInvoice);
    const paid = Number(selectedInvoice.amountPaid || 0);
    return Math.max(0, total - paid);
  }, [selectedInvoice]);

  // ✅ Prefill when opened via /finance/payments?invoiceId=...
  useEffect(() => {
    if (!open) return;

    // default date = today if empty
    setForm((p) => ({
      ...p,
      date: p.date || new Date().toISOString().slice(0, 10),
    }));

    if (prefillInvoiceId) {
      const inv = invoices.find((x) => String(x.id) === String(prefillInvoiceId));
      if (inv) {
        const total = calcInvoiceTotal(inv);
        const paid = Number(inv.amountPaid || 0);
        const due = Math.max(0, total - paid);

        setForm((p) => ({
          ...p,
          invoiceId: String(inv.id),
          amount: p.amount !== "" ? p.amount : String(due || ""),
        }));
      }
    }
  }, [open, prefillInvoiceId, invoices]);

  const onSelectInvoice = (invoiceId) => {
    const inv = invoices.find((x) => String(x.id) === String(invoiceId));
    if (!inv) {
      setForm((p) => ({ ...p, invoiceId }));
      return;
    }

    const total = calcInvoiceTotal(inv);
    const paid = Number(inv.amountPaid || 0);
    const due = Math.max(0, total - paid);

    setForm((p) => ({
      ...p,
      invoiceId,
      // if user didn't type amount manually, suggest outstanding
      amount: p.amount === "" ? String(due || "") : p.amount,
    }));
  };

  const submit = (e) => {
    e.preventDefault();

    const inv = invoices.find((x) => String(x.id) === String(form.invoiceId));
    if (!inv) return alert("Select an invoice");
    if (!form.date) return alert("Payment date is required");

    const amount = Number(form.amount || 0);
    if (amount <= 0) return alert("Amount must be greater than 0");

    // Optional: warn if overpay
    const total = calcInvoiceTotal(inv);
    const paid = Number(inv.amountPaid || 0);
    const due = Math.max(0, total - paid);
    if (amount > due) {
      const ok = confirm(
        `This payment (${amount}) is greater than outstanding (${due}). Continue?`
      );
      if (!ok) return;
    }

    onSave({
      invoiceId: inv.id,
      invoiceNo: inv.invoiceNo,
      customer: inv.customer,
      projectId: inv.projectId ?? null,
      projectName: inv.projectName ?? "",
      date: form.date,
      method: form.method,
      amount,
      note: form.note,
    });

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white">Record Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500">Invoice</label>
            <select
              value={form.invoiceId}
              onChange={(e) => onSelectInvoice(e.target.value)}
              className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
            >
              <option value="">Select invoice</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNo} — {inv.customer}
                </option>
              ))}
            </select>

            {selectedInvoice && (
              <p className="text-[11px] text-gray-500 mt-1">
                Outstanding: <span className="font-semibold">${outstanding.toFixed(2)}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
                className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              >
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Credit Card</option>
                <option>Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Note (optional)</label>
            <input
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              placeholder="e.g. Advance, partial payment..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;