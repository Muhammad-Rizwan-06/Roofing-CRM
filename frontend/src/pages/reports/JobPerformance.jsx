import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis } from "recharts";

const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b"];

const JobPerformance = () => {
  const projects = useMemo(() => JSON.parse(localStorage.getItem("projects")) || [], []);
  const expenses = useMemo(() => JSON.parse(localStorage.getItem("expenses")) || [], []);

  const summary = useMemo(() => {
    let active = 0;
    let completed = 0;

    let totalTasks = 0;
    let completedTasks = 0;

    const expenseByProjectId = expenses.reduce((acc, e) => {
      if (!e.projectId) return acc;
      acc[e.projectId] = (acc[e.projectId] || 0) + Number(e.amount || 0);
      return acc;
    }, {});

    const projectProfits = projects.map((p) => {
      const revenue = Number(p.budget || 0);

      const materialCost = (p.materials || []).reduce((s, m) => s + Number(m.total || 0), 0);

      // handle either w.total or w.salary (your system sometimes uses salary)
      const workerCost = (p.workers || []).reduce(
        (s, w) => s + Number(w.total ?? w.salary ?? 0),
        0
      );

      const extraExpenses = Number(expenseByProjectId[p.id] || 0);

      const profit = revenue - (materialCost + workerCost + extraExpenses);

      // tasks
      (p.tasks || []).forEach((t) => {
        totalTasks++;
        if (t.status === "Completed") completedTasks++;
      });

      // status
      if (p.status === "Completed") completed++;
      else active++;

      return {
        name: p.name,
        profit,
      };
    });

    projectProfits.sort((a, b) => b.profit - a.profit);

    return {
      statusData: [
        { name: "Active", value: active },
        { name: "Completed", value: completed },
      ],
      taskData: [
        { name: "Completed", value: completedTasks },
        { name: "Pending", value: Math.max(0, totalTasks - completedTasks) },
      ],
      topProfit: projectProfits.slice(0, 6).map((x) => ({
        name: x.name.length > 12 ? x.name.slice(0, 12) + "…" : x.name,
        value: x.profit,
      })),
      leaderboard: projectProfits.slice(0, 10),
    };
  }, [projects, expenses]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Job Performance
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Project completion, task progress, and profitability overview
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Project Status
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={summary.statusData} dataKey="value" nameKey="name" outerRadius={105}>
                {summary.statusData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Task Completion
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary.taskData}>
              <XAxis dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
        <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Top Projects by Profit
        </h2>

        {summary.topProfit.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-300">No projects found.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary.topProfit}>
              <XAxis dataKey="name" />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Profit Leaderboard
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Project</th>
              <th className="text-left p-3">Profit</th>
            </tr>
          </thead>
          <tbody>
            {summary.leaderboard.map((p, idx) => (
              <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 text-gray-800 dark:text-gray-100">{p.name}</td>
                <td className="p-3 text-gray-800 dark:text-gray-100">{money(p.profit)}</td>
              </tr>
            ))}

            {summary.leaderboard.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500 dark:text-gray-300" colSpan={2}>
                  No data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobPerformance;