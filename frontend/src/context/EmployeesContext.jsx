import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const EmployeesContext = createContext(null);

export const useEmployees = () => {
  const context = useContext(EmployeesContext);
  if (!context) {
    throw new Error("useEmployees must be used within EmployeesProvider");
  }
  return context;
};

export const EmployeesProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GET /employees
  const getAllEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/employees");
      const data = response.employees || [];
      setEmployees(Array.isArray(data) ? data : []);
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch employees";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /employees
  const addEmployee = useCallback(async (employeeData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post("/employees", employeeData);
      const newEmployee = response.employee;
      setEmployees((prev) => [newEmployee, ...prev]);
      return {
        ok: true,
        data: newEmployee,
        message: "Employee created successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to create employee";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /employees/{employeeId}
  const updateEmployee = useCallback(async (employeeId, employeeData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.patch(
        `/employees/${employeeId}`,
        employeeData,
      );
      const updatedEmployee = response.employee;
      setEmployees((prev) =>
        prev.map((e) => (e.employeeId === employeeId ? updatedEmployee : e)),
      );
      return {
        ok: true,
        data: updatedEmployee,
        message: "Employee updated successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to update employee";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /employees/{employeeId}
  const deleteEmployee = useCallback(async (employeeId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/employees/${employeeId}`);
      setEmployees((prev) => prev.filter((e) => e.employeeId !== employeeId));
      return { ok: true, message: "Employee deleted successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete employee";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    employees,
    loading,
    error,
    getAllEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };

  return (
    <EmployeesContext.Provider value={value}>
      {children}
    </EmployeesContext.Provider>
  );
};

export default EmployeesContext;
