import React from "react";

const ProjectInfoCard = ({ project }) => {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4 border">

      <h2 className="text-xl font-semibold text-gray-800">
        {project.name}
      </h2>

      <div className="grid grid-cols-2 gap-4 text-gray-600">

        <p>
          <strong>Client:</strong> {project.client}
        </p>

        <p>
          <strong>Status:</strong> {project.status}
        </p>

        <p>
          <strong>Budget:</strong> ${project.budget}
        </p>

        <p>
          <strong>Source:</strong>{" "}
          {project.source || "Manual"}
        </p>

      </div>

    </div>
  );
};

export default ProjectInfoCard;