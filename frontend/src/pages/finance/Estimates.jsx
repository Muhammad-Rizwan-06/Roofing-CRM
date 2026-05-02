import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EstimateModal from "../../components/finance/EstimateModal";
import { estimatesMock } from "../../data/financeMockData";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const calcTotal = (items = [], taxRate = 0) => {
  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
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

  const [open, setOpen] = useState(false);

  const [projects] = useState(() => JSON.parse(localStorage.getItem("projects")) || []);
  const [leads, setLeads] = useState(() => JSON.parse(localStorage.getItem("leads")) || []);

  const [estimates, setEstimates] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("estimates")) || null;
    return stored ?? estimatesMock;
  });

  useEffect(() => localStorage.setItem("estimates", JSON.stringify(estimates)), [estimates]);

  // Keep leads fresh (because leads can change on leads page)
  useEffect(() => {
    setLeads(JSON.parse(localStorage.getItem("leads")) || []);
  }, []);

  // Auto open modal when navigated from LeadsTable "Estimate" action
  useEffect(() => {
    if (prefillLeadId) setOpen(true);
  }, [prefillLeadId]);

  const metrics = useMemo(() => {
    const total = estimates.length;
    const accepted = estimates.filter((e) => e.status === "Accepted").length;
    const sent = estimates.filter((e) => e.status === "Sent").length;
    const totalValue = estimates.reduce((s, e) => s + calcTotal(e.items, e.taxRate), 0);
    return { total, accepted, sent, totalValue };
  }, [estimates]);

  const syncLeadsToStorage = (updated) => {
    localStorage.setItem("leads", JSON.stringify(updated));
    setLeads(updated);
  };

  const updateLeadStage = (leadId, estimateStatus) => {
    const newStage = leadStageFromEstimateStatus(estimateStatus);
    if (!leadId || !newStage) return;

    const currentLeads = JSON.parse(localStorage.getItem("leads")) || [];
    const updated = currentLeads.map((l) =>
      Number(l.id) === Number(leadId) ? { ...l, status: newStage } : l
    );
    syncLeadsToStorage(updated);
  };

  const addEstimate = (payload) => {
    const leadId = payload.leadId || null;
    const leadName = leadId ? (leads.find((l) => Number(l.id) === Number(leadId))?.name || payload.customer) : null;

    const newEstimate = {
      id: Date.now(),
      estimateNo: nextNo("EST", estimates),
      ...payload,
      leadId,
      leadName,
    };

    setEstimates((prev) => [...prev, newEstimate]);

    // if estimate is created for a lead, move lead stage
    if (leadId) {
      // Draft doesn't move, Sent/Accepted/Rejected will move.
      // BUT: most companies move stage to "Estimate Sent" when estimate is created.
      const stage = payload.status === "Draft" ? "Estimate Sent" : payload.status;
      updateLeadStage(leadId, stage === "Estimate Sent" ? "Sent" : payload.status);
    }

    // clear query param after modal saves (so refresh doesn't auto-open)
    if (prefillLeadId) setSearchParams({});
  };

  const remove = (id) => setEstimates((prev) => prev.filter((x) => x.id !== id));

  const updateStatus = (id, status) => {
    setEstimates((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status } : x))
    );

    const estimate = estimates.find((e) => e.id === id);
    if (estimate?.leadId) updateLeadStage(estimate.leadId, status);
  };

  // ✅ Convert accepted estimate -> project (linked)
  const convertEstimateToProject = (estimate) => {
    if (estimate.status !== "Accepted") {
      alert('Only "Accepted" estimates can be converted.');
      return;
    }
    if (estimate.projectId) {
      navigate(`/projects/${estimate.projectId}`);
      return;
    }

    const total = calcTotal(estimate.items, estimate.taxRate);

    const projectId = Date.now();
    const existingProjects = JSON.parse(localStorage.getItem("projects")) || [];

    const newProject = {
      id: projectId,
      name: `Roof Project - ${estimate.customer}`,
      client: estimate.customer,
      status: "Pending",
      budget: total,
      supervisor: "",
      team: "",
      materials: [],
      workers: [],
      tasks: [],
      source: "Estimate Accepted",
      leadId: estimate.leadId || null,
      estimateId: estimate.id,
    };

    localStorage.setItem("projects", JSON.stringify([...existingProjects, newProject]));

    // link estimate -> project
    const updatedEstimates = (JSON.parse(localStorage.getItem("estimates")) || []).map((e) =>
      e.id === estimate.id ? { ...e, projectId, projectName: newProject.name } : e
    );
    localStorage.setItem("estimates", JSON.stringify(updatedEstimates));
    setEstimates(updatedEstimates);

    // remove lead (to match your existing convert behavior)
    if (estimate.leadId) {
      const currentLeads = JSON.parse(localStorage.getItem("leads")) || [];
      const updatedLeads = currentLeads.filter((l) => Number(l.id) !== Number(estimate.leadId));
      syncLeadsToStorage(updatedLeads);
    }

    alert(`Estimate converted to Project: ${newProject.name}`);
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Estimates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Linked to Leads/Projects (Draft → Sent → Accepted/Rejected)
          </p>
        </div>

        <button
          onClick={() => {
            setOpen(true);
            // if user opens manually, clear leadId param so it doesn't keep forcing prefill
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
          <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Sent</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.sent}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow">
          <p className="text-xs text-gray-500">Accepted</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.accepted}</p>
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
            {estimates.map((e) => {
              const total = calcTotal(e.items, e.taxRate);

              return (
                <tr key={e.id} className="border-t border-gray-100 dark:border-gray-800">
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
                      onChange={(ev) => updateStatus(e.id, ev.target.value)}
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
                      onClick={() => remove(e.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {estimates.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500 dark:text-gray-300" colSpan={7}>
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
        onSave={addEstimate}
        projects={projects}
        leads={leads}
        prefillLeadId={prefillLeadId}
      />
    </div>
  );
};

export default Estimates;