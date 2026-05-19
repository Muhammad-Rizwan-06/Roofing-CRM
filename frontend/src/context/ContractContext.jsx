import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const ContractsContext = createContext(null);

export const useContracts = () => {
  const context = useContext(ContractsContext);
  if (!context) {
    throw new Error("useContracts must be used within ContractsProvider");
  }
  return context;
};

export const ContractsProvider = ({ children }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── Contract Operations ──────────────────────────────────────────────────

  // GET /contracts
  const getAllContracts = useCallback(async (status = null) => {
    try {
      setLoading(true);
      setError(null);
      const url = status
        ? `/contracts?status=${encodeURIComponent(status)}`
        : "/contracts";
      const response = await apiClient.get(url);
      const data = response.contracts || [];
      setContracts(Array.isArray(data) ? data : []);
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch contracts";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /contracts/{contractId}
  const getContractById = useCallback(async (contractId) => {
    try {
      setError(null);
      const response = await apiClient.get(`/contracts/${contractId}`);
      return { ok: true, data: response };
    } catch (err) {
      const errorMessage =
        err.message || `Failed to fetch contract ${contractId}`;
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    }
  }, []);

  // POST /contracts
  const createContract = useCallback(async (contractData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post("/contracts", contractData);
      const newContract = response.contract;
      setContracts((prev) => [newContract, ...prev]);
      return {
        ok: true,
        data: newContract,
        message: "Contract created successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to create contract";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /contracts/{contractId}
  const updateContract = useCallback(async (contractId, contractData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.patch(
        `/contracts/${contractId}`,
        contractData,
      );
      const updated = response.contract;
      setContracts((prev) =>
        prev.map((c) => (c.contractId === contractId ? updated : c)),
      );
      return {
        ok: true,
        data: updated,
        message: "Contract updated successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to update contract";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /contracts/{contractId}
  const deleteContract = useCallback(async (contractId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/contracts/${contractId}`);
      setContracts((prev) => prev.filter((c) => c.contractId !== contractId));
      return { ok: true, message: "Contract deleted successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete contract";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Visit Operations ─────────────────────────────────────────────────────

  // GET /contracts/visits
  const getAllVisits = useCallback(async (status = null) => {
    try {
      setLoading(true);
      setError(null);
      const url = status
        ? `/contracts/visits?status=${encodeURIComponent(status)}`
        : "/contracts/visits";
      const response = await apiClient.get(url);
      return { ok: true, data: response.visits || [] };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch visits";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /contracts/{contractId}/visits
  const getVisitsByContract = useCallback(async (contractId) => {
    try {
      setError(null);
      const response = await apiClient.get(`/contracts/${contractId}/visits`);
      return { ok: true, data: response.visits || [] };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch visits";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    }
  }, []);

  // POST /contracts/{contractId}/visits
  const addVisit = useCallback(async (contractId, visitData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post(
        `/contracts/${contractId}/visits`,
        visitData,
      );
      const data = response.visit;
      return { ok: true, data, message: "Visit created successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to create visit";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /contracts/{contractId}/visits/{visitId}
  const updateVisit = useCallback(async (contractId, visitId, visitData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.patch(
        `/contracts/${contractId}/visits/${visitId}`,
        visitData,
      );
      const data = response.visit;
      return { ok: true, data, message: "Visit updated successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to update visit";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /contracts/{contractId}/visits/{visitId}
  const deleteVisit = useCallback(async (contractId, visitId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/contracts/${contractId}/visits/${visitId}`);
      return { ok: true, message: "Visit deleted successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete visit";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /contracts/{contractId}/inspections
  const addContractInspection = useCallback(
    async (contractId, inspectionData) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.post(
          `/contracts/${contractId}/inspections`,
          inspectionData,
        );
        const data = response.inspection || response.data;
        return {
          ok: true,
          data,
          message: "Contract inspection added successfully",
        };
      } catch (err) {
        const errorMessage = err.message || "Failed to add contract inspection";
        setError(errorMessage);
        return { ok: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // PATCH /contracts/{contractId}/inspections/{inspectionId}
  const updateContractInspection = useCallback(
    async (contractId, inspectionId, inspectionData) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.patch(
          `/contracts/${contractId}/inspections/${inspectionId}`,
          inspectionData,
        );
        const data = response.inspection || response.data;
        return {
          ok: true,
          data,
          message: "Contract inspection updated successfully",
        };
      } catch (err) {
        const errorMessage =
          err.message || "Failed to update contract inspection";
        setError(errorMessage);
        return { ok: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // DELETE /contracts/{contractId}/inspections/{inspectionId}
  const deleteContractInspection = useCallback(
    async (contractId, inspectionId) => {
      try {
        setLoading(true);
        setError(null);
        await apiClient.delete(
          `/contracts/${contractId}/inspections/${inspectionId}`,
        );
        return {
          ok: true,
          message: "Contract inspection deleted successfully",
        };
      } catch (err) {
        const errorMessage =
          err.message || "Failed to delete contract inspection";
        setError(errorMessage);
        return { ok: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const value = {
    contracts,
    loading,
    error,
    // contracts
    getAllContracts,
    getContractById,
    createContract,
    updateContract,
    deleteContract,
    // visits
    getAllVisits,
    getVisitsByContract,
    addVisit,
    updateVisit,
    deleteVisit,
    // inspections
    addContractInspection,
    updateContractInspection,
    deleteContractInspection,
  };

  return (
    <ContractsContext.Provider value={value}>
      {children}
    </ContractsContext.Provider>
  );
};;

export default ContractsContext;
