// src/pages/LeadsPipeline.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AddLeadModal from "../components/leads/AddLeadModal";
import {
  LEAD_PIPELINE_STAGES,
  STAGE_PROBABILITY,
  formatMoney,
} from "../constants/leadPipeline";
import { useLeads } from "../context/LeadContext";
import { useProjects } from "../context/ProjectsContext";
import { useUser } from "../context/UserContext";
import { generateSalt, hashPassword } from "../utils/password";
import { useCompany } from "../context/CompanyContext";

const generateRandomPassword = (length = 12) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const LeadsPipeline = () => {
  const {
    leads,
    loading,
    error,
    getAll,
    createLead,
    updateLead: updateLeadAPI,
    deleteLead: deleteLeadAPI,
  } = useLeads();
  const { createProject } = useProjects();
  const { create: createUser } = useUser();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const { company, getCompany } = useCompany();

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads || [];
    const q = searchQuery.toLowerCase();
    return (leads || []).filter((lead) => {
      const name = (lead.name || "").toLowerCase();
      const email = (lead.email || "").toLowerCase();
      const phone = (lead.phone || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [leads, searchQuery]);

  useEffect(() => {
    getCompany();
  }, [getCompany]);


  // Fetch leads on mount
  useEffect(() => {
    getAll();
  }, [getAll]);

  // Auto-dismiss message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const addLead = async (newLead) => {
    const result = await createLead({
      ...newLead,
      status: newLead.status || "New",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (result.ok) {
      setMessage({
        type: "success",
        text: result.message || "Lead created successfully",
      });
      setOpen(false);
    } else {
      setMessage({
        type: "error",
        text: result.message || "Failed to create lead",
      });
    }
  };

  const deleteLead = async (leadId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lead?",
    );
    if (!confirmed) return;

    const result = await deleteLeadAPI(leadId);
    if (result.ok) {
      setMessage({
        type: "success",
        text: result.message || "Lead deleted successfully",
      });
    } else {
      setMessage({
        type: "error",
        text: result.message || "Failed to delete lead",
      });
    }
  };

  const updateLead = async (leadId, updates) => {
    const result = await updateLeadAPI(leadId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (!result.ok) {
      setMessage({
        type: "error",
        text: result.message || "Failed to update lead",
      });
    }
  };

  // Convert lead -> project (recommended only when Won)
  const convertLead = async (lead) => {
    if (lead.status !== "Won") {
      alert('Convert is recommended only when stage is "Won".');
      return;
    }

    try {
      let userId = lead.userId;

      // If userId is not available, create a new customer user first
      if (!userId) {
        const password = generateRandomPassword();
        const salt = generateSalt();
        const hashedPassword = await hashPassword(password, salt);

        try {
          const newUser = await createUser({
            name: lead.name,
            email: lead.email || "",
            phone: lead.phone || "+10000000000",
            roleName: "Customer",
            status: "Active",
            salt,
            passwordHash: hashedPassword,
          });

          userId = newUser?.userId || newUser?.id;

          if (!userId) {
            setMessage({
              type: "error",
              text: "Failed to create customer user for this lead",
            });
            return;
          }
        } catch (err) {
          setMessage({
            type: "error",
            text: `Failed to create customer account: ${err.message}`,
          });
          return;
        }
      }

      const newProject = {
        name: `Roof Project - ${lead.name}`,
        client: lead.name,
        leadId: lead.leadId,
        userId: userId,
        clientEmail: lead.email || "",
        status: "Pending",
        budget: Number(lead.estimatedValue || 0),
        source: "Lead Conversion",
      };

      const projectResult = await createProject(newProject);

      // Delete lead from API
      const deleteResult = await deleteLeadAPI(lead.leadId);

      if (projectResult.ok && deleteResult.ok) {
        setMessage({
          type: "success",
          text: `Lead "${lead.name}" converted to Project`,
        });
      } else {
        setMessage({
          type: "error",
          text: "Lead converted but there was an issue with cleanup",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: `Error during conversion: ${err.message}`,
      });
    }
  };

  // ---------- Pipeline board grouping ----------
  const grouped = useMemo(() => {
    const map = {};
    LEAD_PIPELINE_STAGES.forEach((s) => (map[s] = []));
    filteredLeads.forEach((l) => {
      const stage = LEAD_PIPELINE_STAGES.includes(l.status) ? l.status : "New";
      map[stage].push(l);
    });
    return map;
  }, [filteredLeads]);

  // ---------- Forecast metrics (industry-style) ----------
  const metrics = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const totalValue = filteredLeads.reduce(
      (sum, l) => sum + Number(l.estimatedValue || 0),
      0,
    );
    const weightedForecast = filteredLeads.reduce((sum, l) => {
      const p = STAGE_PROBABILITY[l.status] ?? 0;
      return sum + Number(l.estimatedValue || 0) * p;
    }, 0);

    const wonValue = (grouped["Won"] || []).reduce(
      (sum, l) => sum + Number(l.estimatedValue || 0),
      0,
    );

    return { totalLeads, totalValue, weightedForecast, wonValue };
  }, [filteredLeads, grouped]);

  // ---------- Drag & Drop ----------
  const onDragStart = (e, leadId) => {
    e.dataTransfer.setData("text/plain", leadId);
  };

  const onDropToStage = async (e, stage) => {
    e.preventDefault();
    const leadIdString = e.dataTransfer.getData("text/plain");
    if (!leadIdString) return;

    const leadId = isNaN(leadIdString) ? leadIdString : Number(leadIdString);
    await updateLead(leadId, { status: stage, stage: stage }); // Update both status and stage for backward compatibility
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
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition"
        >
          + Add Lead
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
          Error: {error}
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Summary (industry level) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            Total Leads
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {metrics.totalLeads}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            Pipeline Value
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatMoney(metrics.totalValue, company?.currency)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            Weighted Forecast
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatMoney(metrics.weightedForecast, company?.currency)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500 dark:text-gray-300">Won Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatMoney(metrics.wonValue, company?.currency)}
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="min-w-275 grid grid-cols-6 gap-4">
          {LEAD_PIPELINE_STAGES.map((stage, i) => (
            // ✅ Keep it clean — stage column only needs dragOver and onDrop
            <div
              key={i}
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
                      key={lead.leadId}
                      draggable
                      onDragStart={(e) => onDragStart(e, lead.leadId)}
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
                          onClick={() => deleteLead(lead.leadId)}
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
                            updateLead(lead.leadId, {
                              estimatedValue: Number(e.target.value || 0),
                            })
                          }
                          className="mt-1 w-full px-2 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-800 dark:text-white"
                        />
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                          Probability: {Math.round(prob * 100)}% • Forecast:{" "}
                          {formatMoney((lead.estimatedValue || 0) * prob, company?.currency)}
                        </p>
                      </div>

                      {/* Stage quick change */}
                      <div className="mt-3">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateLead(lead.leadId, { status: e.target.value })
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
