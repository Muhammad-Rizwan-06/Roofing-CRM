import { useMemo, useState, useEffect } from "react";

const AddProjectModal = ({ isOpen, onClose, onAddProject, editProject }) => {
  const [form, setForm] = useState({
    name: "",
    client: "",
    clientEmail: "", // ✅ Portal linking
    status: "Pending",
    supervisor: "",
    team: "",
    budget: "",
  });

  const customerUsers = useMemo(() => {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    return users.filter((u) => String(u.roleName) === "Customer" && u.email);
  }, []);

  useEffect(() => {
    if (editProject) {
      setForm({
        name: editProject.name || "",
        client: editProject.client || "",
        clientEmail: editProject.clientEmail || "",
        status: editProject.status || "Pending",
        supervisor: editProject.supervisor || "",
        team: editProject.team || "",
        budget: editProject.budget ?? "",
      });
    } else {
      setForm({
        name: "",
        client: "",
        clientEmail: "",
        status: "Pending",
        supervisor: "",
        team: "",
        budget: "",
      });
    }
  }, [editProject]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.client) {
      alert("Please fill required fields");
      return;
    }

    const base = editProject || {};

    const updated = {
      ...base, // ✅ preserve source/leadId/estimateId/completedAt/etc.
      ...form,
      id: editProject ? editProject.id : Date.now(),

      // keep arrays always
      materials: base.materials || [],
      workers: base.workers || [],
      tasks: base.tasks || [],

      // ensure numeric
      budget: Number(form.budget || 0),

      // ✅ normalize email (optional)
      clientEmail: String(form.clientEmail || "").trim().toLowerCase(),
    };

    onAddProject(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">
          {editProject ? "Edit Project" : "Add Project"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Project Name"
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={handleChange}
          />

          <input
            name="client"
            placeholder="Client"
            className="w-full border p-2 rounded"
            value={form.client}
            onChange={handleChange}
          />

          {/* ✅ Portal login linking (recommended) */}
          <input
            name="clientEmail"
            placeholder="Client Email (Portal)"
            className="w-full border p-2 rounded"
            value={form.clientEmail}
            onChange={handleChange}
            list="customerEmails"
          />
          <datalist id="customerEmails">
            {customerUsers.map((u) => (
              <option key={u.id} value={u.email}>
                {u.name}
              </option>
            ))}
          </datalist>

          <select
            name="status"
            className="w-full border p-2 rounded bg-white"
            value={form.status}
            onChange={handleChange}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <input
            name="supervisor"
            placeholder="Supervisor"
            className="w-full border p-2 rounded"
            value={form.supervisor}
            onChange={handleChange}
          />

          <input
            name="team"
            placeholder="Team"
            className="w-full border p-2 rounded"
            value={form.team}
            onChange={handleChange}
          />

          <input
            name="budget"
            type="number"
            placeholder="Budget"
            className="w-full border p-2 rounded"
            value={form.budget}
            onChange={handleChange}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {editProject ? "Update" : "Add"}
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Tip: set <b>Client Email (Portal)</b> to the customer user email so they can see this project after login.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal;