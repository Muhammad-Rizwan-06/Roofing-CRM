import React, { useState, useEffect } from "react";
import LeadsTable from "../components/leads/LeadsTable";
import AddLeadModal from "../components/leads/AddLeadModal";
import { safeParse } from "../utils/storageHelper";
import { useLeads } from "../context/LeadContext";
import { create } from "axios";
import { useProjects } from "../context/ProjectsContext";

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
    0,
  );
  return subtotal + subtotal * taxRate;
};

const Leads = () => {
  const {
    leads,
    loading,
    error,
    getAll,
    createLead,
    deleteLead: deleteLeadAPI,
  } = useLeads();
  const { createProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(null);

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
      status: normalizeLeadStatus(newLead.status),
      estimatedValue: Number(newLead.estimatedValue || 0),
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
    console.log("Attempting to delete lead with ID:", leadId);
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

  // ✅ Convert Lead → Project (linked to accepted estimate if exists)
  const convertLead = async (lead) => {
    const existingProjects = JSON.parse(localStorage.getItem("projects")) || [];
    const estimates = JSON.parse(localStorage.getItem("estimates")) || [];

    const acceptedEstimate = estimates
      .filter((e) => Number(e.leadId) === Number(lead.leadId))
      .find((e) => e.status === "Accepted");

    const budget = acceptedEstimate
      ? calcEstimateTotal(acceptedEstimate)
      : Number(lead.estimatedValue || 0);


    const newProject = {
      name: `Roof Project - ${lead.name}`,
      client: lead.name,
      status: "Pending",
      budget,
      supervisor: "",
      team: "",
    //   materials: [],
    //   workers: [],
    //   tasks: [],
      source: "Lead Conversion",
      estimateId: acceptedEstimate?.id || null,
    };


    createProject(newProject); // Create project in API

    // localStorage.setItem(
    //   "projects",
    //   JSON.stringify([...existingProjects, newProject]),
    // );

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
          : e,
      );
      localStorage.setItem("estimates", JSON.stringify(updatedEstimates));
    }

    // Delete lead from API
    await deleteLeadAPI(lead.leadId);
    alert(`Lead "${lead.name}" converted to Project`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Leads
        </h1>

        <button
          onClick={() => setOpen(true)}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition"
        >
          + Add Lead
        </button>
      </div>

      {/* {loading && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Loading leads...
        </div>
      )} */}

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

      <LeadsTable leads={leads} onDelete={deleteLead} onConvert={convertLead} />

      {open && <AddLeadModal setOpen={setOpen} onAdd={addLead} />}
    </div>
  );
};

export default Leads;
