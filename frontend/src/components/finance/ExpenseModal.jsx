import React, { useEffect, useState } from "react";

const ExpenseModal = ({
  open,
  onClose,
  onSave,
  projects = [],
  prefillProjectId = "",
}) => {
  const [form, setForm] = useState({
    projectId: "",
    projectName: "",
    vendor: "",
    category: "Materials",
    date: "",
    amount: "",
    note: "",
  });

  const onPickProject = (projectId) => {
    const p = projects.find((x) => String(x.id) === String(projectId));
    setForm((prev) => ({
      ...prev,
      projectId,
      projectName: p?.name || "",
    }));
  };

  // ✅ Prefill when opened from Project context
  useEffect(() => {
    if (!open) return;

    // default date = today (if empty)
    setForm((p) => ({
      ...p,
      date: p.date || new Date().toISOString().slice(0, 10),
    }));

    if (prefillProjectId) {
      const p = projects.find((x) => String(x.id) === String(prefillProjectId));
      if (p) {
        setForm((prev) => ({
          ...prev,
          projectId: String(p.id),
          projectName: p.name || "",
        }));
      }
    }
  }, [open, prefillProjectId, projects]);

  const submit = (e) => {
    e.preventDefault();

    // ✅ industry-level: expense should belong to a project for job-costing
    if (!form.projectId) return alert("Project is required for an expense");
    if (!form.date) return alert("Date is required");

    const amount = Number(form.amount || 0);
    if (amount <= 0) return alert("Amount must be greater than 0");

    onSave({
      ...form,
      projectId: Number(form.projectId),
      amount,
    });

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white">Add Expense</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
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
              Expenses are tied to projects for accurate job costing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              >
                <option>Materials</option>
                <option>Labor</option>
                <option>Fuel</option>
                <option>Tooling</option>
                <option>Subcontractor</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500">Vendor</label>
              <input
                value={form.vendor}
                onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))}
                className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                placeholder="Vendor / Payee"
              />
            </div>

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
              <label className="text-xs text-gray-500">Amount</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Note (optional)</label>
            <input
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              className="w-full mt-1 rounded-xl border px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              placeholder="What was this expense for?"
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
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;