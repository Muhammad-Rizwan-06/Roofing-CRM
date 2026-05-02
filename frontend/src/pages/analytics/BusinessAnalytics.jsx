import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const monthKey = (d) => {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleString("en-US", { month: "short" });
};

const calcInvoiceTotal = (inv) => {
  const subtotal = (inv.items || []).reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  return subtotal + subtotal * Number(inv.taxRate || 0);
};

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#14b8a6"];

const BusinessAnalytics = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const payments = useMemo(() => JSON.parse(localStorage.getItem("payments")) || [], []);
  const expenses = useMemo(() => JSON.parse(localStorage.getItem("expenses")) || [], []);
  const invoices = useMemo(() => JSON.parse(localStorage.getItem("invoices")) || [], []);
  const projects = useMemo(() => JSON.parse(localStorage.getItem("projects")) || [], []);

  const { kpis, monthlyData, expenseCategoryData, agingData, topProjects } = useMemo(() => {
    const revenueByMonth = {};
    const expenseByMonth = {};
    const expenseByCategory = {};

    payments.forEach((p) => {
      const k = monthKey(p.date);
      if (!k || Number(k.split("-")[0]) !== year) return;
      revenueByMonth[k] = (revenueByMonth[k] || 0) + Number(p.amount || 0);
    });

    expenses.forEach((e) => {
      const k = monthKey(e.date);
      if (!k || Number(k.split("-")[0]) !== year) return;
      expenseByMonth[k] = (expenseByMonth[k] || 0) + Number(e.amount || 0);

      const cat = e.category || "Other";
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount || 0);
    });

    const monthlyData = Array.from({ length: 12 }).map((_, i) => {
      const k = `${year}-${String(i + 1).padStart(2, "0")}`;
      const revenue = revenueByMonth[k] || 0;
      const expense = expenseByMonth[k] || 0;
      return { month: monthLabel(k), revenue, expense, net: revenue - expense };
    });

    const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
    const totalExpenses = monthlyData.reduce((s, m) => s + m.expense, 0);
    const netCash = totalRevenue - totalExpenses;

    // Outstanding (all-time)
    const totalInvoiced = invoices.reduce((s, inv) => s + calcInvoiceTotal(inv), 0);
    const totalPaid = invoices.reduce((s, inv) => s + Number(inv.amountPaid || 0), 0);
    const outstanding = Math.max(0, totalInvoiced - totalPaid);

    // Aging buckets (based on dueDate)
    const now = new Date();
    const aging = { "0-30": 0, "31-60": 0, "61+": 0 };
    invoices.forEach((inv) => {
      const total = calcInvoiceTotal(inv);
      const due = Math.max(0, total - Number(inv.amountPaid || 0));
      if (due <= 0) return;
      const dueDate = new Date(inv.dueDate);
      if (Number.isNaN(dueDate.getTime())) return;

      const diffDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) aging["0-30"] += due;
      else if (diffDays <= 60) aging["31-60"] += due;
      else aging["61+"] += due;
    });

    const agingData = Object.entries(aging).map(([name, value]) => ({ name, value }));

    const expenseCategoryData = Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value,
    }));

    // Top projects by expected profit (budget - materials - workers - expenses)
    const expByProject = expenses.reduce((acc, e) => {
      if (!e.projectId) return acc;
      acc[e.projectId] = (acc[e.projectId] || 0) + Number(e.amount || 0);
      return acc;
    }, {});

    const topProjects = projects
      .map((p) => {
        const revenue = Number(p.budget || 0);
        const mat = (p.materials || []).reduce((s, m) => s + Number(m.total || 0), 0);
        const lab = (p.workers || []).reduce((s, w) => s + Number(w.total ?? w.salary ?? 0), 0);
        const extra = Number(expByProject[p.id] || 0);
        const profit = revenue - (mat + lab + extra);
        return { name: p.name, profit };
      })
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 8)
      .map((x) => ({ name: x.name.length > 14 ? x.name.slice(0, 14) + "…" : x.name, value: x.profit }));

    return {
      kpis: { totalRevenue, totalExpenses, netCash, outstanding },
      monthlyData,
      expenseCategoryData,
      agingData,
      topProjects,
    };
  }, [payments, expenses, invoices, projects, year]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Business Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Real KPIs from payments, expenses, invoices and projects
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-300">Year</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-gray-800 dark:text-white"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Revenue (Payments)</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{money(kpis.totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Expenses</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{money(kpis.totalExpenses)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Net Cash</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{money(kpis.netCash)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Outstanding (Invoices)</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{money(kpis.outstanding)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Revenue vs Expenses (Monthly)
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="month" />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Expenses" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Expenses by Category
          </h2>
          {expenseCategoryData.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">No expenses found.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={expenseCategoryData} dataKey="value" nameKey="name" outerRadius={115}>
                  {expenseCategoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Receivables Aging (Outstanding)
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={agingData}>
              <XAxis dataKey="name" />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Top Projects by Expected Profit
          </h2>
          {topProjects.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">No projects found.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProjects}>
                <XAxis dataKey="name" />
                <Tooltip formatter={(v) => money(v)} />
                <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalytics;