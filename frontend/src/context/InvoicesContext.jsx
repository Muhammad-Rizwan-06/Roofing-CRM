import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const InvoicesContext = createContext(null);

export const useInvoices = () => {
  const context = useContext(InvoicesContext);
  if (!context) {
    throw new Error("useInvoices must be used within InvoicesProvider");
  }
  return context;
};

export const InvoicesProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GET /invoices
  const getAllInvoices = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.projectId) params.append("projectId", filters.projectId);

      const url = params.toString() ? `/invoices?${params}` : "/invoices";
      const response = await apiClient.get(url);
      const data = response.invoices || [];
      setInvoices(Array.isArray(data) ? data : []);
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch invoices";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /invoices
  const addInvoice = useCallback(async (invoiceData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post("/invoices", invoiceData);
      const newInvoice = response.invoice;
      setInvoices((prev) => [newInvoice, ...prev]);
      return {
        ok: true,
        data: newInvoice,
        message: "Invoice created successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to create invoice";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /invoices/{invoiceId}
  const updateInvoice = useCallback(async (invoiceId, invoiceData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.patch(
        `/invoices/${invoiceId}`,
        invoiceData,
      );
      const updatedInvoice = response.invoice;
      setInvoices((prev) =>
        prev.map((inv) => (inv.invoiceId === invoiceId ? updatedInvoice : inv)),
      );
      return {
        ok: true,
        data: updatedInvoice,
        message: "Invoice updated successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to update invoice";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /invoices/{invoiceId}
  const deleteInvoice = useCallback(async (invoiceId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/invoices/${invoiceId}`);
      setInvoices((prev) => prev.filter((inv) => inv.invoiceId !== invoiceId));
      return { ok: true, message: "Invoice deleted successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete invoice";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    invoices,
    loading,
    error,
    getAllInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
  };

  return (
    <InvoicesContext.Provider value={value}>
      {children}
    </InvoicesContext.Provider>
  );
};

export default InvoicesContext;
