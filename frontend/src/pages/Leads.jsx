import React, { useState, useEffect } from "react";
import LeadsTable from "../components/leads/LeadsTable";
import AddLeadModal from "../components/leads/AddLeadModal";
import { useLeads } from "../context/LeadContext";
import { useEstimates } from "../context/EstimatesContext";
import { useProjects } from "../context/ProjectsContext";
import { useUser } from "../context/UserContext";
import { generateSalt, hashPassword } from "../utils/password";

const generateRandomPassword = (length = 12) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

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
  const { estimates, getAllEstimates, updateEstimate } = useEstimates();
  const { createProject } = useProjects();
  const { create: createUser } = useUser();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch leads and estimates on mount
  useEffect(() => {
    getAll();
    getAllEstimates();
  }, [getAll, getAllEstimates]);

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
            phone: lead.phone || "General",
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

      // Find accepted estimate for this lead from context
      const acceptedEstimate = estimates
        .filter((e) => Number(e.leadId) === Number(lead.leadId))
        .find((e) => e.status === "Accepted");

      const budget = acceptedEstimate
        ? calcEstimateTotal(acceptedEstimate)
        : Number(lead.estimatedValue || 0);

      // Create project via API
      const projectResult = await createProject({
        name: `Roof Project - ${lead.name}`,
        client: lead.name,
        status: "Pending",
        leadId: lead.leadId,
        clientEmail: lead.email || "",
        userId: userId,
        budget,
        supervisor: "",
        team: "",
        source: "Lead Conversion",
        estimateId: acceptedEstimate?.estimateId || null,
      });

      if (!projectResult.ok) {
        setMessage({
          type: "error",
          text: projectResult.message || "Failed to create project",
        });
        return;
      }

      const createdProjectId = projectResult.data?.projectId;

      // If converted via accepted estimate, link that estimate to the project via API
      if (acceptedEstimate && createdProjectId) {
        const updateResult = await updateEstimate(acceptedEstimate.estimateId, {
          projectId: createdProjectId,
          projectName: `Roof Project - ${lead.name}`,
        });

        if (!updateResult.ok) {
          console.warn(
            `Estimate linking failed: ${updateResult.message}. Project created but not linked.`,
          );
        }
      }

      // Delete lead via API
      const deleteResult = await deleteLeadAPI(lead.leadId);
      if (deleteResult.ok) {
        setMessage({
          type: "success",
          text: `Lead "${lead.name}" converted to Project`,
        });
      } else {
        setMessage({
          type: "error",
          text: deleteResult.message || "Lead converted but deletion failed",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: `Error during conversion: ${err.message}`,
      });
    }
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
