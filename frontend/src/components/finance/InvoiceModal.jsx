import React, { useEffect, useMemo, useState } from "react";

const emptyItem = { description: "", qty: 1, unitPrice: 0 };

const calcSubtotal = (items) =>
  (items || []).reduce(
    (sum, it) => sum + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );

const InvoiceModal = ({
  open,
  onClose,
  onSave,
  projects = [],
  prefillProjectId = "",
}) => {
  const [form, setForm] = useState({
    customer: "",
    projectId: "",
    projectName: "",
    issueDate: "",
    dueDate: "",
    taxRate: 0,
    items: [{ ...emptyItem }],
  });

  // Prefill project when modal opened from Project context
  useEffect(() => {
    if (!open) return;

    // Set default issueDate = today if empty
    setForm((p) => ({
      ...p,
      issueDate: p.issueDate || new Date().toISOString().slice(0, 10),
    }));

    if (prefillProjectId) {
      const p = projects.find((x) => String(x.id) === String(prefillProjectId));
      if (p) {
        setForm((prev) => ({
          ...prev,
          projectId: String(p.id),
          projectName: p.name || "",
          customer: p.client || prev.customer,
        }));
      }
    }
  }, [open, prefillProjectId, projects]);

  const subtotal = useMemo(() => calcSubtotal(form.items), [form.items]);
  const tax = useMemo(
    () => subtotal * Number(form.taxRate || 0),
    [subtotal, form.taxRate]
  );
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const onPickProject = (projectId) => {
    const p = projects.find((x) => String(x.id) === String(projectId));
    setForm((prev) => ({
      ...prev,
      projectId,
      projectName: p?.name || "",
      customer: p?.client || prev.customer,
    }));
  };

  const updateItem = (idx, key, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [key]: value };
      return { ...prev, items };
    });
  };

  const addItem = () =>
    setForm((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }));

  const removeItem = (idx) =>
    setForm((p) => ({
      ...p,
      items: p.items.length === 1 ? p.items : p.items.filter((_, i) => i !== idx),
    }));

  const submit = (e) => {
    e.preventDefault();

    // ✅ industry-level: invoice should be tied to a project
    if (!form.projectId) return alert("Project is required for an invoice");
    if (!form.customer?.trim()) return alert("Customer is required");
    if (!form.issueDate) return alert("Issue date is required");
    if (!form.dueDate) return alert("Due date is required");

    onSave({
      ...form,
      projectId: Number(form.projectId),
      taxRate: Number(form.taxRate || 0),
      amountPaid: 0,
      status: "Unpaid",
      items: form.items.map((it) => ({
        description: it.description.trim(),
        qty: Number(it.qty || 0),
        unitPrice: Number(it.unitPrice || 0),
      })),
    });

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white">Create Invoice</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Project *</label>
              <select
                value={form.projectId}
                onChange={(e) => onPickProject(e.target.value)}
                className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Invoices should belong to a project/job.
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Customer</label>
              <input
                value={form.customer}
                onChange={(e) => setForm((p) => ({ ...p, customer: e.target.value }))}
                className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                placeholder="Customer name"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Issue Date</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))}
                className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Tax Rate (0.1 = 10%)</label>
              <input
                type="number"
                step="0.01"
                value={form.taxRate}
                onChange={(e) => setForm((p) => ({ ...p, taxRate: e.target.value }))}
                className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-950">
              <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">Line Items</p>
              <button
                type="button"
                onClick={addItem}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                + Add Item
              </button>
            </div>

            <div className="p-4 space-y-3">
              {form.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="col-span-6 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                  />
                  <input
                    type="number"
                    className="col-span-2 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Qty"
                    value={it.qty}
                    onChange={(e) => updateItem(idx, "qty", e.target.value)}
                  />
                  <input
                    type="number"
                    className="col-span-3 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                    placeholder="Unit Price"
                    value={it.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="col-span-1 text-red-600 hover:underline text-sm"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex justify-end gap-8">
                <span>Subtotal: ${subtotal.toFixed(2)}</span>
                <span>Tax: ${tax.toFixed(2)}</span>
                <span className="font-semibold">Total: ${total.toFixed(2)}</span>
              </div>
            </div>
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
              Save Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceModal;