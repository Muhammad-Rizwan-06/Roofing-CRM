import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const EstimatesContext = createContext(null);

export const useEstimates = () => {
  const context = useContext(EstimatesContext);
  if (!context) {
    throw new Error("useEstimates must be used within EstimatesProvider");
  }
  return context;
};

export const EstimatesProvider = ({ children }) => {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GET /estimates
  const getAllEstimates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/estimates");
      const data = response.items || [];
      setEstimates(Array.isArray(data) ? data : []);
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch estimates";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /estimates
  const addEstimate = useCallback(async (estimateData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post("/estimates", estimateData);
      setEstimates((prev) => [response, ...prev]);
      return {
        ok: true,
        data: response,
        message: "Estimate created successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to create estimate";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /estimates/{estimateId}
  const updateEstimate = useCallback(async (estimateId, estimateData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.patch(
        `/estimates/${estimateId}`,
        estimateData,
      );
      setEstimates((prev) =>
        prev.map((e) => (e.estimateId === estimateId ? response : e)),
      );
      return {
        ok: true,
        data: response,
        message: "Estimate updated successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to update estimate";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /estimates/{estimateId}
  const deleteEstimate = useCallback(async (estimateId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/estimates/${estimateId}`);
      setEstimates((prev) => prev.filter((e) => e.estimateId !== estimateId));
      return { ok: true, message: "Estimate deleted successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete estimate";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    estimates,
    loading,
    error,
    getAllEstimates,
    addEstimate,
    updateEstimate,
    deleteEstimate,
  };

  return (
    <EstimatesContext.Provider value={value}>
      {children}
    </EstimatesContext.Provider>
  );
};

export default EstimatesContext;
