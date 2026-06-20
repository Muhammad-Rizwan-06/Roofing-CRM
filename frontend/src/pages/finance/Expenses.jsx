import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ExpenseModal from "../../components/finance/ExpenseModal";
import { useExpenses } from "../../context/ExpensesContext";
import { useProjects } from "../../context/ProjectsContext";

import { useCompany } from "../../context/CompanyContext";


const Expenses = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillProjectId = searchParams.get("projectId") || "";
  const searchQuery = searchParams.get("search") || "";

  const [open, setOpen] = useState(false);

  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    fetchExpenses,
    addExpense,
    deleteExpense,
  } = useExpenses();

  const { company, getCompany } = useCompany();

  useEffect(() => {
    getCompany();
  }, [getCompany]);
  
  const money = (n) => `${company?.currency} ${Number(n || 0).toFixed(2)}`;


  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    getAll:  fetchProjects,
  } = useProjects();

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchExpenses();
    fetchProjects();
  }, []);

  // auto-open when navigated from project context
  useEffect(() => {
    if (prefillProjectId) setOpen(true);
  }, [prefillProjectId]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    let list = expenses || [];

    if (prefillProjectId) {
      list = list.filter(
        (e) => String(e.projectId) === String(prefillProjectId),
      );
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((e) => {
      const expenseNo = (e.expenseNo || "").toLowerCase();
      const projectName = (e.projectName || "").toLowerCase();
      const category = (e.category || "").toLowerCase();
      const vendor = (e.vendor || "").toLowerCase();
      return (
        expenseNo.includes(q) ||
        projectName.includes(q) ||
        category.includes(q) ||
        vendor.includes(q)
      );
    });
  }, [expenses, prefillProjectId, searchQuery]);

  const metrics = useMemo(
    () => ({
      total: filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0),
      count: filteredExpenses.length,
    }),
    [filteredExpenses],
  );

  const activeProjectName = useMemo(() => {
    if (!prefillProjectId) return "";
    return (
      projects.find((p) => String(p.projectId) === String(prefillProjectId))
        ?.name || ""
    );
  }, [prefillProjectId, projects]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSave = async (payload) => {
    const project = projects.find(
      (p) => String(p.projectId) === String(payload.projectId),
    );

    await addExpense({
      ...payload,
      projectName: project?.name || payload.projectName || "",
    });

    if (prefillProjectId) setSearchParams({});
    setOpen(false);
  };

  const handleDelete = async (expenseId) => {
    await deleteExpense(expenseId);
  };

  const handleClose = () => {
    setOpen(false);
    if (prefillProjectId) setSearchParams({});
  };

  // ── Loading / Error ────────────────────────────────────────────────────────
  const loading = expensesLoading || projectsLoading;
  const error = expensesError || projectsError;

//   if (loading)
//     return (
//       <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-300">
//         Loading...
//       </div>
//     );

  if (error)
    return (
      <div className="flex items-center justify-center h-40 text-red-500">
        {error}
      </div>
    );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Expenses
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Track project expenses for accurate job costing
          </p>

          {prefillProjectId && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Showing expenses for:{" "}
              <span className="font-semibold">
                {activeProjectName || `Project #${prefillProjectId}`}
              </span>{" "}
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
      {error && (
        <div className="flex items-center justify-center h-40 text-red-500">
          {error}
        </div>
      )}
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(metrics.total)}
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
          Expense List
        </div>

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
              <tr
                key={e.expenseId}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="p-3 font-medium text-gray-800 dark:text-gray-100">
                  {e.expenseNo}
                </td>
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
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {e.category}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {e.vendor || "—"}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {e.date}
                </td>
                <td className="p-3 text-gray-800 dark:text-gray-100">
                  {money(e.amount)}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDelete(e.expenseId)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredExpenses.length === 0 && !expensesLoading && (
              <tr>
                <td
                  className="p-6 text-center text-gray-500 dark:text-gray-300"
                  colSpan={7}
                >
                  No expenses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal */}
      <ExpenseModal
        open={open}
        onClose={handleClose}
        onSave={handleSave}
        projects={projects}
        prefillProjectId={prefillProjectId}
      />
    </div>
  );
};

export default Expenses;
