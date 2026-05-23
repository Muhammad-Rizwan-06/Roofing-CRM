import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const SubcontractorsContext = createContext(null);

export const useSubcontractors = () => {
  const context = useContext(SubcontractorsContext);
  if (!context) {
    throw new Error(
      "useSubcontractors must be used within SubcontractorsProvider",
    );
  }
  return context;
};

export const SubcontractorsProvider = ({ children }) => {
  const [subcontractors, setSubcontractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GET /subcontractors
  const getAllSubcontractors = useCallback(async (active = null) => {
    try {
      setLoading(true);
      setError(null);
      const url = active
        ? `/subcontractors?active=${active}`
        : "/subcontractors";
      const response = await apiClient.get(url);
      const data = response.subcontractors || [];
      setSubcontractors(Array.isArray(data) ? data : []);
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch subcontractors";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /subcontractors
  const addSubcontractor = useCallback(async (subcontractorData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post(
        "/subcontractors",
        subcontractorData,
      );
      const newSubcontractor = response.subcontractor;
      setSubcontractors((prev) => [newSubcontractor, ...prev]);
      return {
        ok: true,
        data: newSubcontractor,
        message: "Subcontractor created successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to create subcontractor";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /subcontractors/{subcontractorId}
  const updateSubcontractor = useCallback(
    async (subcontractorId, subcontractorData) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.patch(
          `/subcontractors/${subcontractorId}`,
          subcontractorData,
        );
        const updatedSubcontractor = response.subcontractor;
        setSubcontractors((prev) =>
          prev.map((s) =>
            s.subcontractorId === subcontractorId ? updatedSubcontractor : s,
          ),
        );
        return {
          ok: true,
          data: updatedSubcontractor,
          message: "Subcontractor updated successfully",
        };
      } catch (err) {
        const errorMessage = err.message || "Failed to update subcontractor";
        setError(errorMessage);
        return { ok: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // DELETE /subcontractors/{subcontractorId}
  const deleteSubcontractor = useCallback(async (subcontractorId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/subcontractors/${subcontractorId}`);
      setSubcontractors((prev) =>
        prev.filter((s) => s.subcontractorId !== subcontractorId),
      );
      return { ok: true, message: "Subcontractor deleted successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete subcontractor";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    subcontractors,
    loading,
    error,
    getAllSubcontractors,
    addSubcontractor,
    updateSubcontractor,
    deleteSubcontractor,
  };

  return (
    <SubcontractorsContext.Provider value={value}>
      {children}
    </SubcontractorsContext.Provider>
  );
};

export default SubcontractorsContext;
