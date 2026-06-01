// ─── MaterialsContext.jsx ─────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const MaterialsContext = createContext(null);

export function MaterialsProvider({ children }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = () => {
    setLoading(true);
    setError(null);
  };
  const handleError = (e) => {
    setError(e?.message ?? "Something went wrong");
    setLoading(false);
  };

  // GET /materials  (?supplierId=<id>)
  const fetchMaterials = useCallback(async (filters = {}) => {
    handleStart();
    try {
      const params = new URLSearchParams();
      if (filters.supplierId) params.set("supplierId", filters.supplierId);

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiClient.get(`/materials${query}`);
      setMaterials(res.materials ?? []);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /materials
  const addMaterial = useCallback(async (data) => {
    handleStart();
    try {
      const res = await apiClient.post("/materials", data);
      const newMaterial = res.material;
      setMaterials((prev) => [newMaterial, ...prev]);
      return newMaterial;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /materials/{materialId}  — full edit
  const updateMaterial = useCallback(async (materialId, updates) => {
    handleStart();
    try {
      const res = await apiClient.patch(`/materials/${materialId}`, updates);
      const updatedMaterial = res.material;
      setMaterials((prev) =>
        prev.map((m) => (m.materialId === materialId ? updatedMaterial : m)),
      );
      return updatedMaterial;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /materials/{materialId}  — stock adjust only  { stockDelta: +1 | -1 }
  const adjustStock = useCallback(async (materialId, delta) => {
    handleStart();
    try {
      const res = await apiClient.patch(`/materials/${materialId}`, {
        stockDelta: delta,
      });
      const updatedMaterial = res.material;
      setMaterials((prev) =>
        prev.map((m) => (m.materialId === materialId ? updatedMaterial : m)),
      );
      return updatedMaterial;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /materials/{materialId}
  const deleteMaterial = useCallback(async (materialId) => {
    handleStart();
    try {
      await apiClient.delete(`/materials/${materialId}`);
      setMaterials((prev) => prev.filter((m) => m.materialId !== materialId));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <MaterialsContext.Provider
      value={{
        materials,
        loading,
        error,
        fetchMaterials,
        addMaterial,
        updateMaterial,
        adjustStock,
        deleteMaterial,
      }}
    >
      {children}
    </MaterialsContext.Provider>
  );
}

export function useMaterials() {
  const ctx = useContext(MaterialsContext);
  if (!ctx)
    throw new Error("useMaterials must be used inside <MaterialsProvider>");
  return ctx;
}
