import React, { useState } from "react";
import AddTaskModal from "./AddTaskModal";

const TaskSection = ({ project, setProject }) => {
  const [open, setOpen] = useState(false);

  // Add Task
  const handleAddTask = (task) => {
    const updatedProject = {
      ...project,
      tasks: [...(project.tasks || []), task],
    };

    updateProjectInStorage(updatedProject);
  };

  // Toggle Status
  const toggleStatus = (taskId) => {
    const updatedTasks = project.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status:
              task.status === "Pending"
                ? "Completed"
                : "Pending",
          }
        : task
    );

    updateProjectInStorage({
      ...project,
      tasks: updatedTasks,
    });
  };

  // Delete Task
  const deleteTask = (taskId) => {
    const updatedTasks = project.tasks.filter(
      (t) => t.id !== taskId
    );

    updateProjectInStorage({
      ...project,
      tasks: updatedTasks,
    });
  };

  // Update localStorage + state
  const updateProjectInStorage = (updatedProject) => {
    const projects =
      JSON.parse(localStorage.getItem("projects")) || [];

    const updatedProjects = projects.map((p) =>
      p.id === updatedProject.id ? updatedProject : p
    );

    localStorage.setItem(
      "projects",
      JSON.stringify(updatedProjects)
    );

    setProject(updatedProject);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow border">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Tasks</h2>

        <button
          onClick={() => setOpen(true)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          + Add Task
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {(project.tasks || []).length === 0 ? (
          <p className="text-gray-400">No tasks yet</p>
        ) : (
          project.tasks.map((task) => (
            <div
              key={task.id}
              className="flex justify-between items-center border p-3 rounded-lg"
            >
              <div>
                <p className="font-medium">{task.title}</p>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    task.status === "Completed"
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {task.status}
                </span>
              </div>

              <div className="space-x-2">
                <button
                  onClick={() => toggleStatus(task.id)}
                  className="text-blue-500"
                >
                  Toggle
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {open && (
        <AddTaskModal
          setOpen={setOpen}
          onAdd={handleAddTask}
        />
      )}
    </div>
  );
};

export default TaskSection;