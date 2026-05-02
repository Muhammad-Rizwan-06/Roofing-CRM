import React from "react";
import { Link } from "react-router-dom";

const CustomerProjects = ({ projects }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow border">

      <h2 className="text-lg font-semibold mb-4">
        Projects
      </h2>

      <div className="space-y-4">

        {projects.map((project) => (
          <div
            key={project.id}
            className="border p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-gray-500">
                Status: {project.status}
              </p>
            </div>

            <Link
              to={`/projects/${project.id}`}
              className="text-blue-600"
            >
              View Project
            </Link>
          </div>
        ))}

      </div>

    </div>
  );
};

export default CustomerProjects;