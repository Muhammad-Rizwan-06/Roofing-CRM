import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const EmployeeContext = createContext();

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error("useEmployee must be used within an EmployeeProvider");
  }
  return context;
};

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all employees
  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get("/users");
      console.log("Fetched employees:", response);
      setEmployees(response);
      return response;

      return employees;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [employees]);

  // Create a new employee
  const create = useCallback(async (employeeData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post("/users", employeeData);
      const newEmployee = response.user;
      console.log("New employee created:", newEmployee);


    //   const newEmployee = {
    //     employeeId: Date.now().toString(),
    //     ...employeeData,
    //     createdAt: new Date().toISOString(),
    //   };

      setEmployees((prevEmployees) => [...prevEmployees, newEmployee]);
      return newEmployee;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get employee by ID
  const getById = useCallback(
    (employeeId) => {
      return employees.find((employee) => employee.employeeId === employeeId);
    },
    [employees]
  );

  // Update an employee
  const update = useCallback(async (employeeId, employeeData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.put(`/users/${employeeId}`, employeeData);
      const updatedEmployee = response;

      setEmployees((prevEmployees) =>
        prevEmployees.map((employee) =>
          employee.employeeId === employeeId
            ? {
                ...employee,
                ...employeeData,
                updatedAt: new Date().toISOString(),
              }
            : employee
        )
      );

      return getById(employeeId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getById]);

  // Delete an employee
  const delete_ = useCallback(async (employeeId) => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.delete(`/users/${employeeId}`);

      setEmployees((prevEmployees) =>
        prevEmployees.filter((employee) => employee.employeeId !== employeeId)
      );
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    employees,
    loading,
    error,
    getAll,
    create,
    getById,
    update,
    delete: delete_,
    clearError,
  };

  return (
    <EmployeeContext.Provider value={value}>{children}</EmployeeContext.Provider>
  );
};

export default EmployeeContext;