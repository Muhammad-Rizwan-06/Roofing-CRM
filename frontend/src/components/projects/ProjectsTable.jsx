import React from "react";
import { Link } from "react-router-dom";

const statusStyles = {
  Pending: "bg-gray-100 text-gray-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Completed: "bg-green-100 text-green-700",
};

const ProjectsTable = ({
  projects,
  onDelete,
  onEdit,
  onStatusChange,
  readOnly = false,
  basePath = "/projects",
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wide">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Client</th>
            <th className="p-3">Status</th>
            <th className="p-3">Budget</th>
            <th className="p-3">Supervisor</th>
            <th className="p-3">Team</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => {
            const badgeClass =
              statusStyles[project.status] || "bg-gray-100 text-gray-700";

            return (
              <tr
                key={project.id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="p-3">{project.name}</td>
                <td className="p-3">{project.client}</td>

                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${badgeClass}`}
                    >
                      {project.status}
                    </span>

                    {!readOnly && (
                      <select
                        value={project.status || "Pending"}
                        onChange={(e) =>
                          onStatusChange?.(project.id, e.target.value)
                        }
                        className="border rounded-lg px-2 py-1 text-sm bg-white"
                        title="Change project status"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    )}
                  </div>
                </td>

                <td className="p-3">${project.budget}</td>
                <td className="p-3">{project.supervisor || "-"}</td>
                <td className="p-3">{project.team || "-"}</td>

                <td className="p-3 space-x-3">
                  <Link
                    to={`${basePath}/${project.id}`}
                    className="text-green-600 font-medium"
                  >
                    View
                  </Link>

                  {!readOnly && (
                    <>
                      <button
                        onClick={() => onEdit?.(project)}
                        className="text-blue-500 font-medium"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete?.(project.id)}
                        className="text-red-500 font-medium"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}

          {projects.length === 0 && (
            <tr>
              <td colSpan="7" className="p-6 text-center text-gray-400">
                No Projects Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsTable;