import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

const ProjectsContext = createContext(null);

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within ProjectsProvider");
  }
  return context;
};

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [dashboardProjects, setDashboardProjects] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GET /projects — all projects, no linked items
  const getAll = useCallback(async (status = null) => {
    try {
      setLoading(true);
      setError(null);
      const url = status
        ? `/projects?status=${encodeURIComponent(status)}`
        : "/projects";
      const response = await apiClient.get(url);
      const data = response.projects;
      setProjects(Array.isArray(data) ? data : []);
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch projects";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /projects/dashboard — all projects, with linked items
  const getDashboardProjects = useCallback(async (status = null) => {
    try {
      setLoading(true);
      setError(null);
      const url = "/projects/dashboard";
      const response = await apiClient.get(url);
      const data = response.projects;
      setDashboardProjects(Array.isArray(data) ? data : []);
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch projects";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /projects/{projectId} — project + materials, workers, tasks
  const getById = useCallback(async (projectId) => {
    try {
      setError(null);
      const response = await apiClient.get(`/projects/${projectId}`);
      const data = response.data || response;
      return { ok: true, data };
    } catch (err) {
      const errorMessage =
        err.message || `Failed to fetch project ${projectId}`;
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    }
  }, []);

  // POST /projects
  const createProject = useCallback(async (projectData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post("/projects", projectData);
      const newProject = response.project;
      setProjects((prev) => [...prev, newProject]);
      return {
        ok: true,
        data: newProject,
        message: "Project created successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to create project";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /projects/{projectId}
  const updateProject = useCallback(async (projectId, projectData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.patch(
        `/projects/${projectId}`,
        projectData,
      );
      const updatedProject = response.project;
      setProjects((prev) =>
        prev.map((p) => (p.projectId === projectId ? updatedProject : p)),
      );
      return {
        ok: true,
        data: updatedProject,
        message: "Project updated successfully",
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to update project";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /projects/{projectId}
  const deleteProject = useCallback(async (projectId, startDate) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/projects/${projectId}`, { data: { startDate } });
      setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
      return { ok: true, message: "Project deleted successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete project";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /projects/{projectId}/materials
  const addMaterial = useCallback(async (projectId, materialData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post(
        `/projects/${projectId}/materials`,
        materialData,
      );
      const data = response.material || response.data;
      // Update the project in the projects array to include the new material
      setProjects((prev) =>
        prev.map((p) =>
          p.projectId === projectId
            ? { ...p, materials: [...(p.materials || []), data] }
            : p,
        ),
      );
      return { ok: true, data, message: "Material added successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to add material";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /projects/{projectId}/workers
  const addWorker = useCallback(async (projectId, workerData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post(
        `/projects/${projectId}/workers`,
        workerData,
      );
      const data = response.worker || response.data;
      // Update the project in the projects array to include the new worker
      setProjects((prev) =>
        prev.map((p) =>
          p.projectId === projectId
            ? { ...p, workers: [...(p.workers || []), data] }
            : p,
        ),
      );
      return { ok: true, data, message: "Worker added successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to add worker";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /projects/{projectId}/tasks
  const addTask = useCallback(async (projectId, taskData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post(
        `/projects/${projectId}/tasks`,
        taskData,
      );
      const data = response.task || response.data;
      // Update the project in the projects array to include the new task
      setProjects((prev) =>
        prev.map((p) =>
          p.projectId === projectId
            ? { ...p, tasks: [...(p.tasks || []), data] }
            : p,
        ),
      );
      return { ok: true, data, message: "Task added successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to add task";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /projects/{projectId}/inspections
  const addInspection = useCallback(async (projectId, inspectionData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post(
        `/projects/${projectId}/inspections`,
        inspectionData,
      );
      const data = response.inspection || response.data;
      setProjects((prev) =>
        prev.map((p) =>
          p.projectId === projectId
            ? { ...p, inspections: [...(p.inspections || []), data] }
            : p,
        ),
      );
      // Also add to global inspections state
      setInspections((prev) => [...prev, data]);
      return { ok: true, data, message: "Inspection added successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to add inspection";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /projects/{projectId}/inspections
  const getInspections = useCallback(async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(
        `/projects/${projectId}/inspections`,
      );
      const data = response.inspections || [];
      setProjects((prev) =>
        prev.map((p) =>
          p.projectId === projectId ? { ...p, inspections: data } : p,
        ),
      );
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch inspections";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /projects/{projectId}/inspections/{inspectionId}
  const updateInspection = useCallback(
    async (projectId, inspectionId, inspectionData) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.patch(
          `/projects/${projectId}/inspections/${inspectionId}`,
          inspectionData,
        );
        const data = response.inspection || response.data;
        setProjects((prev) =>
          prev.map((p) =>
            p.projectId === projectId
              ? {
                  ...p,
                  inspections: (p.inspections || []).map((i) =>
                    i.inspectionId === inspectionId ? data : i,
                  ),
                }
              : p,
          ),
        );
        // Also update global inspections state
        setInspections((prev) =>
          prev.map((i) =>
            i.inspectionId === inspectionId ? data : i,
          ),
        );
        return { ok: true, data, message: "Inspection updated successfully" };
      } catch (err) {
        const errorMessage = err.message || "Failed to update inspection";
        setError(errorMessage);
        return { ok: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // DELETE /projects/{projectId}/inspections/{inspectionId}
  const deleteInspection = useCallback(async (projectId, inspectionId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(
        `/projects/${projectId}/inspections/${inspectionId}`,
      );
      setProjects((prev) =>
        prev.map((p) =>
          p.projectId === projectId
            ? {
                ...p,
                inspections: (p.inspections || []).filter(
                  (i) => i.inspectionId !== inspectionId,
                ),
              }
            : p,
        ),
      );
      // Also remove from global inspections state
      setInspections((prev) =>
        prev.filter((i) => i.inspectionId !== inspectionId),
      );
      return { ok: true, message: "Inspection deleted successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete inspection";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllInspections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/projects/inspections");
      const data = response.inspections || [];
      setInspections(data);
      return { ok: true, data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch inspections";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /projects/workorders — all work orders globally
  const getAllWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/projects/workorders");
      return { ok: true, data: response.workOrders || [] };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch work orders";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /projects/{projectId}/workorders
  const addWorkOrder = useCallback(async (projectId, workOrderData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post(
        `/projects/${projectId}/workorders`,
        workOrderData,
      );
      const data = response.workOrder || response.data;
      setProjects((prev) =>
        prev.map((p) =>
          p.projectId === projectId
            ? { ...p, workOrders: [...(p.workOrders || []), data] }
            : p,
        ),
      );
      return { ok: true, data, message: "Work order created successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to create work order";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /projects/{projectId}/workorders/{workOrderId}
  const updateWorkOrder = useCallback(
    async (projectId, workOrderId, workOrderData) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.patch(
          `/projects/${projectId}/workorders/${workOrderId}`,
          workOrderData,
        );
        const data = response.workOrder || response.data;
        setProjects((prev) =>
          prev.map((p) =>
            p.projectId === projectId
              ? {
                  ...p,
                  workOrders: (p.workOrders || []).map((w) =>
                    w.workOrderId === `WORKORDER#${workOrderId}` ? data : w,
                  ),
                }
              : p,
          ),
        );
        return { ok: true, data, message: "Work order updated successfully" };
      } catch (err) {
        const errorMessage = err.message || "Failed to update work order";
        setError(errorMessage);
        return { ok: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // DELETE /projects/{projectId}/workorders/{workOrderId}
  const deleteWorkOrder = useCallback(async (projectId, workOrderId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(
        `/projects/${projectId}/workorders/${workOrderId}`,
      );
      setProjects((prev) =>
        prev.map((p) =>
          p.projectId === projectId
            ? {
                ...p,
                workOrders: (p.workOrders || []).filter(
                  (w) => w.workOrderId !== `WORKORDER#${workOrderId}`,
                ),
              }
            : p,
        ),
      );
      return { ok: true, message: "Work order deleted successfully" };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete work order";
      setError(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  //GET /projects/{projectId}/workorders
  const getWorkOrders = useCallback(async (projectId) => {
    try {
      const response = await apiClient.get(
        `/projects/${projectId}/workorders`,
      );
      return { ok: true, data: response.workOrders || [] };
    } catch (err) {
      return {
        ok: false,
        message: err.message || "Failed to fetch work orders",
      };
    }
  }, []);


  const value = {
    projects,
    dashboardProjects,
    inspections,
    loading,
    error,
    getAll,
    getDashboardProjects,
    getById,
    createProject,
    updateProject,
    deleteProject,
    addMaterial,
    addWorker,
    addTask,
    addInspection,
    getInspections,
    updateInspection,
    deleteInspection,
    getAllInspections,
    addWorkOrder,
    getWorkOrders,
    updateWorkOrder,
    deleteWorkOrder,
    getAllWorkOrders,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};

export default ProjectsContext;
