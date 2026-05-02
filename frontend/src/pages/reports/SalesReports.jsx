import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Legend,
} from "recharts";

const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

const SalesReports = () => {
  const leads = useMemo(() => JSON.parse(localStorage.getItem("leads")) || [], []);
  const estimates = useMemo(
    () => JSON.parse(localStorage.getItem("estimates")) || [],
    []
  );
  const projects = useMemo(
    () => JSON.parse(localStorage.getItem("projects")) || [],
    []
  );

  const { stageData, kpis, estimateStatusData } = useMemo(() => {
    const stageCounts = leads.reduce((acc, l) => {
      const s = l.status || "New";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const stageData = Object.entries(stageCounts).map(([name, value]) => ({
      name,
      value,
    }));

    const pipelineValue = leads.reduce(
      (s, l) => s + Number(l.estimatedValue || 0),
      0
    );

    const wonCount = leads.filter((l) => l.status === "Won").length;

    const leadConvertedProjects = projects.filter(
      (p) => p.source === "Lead Conversion"
    ).length;

    const estStatusCounts = estimates.reduce((acc, e) => {
      const s = e.status || "Draft";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const estimateStatusData = Object.entries(estStatusCounts).map(([name, value]) => ({
      name,
      value,
    }));

    const acceptedValue = estimates
      .filter((e) => e.status === "Accepted")
      .reduce((sum, e) => {
        const subtotal = (e.items || []).reduce(
          (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
          0
        );
        return sum + subtotal + subtotal * Number(e.taxRate || 0);
      }, 0);

    return {
      stageData,
      estimateStatusData,
      kpis: {
        leadsCount: leads.length,
        pipelineValue,
        wonCount,
        leadConvertedProjects,
        acceptedValue,
      },
    };
  }, [leads, estimates, projects]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Sales Reports
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Pipeline overview, lead stages, and estimate outcomes
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Total Leads</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{kpis.leadsCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Pipeline Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{money(kpis.pipelineValue)}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Won Leads</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{kpis.wonCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Converted Projects</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{kpis.leadConvertedProjects}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Accepted Estimates Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{money(kpis.acceptedValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lead stages */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Lead Stages Distribution
          </h2>

          {stageData.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">No leads found.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={stageData} dataKey="value" nameKey="name" outerRadius={110}>
                  {stageData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Estimate statuses */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Estimates by Status
          </h2>

          {estimateStatusData.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">No estimates found.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={estimateStatusData}>
                <XAxis dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#6366f1" name="Count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReports;