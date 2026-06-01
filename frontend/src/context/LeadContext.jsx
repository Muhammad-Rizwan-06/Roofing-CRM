import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const LeadsContext = createContext(null);

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error("useLeads must be used within LeadsProvider");
  }
  return context;
};

export const LeadsProvider = ({ children }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all leads
  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/leads");
      const data = response.data || response;
      setLeads(Array.isArray(data) ? data : []);
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch leads";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single lead by ID
  const getById = useCallback(async (leadId) => {
    try {
      setError(null);
      const response = await apiClient.get(`/leads/${leadId}`);
      const data = response.data || response;
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || `Failed to fetch lead ${leadId}`;
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    }
  }, []);

  const createLead = useCallback(async (leadData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post("/leads", leadData);
      const newLead = response.item || response;

      setLeads((prev) => [...prev, newLead]);
      return { ok: true, data: newLead, message: "Lead created successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to create lead";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLead = useCallback(async (leadId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/leads/${leadId}`);
      setLeads((prev) => prev.filter((lead) => lead.leadId !== leadId));
      return { ok: true, message: "Lead deleted successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete lead";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLead = useCallback(async (leadId, leadData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.patch(`/leads/${leadId}`, leadData);
      const updatedLead = response.data || response;
      setLeads((prev) =>
        prev.map((lead) => (lead.leadId === leadId ? updatedLead : lead))
      );
      return { ok: true, data: updatedLead, message: "Lead updated successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to update lead";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    leads,
    loading,
    error,
    getAll,
    getById,
    createLead,
    updateLead,
    deleteLead,
  };

  return (
    <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>
  );
};

export default LeadsContext;
