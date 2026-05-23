import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const UserContext = createContext();

export const UserUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("UserUser must be used within an UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
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
    (userId) => {
      return employees.find((employee) => employee.userId === userId);
    },
    [employees]
  );

  // Update an employee
  const update = useCallback(async (userId, employeeData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.put(`/users/${userId}`, employeeData);
      const updatedEmployee = response;

      setEmployees((prevEmployees) =>
        prevEmployees.map((employee) =>
          employee.userId === userId
            ? {
                ...employee,
                ...employeeData,
                updatedAt: new Date().toISOString(),
              }
            : employee
        )
      );

      return getById(userId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getById]);

  // Delete an employee
  const delete_ = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.delete(`/users/${userId}`);

      setEmployees((prevEmployees) =>
        prevEmployees.filter((employee) => employee.userId !== userId)
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
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
};

export default UserContext;