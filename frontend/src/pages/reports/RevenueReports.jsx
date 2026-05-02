import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const getMonthKey = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "short" });
};

const calcInvoiceTotal = (inv) => {
  const subtotal = (inv.items || []).reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  return subtotal + subtotal * Number(inv.taxRate || 0);
};

const RevenueReports = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const payments = useMemo(
    () => JSON.parse(localStorage.getItem("payments")) || [],
    []
  );
  const invoices = useMemo(
    () => JSON.parse(localStorage.getItem("invoices")) || [],
    []
  );
  const expenses = useMemo(
    () => JSON.parse(localStorage.getItem("expenses")) || [],
    []
  );

  const { kpis, chartData } = useMemo(() => {
    // Monthly aggregation
    const revenueByMonth = {};
    const expenseByMonth = {};

    payments.forEach((p) => {
      const key = getMonthKey(p.date);
      if (!key) return;
      const y = Number(key.split("-")[0]);
      if (y !== year) return;
      revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(p.amount || 0);
    });

    expenses.forEach((e) => {
      const key = getMonthKey(e.date);
      if (!key) return;
      const y = Number(key.split("-")[0]);
      if (y !== year) return;
      expenseByMonth[key] = (expenseByMonth[key] || 0) + Number(e.amount || 0);
    });

    const months = Array.from({ length: 12 }).map((_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, "0")}`;
      const revenue = revenueByMonth[key] || 0;
      const expense = expenseByMonth[key] || 0;
      return {
        month: monthLabel(key),
        revenue,
        expense,
        net: revenue - expense,
      };
    });

    const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
    const totalExpenses = months.reduce((s, m) => s + m.expense, 0);
    const net = totalRevenue - totalExpenses;

    const totalInvoiced = invoices.reduce((s, inv) => s + calcInvoiceTotal(inv), 0);
    const totalPaidAgainstInvoices = invoices.reduce(
      (s, inv) => s + Number(inv.amountPaid || 0),
      0
    );
    const outstanding = Math.max(0, totalInvoiced - totalPaidAgainstInvoices);

    return {
      chartData: months,
      kpis: { totalRevenue, totalExpenses, net, outstanding },
    };
  }, [payments, expenses, invoices, year]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Revenue Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Monthly revenue vs expenses and outstanding receivables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-300">Year</p>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-gray-800 dark:text-white"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Revenue (Payments)</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(kpis.totalRevenue)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Expenses</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(kpis.totalExpenses)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Net</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(kpis.net)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Outstanding (Invoices)</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(kpis.outstanding)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
        <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Revenue vs Expenses (Monthly)
        </h2>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis dataKey="month" />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" name="Expenses" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueReports;