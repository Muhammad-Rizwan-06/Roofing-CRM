// ─── SuppliersContext.jsx ─────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const SuppliersContext = createContext(null);

export function SuppliersProvider({ children }) {
  const [suppliers, setSuppliers] = useState([]);
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

  // GET /suppliers
  const fetchSuppliers = useCallback(async () => {
    handleStart();
    try {
      const res = await apiClient.get("/suppliers");
      setSuppliers(res.suppliers ?? []);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /suppliers
  const addSupplier = useCallback(async (data) => {
    handleStart();
    try {
      const res = await apiClient.post("/suppliers", data);
      const newSupplier = res.supplier;
      setSuppliers((prev) => [newSupplier, ...prev]);
      return newSupplier;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /suppliers/{supplierId}
  const updateSupplier = useCallback(async (supplierId, updates) => {
    handleStart();
    try {
      const res = await apiClient.patch(`/suppliers/${supplierId}`, updates);
      const updatedSupplier = res.supplier;
      setSuppliers((prev) =>
        prev.map((s) => (s.supplierId === supplierId ? updatedSupplier : s)),
      );
      return updatedSupplier;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /suppliers/{supplierId}
  const deleteSupplier = useCallback(async (supplierId) => {
    handleStart();
    try {
      await apiClient.delete(`/suppliers/${supplierId}`);
      setSuppliers((prev) => prev.filter((s) => s.supplierId !== supplierId));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SuppliersContext.Provider
      value={{
        suppliers,
        loading,
        error,
        fetchSuppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
      }}
    >
      {children}
    </SuppliersContext.Provider>
  );
}

export function useSuppliers() {
  const ctx = useContext(SuppliersContext);
  if (!ctx)
    throw new Error("useSuppliers must be used inside <SuppliersProvider>");
  return ctx;
}
