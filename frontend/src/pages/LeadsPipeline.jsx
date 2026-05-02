// src/pages/LeadsPipeline.jsx
import React, { useEffect, useMemo, useState } from "react";
import AddLeadModal from "../components/leads/AddLeadModal";
import { leadsData } from "../data/mockData";
import {
  LEAD_PIPELINE_STAGES,
  STAGE_PROBABILITY,
  formatMoney,
} from "../constants/leadPipeline";

const ensureLeadDefaults = (lead) => ({
  id: lead.id ?? Date.now(),
  name: lead.name ?? "",
  email: lead.email ?? "",
  phone: lead.phone ?? "",
  status: lead.status ?? "New", // pipeline stage
  estimatedValue: Number(lead.estimatedValue ?? 0), // optional industry field
  createdAt: lead.createdAt ?? new Date().toISOString(),
  updatedAt: lead.updatedAt ?? new Date().toISOString(),
});

const LeadsPipeline = () => {
  const [leads, setLeads] = useState(() => {
    const storedLeads = localStorage.getItem("leads");
    const base = storedLeads ? JSON.parse(storedLeads) : leadsData;
    return (base || []).map(ensureLeadDefaults);
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("leads", JSON.stringify(leads));
  }, [leads]);

  const addLead = (newLead) => {
    const leadToAdd = ensureLeadDefaults({
      ...newLead,
      id: Date.now(),
      status: newLead.status || "New",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setLeads((prev) => [...prev, leadToAdd]);
  };

  const deleteLead = (id) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLead = (id, updates) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  };

  // Convert lead -> project (recommended only when Won)
  const convertLead = (lead) => {
    if (lead.status !== "Won") {
      alert('Convert is recommended only when stage is "Won".');
      return;
    }

    const existingProjects = JSON.parse(localStorage.getItem("projects")) || [];

    const newProject = {
      id: Date.now(),
      name: `Roof Project - ${lead.name}`,
      client: lead.name,
      status: "Pending",
      budget: Number(lead.estimatedValue || 0),
      source: "Lead Conversion",
    };

    localStorage.setItem(
      "projects",
      JSON.stringify([...existingProjects, newProject])
    );

    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    alert(`Lead "${lead.name}" converted to Project`);
  };

  // ---------- Pipeline board grouping ----------
  const grouped = useMemo(() => {
    const map = {};
    LEAD_PIPELINE_STAGES.forEach((s) => (map[s] = []));
    leads.forEach((l) => {
      const stage = LEAD_PIPELINE_STAGES.includes(l.status) ? l.status : "New";
      map[stage].push(l);
    });
    return map;
  }, [leads]);

  // ---------- Forecast metrics (industry-style) ----------
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const totalValue = leads.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);
    const weightedForecast = leads.reduce((sum, l) => {
      const p = STAGE_PROBABILITY[l.status] ?? 0;
      return sum + Number(l.estimatedValue || 0) * p;
    }, 0);

    const wonValue = (grouped["Won"] || []).reduce(
      (sum, l) => sum + Number(l.estimatedValue || 0),
      0
    );

    return { totalLeads, totalValue, weightedForecast, wonValue };
  }, [leads, grouped]);

  // ---------- Drag & Drop ----------
  const onDragStart = (e, leadId) => {
    e.dataTransfer.setData("text/plain", String(leadId));
  };

  const onDropToStage = (e, stage) => {
    e.preventDefault();
    const leadId = Number(e.dataTransfer.getData("text/plain"));
    if (!leadId) return;
    updateLead(leadId, { status: stage });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Opportunities Pipeline
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Drag leads across stages to track progress from New → Won/Lost
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + Add Lead
        </button>
      </div>

      {/* Summary (industry level) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500 dark:text-gray-300">Total Leads</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {metrics.totalLeads}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500 dark:text-gray-300">Pipeline Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatMoney(metrics.totalValue)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500 dark:text-gray-300">Weighted Forecast</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatMoney(metrics.weightedForecast)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500 dark:text-gray-300">Won Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatMoney(metrics.wonValue)}
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="min-w-[1100px] grid grid-cols-6 gap-4">
          {LEAD_PIPELINE_STAGES.map((stage) => (
            <div
              key={stage}
              className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3 border border-gray-200 dark:border-gray-800"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropToStage(e, stage)}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                  {stage}
                </h2>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  {(grouped[stage] || []).length}
                </span>
              </div>

              <div className="space-y-3">
                {(grouped[stage] || []).map((lead) => {
                  const prob = STAGE_PROBABILITY[lead.status] ?? 0;

                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, lead.id)}
                      className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white text-sm">
                            {lead.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-300">
                            {lead.email || "—"} • {lead.phone || "—"}
                          </p>
                        </div>

                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>

                      {/* Estimated Value */}
                      <div className="mt-3">
                        <label className="text-[11px] text-gray-500 dark:text-gray-300">
                          Estimated Value
                        </label>
                        <input
                          type="number"
                          value={lead.estimatedValue || 0}
                          onChange={(e) =>
                            updateLead(lead.id, {
                              estimatedValue: Number(e.target.value || 0),
                            })
                          }
                          className="mt-1 w-full px-2 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-white"
                        />
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                          Probability: {Math.round(prob * 100)}% • Forecast:{" "}
                          {formatMoney((lead.estimatedValue || 0) * prob)}
                        </p>
                      </div>

                      {/* Stage quick change */}
                      <div className="mt-3">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateLead(lead.id, { status: e.target.value })
                          }
                          className="w-full px-2 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-white"
                        >
                          {LEAD_PIPELINE_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Convert action */}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => convertLead(lead)}
                          className={`text-xs px-3 py-2 rounded-lg transition ${
                            lead.status === "Won"
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                          }`}
                          disabled={lead.status !== "Won"}
                          title={
                            lead.status !== "Won"
                              ? 'Move to "Won" to convert'
                              : "Convert to Project"
                          }
                        >
                          Convert
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {open && <AddLeadModal setOpen={setOpen} onAdd={addLead} />}
    </div>
  );
};

export default LeadsPipeline;