import React, { useEffect, useMemo, useState } from "react";
import ProjectsTable from "../components/projects/ProjectsTable";
import AddProjectModal from "../components/projects/AddProjectModal";
import { useAuth } from "../context/AuthContext";
import { ROLE } from "../config/accessControl";

const Projects = () => {
  const { user } = useAuth();
  const roleName = user?.roleName;

  const isAdmin = roleName === ROLE.ADMIN;
  const isPM = roleName === ROLE.PM;
  const isWorker = roleName === ROLE.WORKER;
  const isAccountant = roleName === ROLE.ACCOUNTANT;

  // ✅ As per your roles:
  // Admin/PM can create/update/delete projects
  // Worker/Accountant = read-only
  const canManageProjects = isAdmin || isPM;
  const readOnly = isWorker || isAccountant;

  const [projects, setProjects] = useState(() => {
    const stored = localStorage.getItem("projects");
    return stored ? JSON.parse(stored) : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supervisorFilter, setSupervisorFilter] = useState("");

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  const handleAddProject = (project) => {
    if (!canManageProjects) return;

    if (editProject) {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    } else {
      setProjects((prev) => [...prev, project]);
    }
  };

  const handleDelete = (id) => {
    if (!canManageProjects) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEdit = (project) => {
    if (!canManageProjects) return;
    setEditProject(project);
    setIsModalOpen(true);
  };

  const handleStatusChange = (projectId, newStatus) => {
    if (!canManageProjects) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;

        const completedAt =
          newStatus === "Completed"
            ? p.completedAt || new Date().toISOString()
            : p.completedAt;

        return { ...p, status: newStatus, completedAt };
      })
    );
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
    return [...new Set((projects || []).map((p) => p.supervisor).filter(Boolean))];
  }, [projects]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
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
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            + Add Project
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-60"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={supervisorFilter}
          onChange={(e) => setSupervisorFilter(e.target.value)}
          className="border p-2 rounded"
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
          className="bg-gray-200 px-3 py-2 rounded"
        >
          Reset
        </button>
      </div>

      <ProjectsTable
        projects={filteredProjects}
        onDelete={canManageProjects ? handleDelete : undefined}
        onEdit={canManageProjects ? handleEdit : undefined}
        onStatusChange={canManageProjects ? handleStatusChange : undefined}
        readOnly={!canManageProjects}
        basePath="/projects"
      />

      {canManageProjects && (
        <AddProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddProject={handleAddProject}
          editProject={editProject}
        />
      )}
    </div>
  );
};

export default Projects;