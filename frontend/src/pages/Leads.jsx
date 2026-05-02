import React, { useState, useEffect } from "react";
import LeadsTable from "../components/leads/LeadsTable";
import AddLeadModal from "../components/leads/AddLeadModal";

const normalizeLeadStatus = (status) => {
  // migrate old statuses -> pipeline equivalents
  if (status === "Contacted") return "Inspection Scheduled";
  if (status === "Closed") return "Won";
  return status || "New";
};

const calcEstimateTotal = (estimate) => {
  const items = estimate?.items || [];
  const taxRate = Number(estimate?.taxRate || 0);
  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  return subtotal + subtotal * taxRate;
};

const Leads = () => {
  const [leads, setLeads] = useState(() => {
    // ✅ REAL ONLY (no mock data)
    const storedLeads = localStorage.getItem("leads");
    const base = storedLeads ? JSON.parse(storedLeads) : [];
    return (base || []).map((l) => ({
      ...l,
      status: normalizeLeadStatus(l.status),
      estimatedValue: Number(l.estimatedValue || 0),
    }));
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("leads", JSON.stringify(leads));
  }, [leads]);

  const addLead = (newLead) => {
    setLeads((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...newLead,
        status: normalizeLeadStatus(newLead.status),
        estimatedValue: Number(newLead.estimatedValue || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const deleteLead = (id) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  };

  // ✅ Convert Lead → Project (linked to accepted estimate if exists)
  const convertLead = (lead) => {
    const existingProjects = JSON.parse(localStorage.getItem("projects")) || [];
    const estimates = JSON.parse(localStorage.getItem("estimates")) || [];

    const acceptedEstimate = estimates
      .filter((e) => Number(e.leadId) === Number(lead.id))
      .find((e) => e.status === "Accepted");

    const budget = acceptedEstimate
      ? calcEstimateTotal(acceptedEstimate)
      : Number(lead.estimatedValue || 0);

    const projectId = Date.now();

    const newProject = {
      id: projectId,
      name: `Roof Project - ${lead.name}`,
      client: lead.name,
      status: "Pending",
      budget,
      supervisor: "",
      team: "",
      materials: [],
      workers: [],
      tasks: [],
      source: "Lead Conversion",
      leadId: lead.id,
      estimateId: acceptedEstimate?.id || null,
    };

    localStorage.setItem(
      "projects",
      JSON.stringify([...existingProjects, newProject])
    );

    // If we converted via accepted estimate, link that estimate to the project
    if (acceptedEstimate) {
      const updatedEstimates = estimates.map((e) =>
        e.id === acceptedEstimate.id
          ? {
              ...e,
              projectId,
              projectName: newProject.name,
              customer: lead.name,
            }
          : e
      );
      localStorage.setItem("estimates", JSON.stringify(updatedEstimates));
    }

    // Remove lead (keeps your existing behavior)
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));

    alert(`Lead "${lead.name}" converted to Project`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Leads</h1>

        <button
          onClick={() => setOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + Add Lead
        </button>
      </div>

      <LeadsTable leads={leads} onDelete={deleteLead} onConvert={convertLead} />

      {open && <AddLeadModal setOpen={setOpen} onAdd={addLead} />}
    </div>
  );
};

export default Leads;