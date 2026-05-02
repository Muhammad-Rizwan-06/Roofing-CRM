import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ExpenseModal from "../../components/finance/ExpenseModal";
import { expensesMock } from "../../data/financeMockData";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const nextNo = (prefix, list) => {
  const max = (list || []).reduce((m, x) => {
    const n = Number(String(x.expenseNo || "").replace(prefix + "-", "")) || 0;
    return Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
};

const Expenses = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillProjectId = searchParams.get("projectId") || "";

  const [open, setOpen] = useState(false);

  const [projects] = useState(() => JSON.parse(localStorage.getItem("projects")) || []);

  const [expenses, setExpenses] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("expenses")) || null;
    return stored ?? expensesMock;
  });

  useEffect(() => localStorage.setItem("expenses", JSON.stringify(expenses)), [expenses]);

  // Auto-open when navigated from project context
  useEffect(() => {
    if (prefillProjectId) setOpen(true);
  }, [prefillProjectId]);

  const filteredExpenses = useMemo(() => {
    if (!prefillProjectId) return expenses;
    return expenses.filter((e) => String(e.projectId) === String(prefillProjectId));
  }, [expenses, prefillProjectId]);

  const metrics = useMemo(() => {
    const total = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const count = filteredExpenses.length;
    return { total, count };
  }, [filteredExpenses]);

  const addExpense = (payload) => {
    const project = projects.find((p) => Number(p.id) === Number(payload.projectId));

    setExpenses((prev) => [
      ...prev,
      {
        id: Date.now(),
        expenseNo: nextNo("EXP", prev),
        ...payload,
        projectName: project?.name || payload.projectName || "",
      },
    ]);

    // clear query param after create
    if (prefillProjectId) setSearchParams({});
  };

  const remove = (id) => setExpenses((prev) => prev.filter((x) => x.id !== id));

  const activeProjectName = useMemo(() => {
    if (!prefillProjectId) return "";
    return projects.find((p) => String(p.id) === String(prefillProjectId))?.name || "";
  }, [prefillProjectId, projects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Track project expenses for accurate job costing
          </p>

          {prefillProjectId && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Showing expenses for:{" "}
              <span className="font-semibold">{activeProjectName || `Project #${prefillProjectId}`}</span>{" "}
              <button
                className="ml-2 text-blue-600 hover:underline"
                onClick={() => setSearchParams({})}
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setOpen(true);
            if (prefillProjectId) setSearchParams({});
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          + Add Expense
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{money(metrics.total)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Count</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.count}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">Expense List</div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Expense #</th>
              <th className="text-left p-3">Project</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Vendor</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredExpenses.map((e) => (
              <tr key={e.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium text-gray-800 dark:text-gray-100">{e.expenseNo}</td>
                <td className="p-3 text-gray-700 dark:text-gray-200">
                  {e.projectId ? (
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => navigate(`/projects/${e.projectId}`)}
                    >
                      {e.projectName || `Project #${e.projectId}`}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{e.category}</td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{e.vendor || "—"}</td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{e.date}</td>
                <td className="p-3 text-gray-800 dark:text-gray-100">{money(e.amount)}</td>
                <td className="p-3 text-right">
                  <button onClick={() => remove(e.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredExpenses.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500 dark:text-gray-300" colSpan={7}>
                  No expenses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ExpenseModal
        open={open}
        onClose={() => {
          setOpen(false);
          if (prefillProjectId) setSearchParams({});
        }}
        onSave={addExpense}
        projects={projects}
        prefillProjectId={prefillProjectId}
      />
    </div>
  );
};

export default Expenses;