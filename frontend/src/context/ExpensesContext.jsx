import { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

// ─── Context ──────────────────────────────────────────────────────────────────

const ExpensesContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ExpensesProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── helpers ──────────────────────────────────────────────────────────────────

  const handleStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleError = (e) => {
    setError(e?.message ?? "Something went wrong");
    setLoading(false);
  };

  // ── GET /expenses ─────────────────────────────────────────────────────────────
  /**
   * @param {{ projectId?: string }} filters - optional
   */
  
  const fetchExpenses = useCallback(async (filters = {}) => {
    handleStart();
    try {
      const params = new URLSearchParams();
      if (filters.projectId) params.set("projectId", filters.projectId);

      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await apiClient.get(`/expenses${query}`);

      setExpenses(response.expenses ?? []);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── POST /expenses ────────────────────────────────────────────────────────────
  /**
   * @param {{
   *   projectId?:   string,
   *   projectName?: string,
   *   category:     string,
   *   vendor?:      string,
   *   date:         string,
   *   amount:       number,
   *   notes?:       string
   * }} expenseData
   * @returns {object} created expense
   */
  const addExpense = useCallback(async (expenseData) => {
    handleStart();
    try {
      const response = await apiClient.post("/expenses", expenseData);
      const newExpense = response.expense;

      setExpenses((prev) => [newExpense, ...prev]);
      return newExpense;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── DELETE /expenses/{expenseId} ──────────────────────────────────────────────
  /**
   * @param {string} expenseId
   */
  const deleteExpense = useCallback(async (expenseId) => {
    handleStart();
    try {
      await apiClient.delete(`/expenses/${expenseId}`);

      setExpenses((prev) => prev.filter((e) => e.expenseId !== expenseId));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── context value ─────────────────────────────────────────────────────────────

  const value = {
    // state
    expenses,
    loading,
    error,

    // actions
    fetchExpenses,
    addExpense,
    deleteExpense,
  };

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * const {
 *   expenses, loading, error,
 *   fetchExpenses, addExpense, deleteExpense
 * } = useExpenses();
 */
export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error("useExpenses must be used inside an <ExpensesProvider>");
  }
  return context;
}
