import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a new role
  const createRole = useCallback(async (roleData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post("/roles", roleData);
      const newRole = response.data;

      setRoles((prevRoles) => [...prevRoles, newRole]);
      return newRole;
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a role
  const deleteRole = useCallback(async (roleId) => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.delete(`/roles/${roleId}`);

      setRoles((prevRoles) =>
        prevRoles.filter((role) => role.roleId !== roleId),
      );
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all roles
  const getRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get("/roles");
      setRoles(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roles]);



  // Clear errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    roles,
    loading,
    error,
    createRole,
    deleteRole,
    getRoles,
    clearError,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export default RoleContext;
