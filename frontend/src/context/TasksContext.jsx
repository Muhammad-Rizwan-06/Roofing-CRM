import { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

// ─── Context ──────────────────────────────────────────────────────────────────

const TasksContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────


export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── helpers ─────────────────────────────────────────────────────────────────

  const handleStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleError = (e) => {
    setError(e?.message ?? "Something went wrong");
    setLoading(false);
  };

  // ── GET /tasks ───────────────────────────────────────────────────────────────
  /**
   * Fetches all tasks.
   * @param {{ status?: string, employeeId?: string }} filters - optional query params
   */
  const fetchTasks = useCallback(async (filters = {}) => {
    handleStart();
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.employeeId) params.set("employeeId", filters.employeeId);

      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await apiClient.get(`/tasks${query}`);

      setTasks(response.tasks ?? []);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── POST /tasks ──────────────────────────────────────────────────────────────
  /**
   * Creates a new task and appends it to local state.
   * @param {{
   *   title: string,
   *   projectId: string,
   *   projectName?: string,
   *   employeeId?: string,
   *   worker?: string,
   *   startDate?: string,
   *   endDate?: string,
   *   priority?: "Low"|"Medium"|"High",
   *   status?: "Pending"|"In Progress"|"Completed"
   * }} taskData
   * @returns {object} created task
   */
  const addTask = useCallback(async (taskData) => {
    handleStart();
    try {
      const response = await apiClient.post("/tasks", taskData);
      const newTask = response.task;

      setTasks((prev) => [...prev, newTask]);
      return newTask;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── PATCH /tasks/{taskId} ────────────────────────────────────────────────────
  /**
   * Updates any fields on an existing task.
   * @param {string} taskId
   * @param {Partial<Task>} updates - fields to update (PK/SK/taskId/entityType/CreatedAt are blocked server-side)
   * @returns {object} updated task
   */
  const updateTask = useCallback(async (taskId, updates) => {
    handleStart();
    try {
      const response = await apiClient.patch(`/tasks/${taskId}`, updates);
      const updatedTask = response.task;

      setTasks((prev) =>
        prev.map((t) => (t.taskId === taskId ? updatedTask : t)),
      );
      return updatedTask;
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── DELETE /tasks/{taskId} ───────────────────────────────────────────────────
  /**
   * Deletes a task and removes it from local state.
   * @param {string} taskId
   */
  const deleteTask = useCallback(async (taskId) => {
    handleStart();
    try {
      await apiClient.delete(`/tasks/${taskId}`);

      setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── context value ────────────────────────────────────────────────────────────

  const value = {
    // state
    tasks,
    loading,
    error,

    // actions
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
  };

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook to consume the TasksContext.
 *
 * const {
 *   tasks, loading, error,
 *   fetchTasks, addTask, updateTask, deleteTask
 * } = useTasks();
 */
export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used inside a <TasksProvider>");
  }
  return context;
}
