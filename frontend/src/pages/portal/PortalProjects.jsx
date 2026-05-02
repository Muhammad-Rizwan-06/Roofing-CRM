import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCustomerProjects } from "../../utils/customerScope";
import ProjectsTable from "../../components/projects/ProjectsTable";

export default function PortalProjects() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const projects = useMemo(() => JSON.parse(localStorage.getItem("projects")) || [], []);
  const myProjects = useMemo(() => getCustomerProjects(projects, user), [projects, user]);

  const filtered = useMemo(() => {
    return myProjects.filter((p) =>
      String(p.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [myProjects, search]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">Read-only</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-60"
        />
      </div>

      <ProjectsTable projects={filtered} readOnly basePath="/portal/projects" />
    </div>
  );
}