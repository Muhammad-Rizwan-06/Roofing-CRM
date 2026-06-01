import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const CompanyContext = createContext(null);

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GET - Fetch company data
  const getCompany = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/company");
      setCompany(response);
      return response;
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch company data";
      setError(errorMessage);
      console.error("Get company error:", err);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PUT - Update company data
  const updateCompany = useCallback(async (updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put("/company", updates);
      const updatedData = response;
      setCompany((prev) => ({ ...prev, ...updatedData }));
      return { ok: true, data: updatedData };
    } catch (err) {
      const errorMessage = err.message || "Failed to update company data";
      setError(errorMessage);
      console.error("Update company error:", err);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PUT - Update specific company field
  const updateCompanyField = useCallback(
    async (field, value) => {
      return updateCompany({ [field]: value });
    },
    [updateCompany],
  );

  const value = {
    company,
    loading,
    error,
    getCompany,
    updateCompany,
    updateCompanyField,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};

// Custom hook - use this everywhere
export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
};
