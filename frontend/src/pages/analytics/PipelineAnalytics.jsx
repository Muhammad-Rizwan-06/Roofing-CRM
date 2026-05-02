import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const STAGES = [
  "New",
  "Inspection Scheduled",
  "Estimate Sent",
  "Negotiation",
  "Won",
  "Lost",
];

const PROB = {
  New: 0.1,
  "Inspection Scheduled": 0.3,
  "Estimate Sent": 0.5,
  Negotiation: 0.7,
  Won: 1,
  Lost: 0,
};

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

const PipelineAnalytics = () => {
  const leads = useMemo(() => JSON.parse(localStorage.getItem("leads")) || [], []);
  const estimates = useMemo(() => JSON.parse(localStorage.getItem("estimates")) || [], []);
  const projects = useMemo(() => JSON.parse(localStorage.getItem("projects")) || [], []);

  const data = useMemo(() => {
    const stageCounts = {};
    const stageValue = {};

    STAGES.forEach((s) => {
      stageCounts[s] = 0;
      stageValue[s] = 0;
    });

    leads.forEach((l) => {
      const s = STAGES.includes(l.status) ? l.status : "New";
      stageCounts[s] += 1;
      stageValue[s] += Number(l.estimatedValue || 0);
    });

    const stageCountData = STAGES.map((s) => ({ name: s, value: stageCounts[s] }));
    const stageValueData = STAGES.map((s) => ({ name: s, value: stageValue[s] }));

    const pipelineValue = leads.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);
    const weightedForecast = leads.reduce((sum, l) => {
      const p = PROB[l.status] ?? 0;
      return sum + Number(l.estimatedValue || 0) * p;
    }, 0);

    const estimateStatusCounts = estimates.reduce((acc, e) => {
      const s = e.status || "Draft";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const estimateStatusData = Object.entries(estimateStatusCounts).map(([name, value]) => ({ name, value }));

    // conversion count (since converted leads are removed, we use projects with leadId / estimateId)
    const convertedProjects = projects.filter((p) => p.leadId || p.estimateId).length;

    // funnel approximations
    const totalLeadsEver = leads.length + projects.filter((p) => p.leadId).length;
    const acceptedEstimates = estimates.filter((e) => e.status === "Accepted").length;

    return {
      stageCountData,
      stageValueData,
      estimateStatusData,
      kpis: {
        leadsInPipeline: leads.length,
        pipelineValue,
        weightedForecast,
        convertedProjects,
        totalLeadsEver,
        acceptedEstimates,
      },
    };
  }, [leads, estimates, projects]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pipeline Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Stage distribution, pipeline value and estimate outcomes (real data)
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Leads in Pipeline</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{data.kpis.leadsInPipeline}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Pipeline Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{money(data.kpis.pipelineValue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Weighted Forecast</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{money(data.kpis.weightedForecast)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Converted Projects</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{data.kpis.convertedProjects}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Accepted Estimates</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{data.kpis.acceptedEstimates}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stage distribution */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">Leads by Stage</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={data.stageCountData} dataKey="value" nameKey="name" outerRadius={115}>
                {data.stageCountData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stage value */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">Pipeline Value by Stage</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.stageValueData}>
              <XAxis dataKey="name" hide />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="value" name="Value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
            Tip: Lead “Estimated Value” drives this chart.
          </p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl p-6 shadow-lg">
        <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">Estimates Outcomes</h2>
        {data.estimateStatusData.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-300">No estimates found.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.estimateStatusData}>
              <XAxis dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PipelineAnalytics;