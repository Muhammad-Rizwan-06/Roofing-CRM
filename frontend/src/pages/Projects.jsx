import React, { useEffect, useMemo, useState } from "react";
import ProjectsTable from "../components/projects/ProjectsTable";
import AddProjectModal from "../components/projects/AddProjectModal";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../context/ProjectsContext";
import { ROLE } from "../config/accessControl";

const Projects = () => {
  const { user } = useAuth();
  const roleName = user?.roleName;

  const isAdmin = roleName === ROLE.ADMIN;
  const isPM = roleName === ROLE.PM;
  const isWorker = roleName === ROLE.WORKER;
  const isAccountant = roleName === ROLE.ACCOUNTANT;

  // ✅ Permissions
  const canManageProjects = isAdmin || isPM;
  const readOnly = isWorker || isAccountant;

  // ✅ Use ProjectsContext instead of localStorage
  const {
    projects,
    loading,
    error,
    getAll,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supervisorFilter, setSupervisorFilter] = useState("");

  const [message, setMessage] = useState(null);

  // ✅ Fetch projects on mount
  useEffect(() => {
    getAll();
  }, [getAll]);

  // Auto-dismiss message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAddProject = async (project) => {
    if (!canManageProjects) return;

    if (editProject) {
      // ✅ Update existing project
      const result = await updateProject(
        editProject.projectId || editProject.id,
        {
          name: project.name,
          client: project.client,
          clientEmail: project.clientEmail,
          status: project.status,
          supervisor: project.supervisor,
          team: project.team,
          budget: Number(project.budget || 0),
        },
      );

      if (result.ok) {
        setMessage({
          type: "success",
          text: result.message || "Project updated successfully",
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to update project",
        });
      }
    } else {
      // ✅ Create new project
      const result = await createProject({
        name: project.name,
        client: project.client,
        clientEmail: project.clientEmail,
        status: project.status || "Pending",
        supervisor: project.supervisor || "",
        team: project.team || "",
        budget: Number(project.budget || 0),
        source: "Through Form",
      });

      if (result.ok) {
        setMessage({
          type: "success",
          text: result.message || "Project created successfully",
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to create project",
        });
      }
    }

    setIsModalOpen(false);
    setEditProject(null);
  };

  const handleDelete = async (projectId) => {
    if (!canManageProjects) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this project?",
    );
    if (!confirmed) return;

    const result = await deleteProject(projectId);
    if (result.ok) {
      setMessage({
        type: "success",
        text: result.message || "Project deleted successfully",
      });
    } else {
      setMessage({
        type: "error",
        text: result.message || "Failed to delete project",
      });
    }
  };

  const handleEdit = (project) => {
    if (!canManageProjects) return;
    setEditProject(project);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (projectId, newStatus) => {
    if (!canManageProjects) return;

    const project = projects.find(
      (p) => p.projectId === projectId,
    );
    if (!project) return;

    console.log(`Changing status of project ${projectId} to ${newStatus}`);

    const result = await updateProject(projectId, {
      status: newStatus,
      completedAt:
        newStatus === "Completed"
          ? project.completedAt || new Date().toISOString()
          : null,
    });

    if (!result.ok) {
      setMessage({
        type: "error",
        text: result.message || "Failed to update project status",
      });
    }
  };

  const filteredProjects = useMemo(() => {
    return (projects || []).filter((p) => {
      const name = String(p.name || "").toLowerCase();
      return (
        name.includes(search.toLowerCase()) &&
        (statusFilter ? p.status === statusFilter : true) &&
        (supervisorFilter ? p.supervisor === supervisorFilter : true)
      );
    });
  }, [projects, search, statusFilter, supervisorFilter]);

  const supervisors = useMemo(() => {
    return [
      ...new Set((projects || []).map((p) => p.supervisor).filter(Boolean)),
    ];
  }, [projects]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl dark:text-white font-bold">Projects</h1>
          {readOnly && (
            <p className="text-sm text-gray-500 mt-1">
              Read-only access for your role.
            </p>
          )}
        </div>

        {canManageProjects && (
          <button
            onClick={() => {
              setEditProject(null);
              setIsModalOpen(true);
            }}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition"
          >
            + Add Project
          </button>
        )}
      </div>

      {/* ✅ Loading state */}
      {/* {loading && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Loading projects...
        </div>
      )} */}

      {/* ✅ Error state */}
      {/* {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
          Error: {error}
        </div>
      )} */}

      {/* ✅ Message state */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-60 dark:bg-gray-800 dark:text-white"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={supervisorFilter}
          onChange={(e) => setSupervisorFilter(e.target.value)}
          className="border p-2 rounded dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Supervisors</option>
          {supervisors.map((sup, i) => (
            <option key={i} value={sup}>
              {sup}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearch("");
            setStatusFilter("");
            setSupervisorFilter("");
          }}
          className="bg-gray-200 dark:bg-gray-800 dark:text-white px-3 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition"
        >
          Reset
        </button>
      </div>

      {/* Projects Table */}
      <ProjectsTable
        projects={filteredProjects}
        onDelete={canManageProjects ? handleDelete : undefined}
        onEdit={canManageProjects ? handleEdit : undefined}
        onStatusChange={canManageProjects ? handleStatusChange : undefined}
        readOnly={!canManageProjects}
        basePath="/projects"
      />

      {/* Modal */}
      {canManageProjects && (
        <AddProjectModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditProject(null);
          }}
          onAddProject={handleAddProject}
          editProject={editProject}
        />
      )}
    </div>
  );
};

export default Projects;
