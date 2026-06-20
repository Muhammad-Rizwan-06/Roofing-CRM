import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EstimateModal from "../../components/finance/EstimateModal";
import { useEstimates } from "../../context/EstimatesContext";
import { useProjects } from "../../context/ProjectsContext";
import { useLeads } from "../../context/LeadContext";

import { useCompany } from "../../context/CompanyContext";


const calcTotal = (items = [], taxRate = 0) => {
  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0,
  );
  return subtotal + subtotal * Number(taxRate || 0);
};

const nextNo = (prefix, list) => {
  const max = (list || []).reduce((m, x) => {
    const n = Number(String(x.estimateNo || "").replace(prefix + "-", "")) || 0;
    return Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
};

// map estimate status -> lead pipeline stage
const leadStageFromEstimateStatus = (estimateStatus) => {
  if (estimateStatus === "Sent") return "Estimate Sent";
  if (estimateStatus === "Accepted") return "Won";
  if (estimateStatus === "Rejected") return "Lost";
  return null;
};

const Estimates = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillLeadId = searchParams.get("leadId") || "";
  const searchQuery = searchParams.get("search") || "";

  const [open, setOpen] = useState(false);

  const {
    estimates,
    loading: estimatesLoading,
    getAllEstimates,
    addEstimate,
    updateEstimate,
    deleteEstimate,
  } = useEstimates();

  
  const money = (n) => `${company?.currency} ${Number(n || 0).toFixed(2)}`;

  const { company, getCompany } = useCompany();

  useEffect(() => {
    getCompany();
  }, [getCompany]);


  const { projects, getAll: getAllProjects, createProject } = useProjects();
  const { leads, getAll: getAllLeads, updateLead, deleteLead } = useLeads();

  // Fetch all data on mount
  useEffect(() => {
    getAllEstimates();
    getAllLeads();
    getAllProjects();
  }, []);

  // Auto open modal when navigated from LeadsTable "Estimate" action
  useEffect(() => {
    if (prefillLeadId) setOpen(true);
  }, [prefillLeadId]);

  const filteredEstimates = useMemo(() => {
    if (!searchQuery.trim()) return estimates || [];
    const q = searchQuery.toLowerCase();
    return (estimates || []).filter((e) => {
      const estimateNo = (e.estimateNo || "").toLowerCase();
      const customer = (e.customer || "").toLowerCase();
      const leadName = (e.leadName || "").toLowerCase();
      const projectName = (e.projectName || "").toLowerCase();
      const status = (e.status || "").toLowerCase();
      return (
        estimateNo.includes(q) ||
        customer.includes(q) ||
        leadName.includes(q) ||
        projectName.includes(q) ||
        status.includes(q)
      );
    });
  }, [estimates, searchQuery]);

  const metrics = useMemo(() => {
    const total = filteredEstimates.length;
    const accepted = filteredEstimates.filter((e) => e.status === "Accepted").length;
    const sent = filteredEstimates.filter((e) => e.status === "Sent").length;
    const totalValue = filteredEstimates.reduce(
      (s, e) => s + calcTotal(e.items, e.taxRate),
      0,
    );
    return { total, accepted, sent, totalValue };
  }, [filteredEstimates]);

  // ─── Lead stage sync ─────────────────────────────────────────────────────

  const updateLeadStage = (leadId, estimateStatus) => {
    const newStage = leadStageFromEstimateStatus(estimateStatus);
    if (!leadId || !newStage) return;

    // Handle both 'id' and 'leadId' field names due to inconsistency in mockData
    const lead = leads.find((l) => (l.leadId) === (leadId));
    if (lead) {
      const actualLeadId = lead.leadId;
      updateLead(actualLeadId, { status: newStage, stage: newStage });
    }
  };

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleAdd = async (payload) => {
    const leadId = payload.leadId || null;
    const leadName = leadId
      ? leads.find((l) => (l.leadId) === (leadId))?.name ||
        payload.customer
      : null;

    const estimateNo = nextNo("EST", estimates);

    const result = await addEstimate({
      ...payload,
      estimateNo,
      leadId,
      leadName,
    });

    if (!result.ok) {
      alert(result.message);
      return;
    }

    // move lead stage on create
    if (leadId && payload.status !== "Draft") {
      updateLeadStage(leadId, payload.status);
    }

    if (prefillLeadId) setSearchParams({});
  };

  const handleUpdateStatus = async (estimateId, status) => {
    const result = await updateEstimate(estimateId, { status });

    if (!result.ok) {
      alert(result.message);
      return;
    }

    const estimate = estimates.find((e) => e.estimateId === estimateId);
    if (estimate?.leadId) updateLeadStage(estimate.leadId, status);
  };

  const handleDelete = async (estimateId) => {
    const result = await deleteEstimate(estimateId);
    if (!result.ok) alert(result.message);
  };

  // ─── Project conversion ───────────────────────────────────────────────────

  const convertEstimateToProject = async (estimate) => {
    if (estimate.status !== "Accepted") {
      alert('Only "Accepted" estimates can be converted.');
      return;
    }
    if (estimate.projectId) {
      navigate(`/projects/${estimate.projectId}`);
      return;
    }

    const total = calcTotal(estimate.items, estimate.taxRate);

    const projectResult = await createProject({
      name: `Roof Project - ${estimate.customer}`,
      client: estimate.customer,
      status: "Pending",
      budget: total,
      supervisor: "",
      team: "",
      source: "Estimate Accepted",
      estimateId: estimate.estimateId,
    });

    if (!projectResult.ok) {
      alert(projectResult.message);
      return;
    }

    const createdProject = projectResult.data;
    const createdProjectId = createdProject.projectId;
    const projectName = createdProject.name || `Roof Project - ${estimate.customer}`;

    // link estimate -> project via API
    const linkResult = await updateEstimate(estimate.estimateId, {
      projectId: createdProjectId,
      projectName: projectName,
    });

    if (!linkResult.ok) {
      alert(`Project created but linking failed: ${linkResult.message}`);
      return;
    }

    // Delete the linked lead if exists (conversion complete)
    if (estimate.leadId) {
      const deleteResult = await deleteLead(estimate.leadId);
      if (!deleteResult.ok) {
        console.warn(`Lead deletion failed: ${deleteResult.message}`);
      }
    }

    alert(`Estimate converted to Project: ${createdProject.name}`);
    navigate(`/projects/${createdProjectId}`);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Estimates
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Linked to Leads/Projects (Draft → Sent → Accepted/Rejected)
          </p>
        </div>

        <button
          onClick={() => {
            setOpen(true);
            if (prefillLeadId) setSearchParams({});
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          + New Estimate
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {metrics.total}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Sent</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {metrics.sent}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Accepted</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {metrics.accepted}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Total Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {money(metrics.totalValue)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Estimate List
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Estimate #</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Lead</th>
              <th className="text-left p-3">Project</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredEstimates.map((e) => {
                const total = calcTotal(e.items, e.taxRate);
                return (
                  <tr
                    key={e.estimateId}
                    className="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td className="p-3 font-medium text-gray-800 dark:text-gray-100">
                      {e.estimateNo}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-200">
                      {e.customer}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      {e.leadName || (e.leadId ? `Lead #${e.leadId}` : "—")}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      {e.projectName ? (
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => navigate(`/projects/${e.projectId}`)}
                        >
                          {e.projectName}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-gray-800 dark:text-gray-100">
                      {money(total)}
                    </td>
                    <td className="p-3">
                      <select
                        value={e.status}
                        onChange={(ev) =>
                          handleUpdateStatus(e.estimateId, ev.target.value)
                        }
                        className="rounded-lg border px-2 py-1 bg-white dark:bg-gray-950 dark:text-white"
                      >
                        <option>Draft</option>
                        <option>Sent</option>
                        <option>Accepted</option>
                        <option>Rejected</option>
                      </select>
                    </td>
                    <td className="p-3 text-right space-x-3">
                      {e.status === "Accepted" && !e.projectId && (
                        <button
                          onClick={() => convertEstimateToProject(e)}
                          className="text-green-600 hover:underline"
                        >
                          Convert
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(e.estimateId)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

            {!estimatesLoading && filteredEstimates.length === 0 && (
              <tr>
                <td
                  className="p-6 text-center text-gray-500 dark:text-gray-300"
                  colSpan={7}
                >
                  No estimates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EstimateModal
        open={open}
        onClose={() => {
          setOpen(false);
          if (prefillLeadId) setSearchParams({});
        }}
        onSave={handleAdd}
        projects={projects}
        leads={leads}
        prefillLeadId={prefillLeadId}
      />
    </div>
  );
};

export default Estimates;
