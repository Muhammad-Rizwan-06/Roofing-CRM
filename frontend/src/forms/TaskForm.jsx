import { useState } from "react";

const TaskForm = ({ onAdd, projects }) => {
  const [form, setForm] = useState({
    title: "",
    project: "",
    assigned: "",
    priority: "Medium",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title || !form.project || !form.assigned) {
      alert("All fields required");
      return;
    }

    onAdd({
      ...form,
      status: "Pending",
      startDate: new Date().toLocaleDateString(),
    });

    setForm({
      title: "",
      project: "",
      assigned: "",
      priority: "Medium",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded shadow mb-4 space-y-3"
    >
      <h2 className="font-semibold">Add Task</h2>

      <input
        placeholder="Task Title"
        value={form.title}
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
        className="border p-2 w-full"
      />

      {/* Project Dropdown */}
      <select
        value={form.project}
        onChange={(e) =>
          setForm({ ...form, project: e.target.value })
        }
        className="border p-2 w-full"
      >
        <option value="">Select Project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>

      <input
        placeholder="Assign Worker"
        value={form.assigned}
        onChange={(e) =>
          setForm({ ...form, assigned: e.target.value })
        }
        className="border p-2 w-full"
      />

      <select
        value={form.priority}
        onChange={(e) =>
          setForm({ ...form, priority: e.target.value })
        }
        className="border p-2 w-full"
      >
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>

      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Add Task
      </button>
    </form>
  );
};

export default TaskForm;