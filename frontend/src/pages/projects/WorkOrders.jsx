import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const lsGet = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const lsSet = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const WorkOrders = () => {
  const [projects] = useState(() => lsGet("projects", []));
  const [employees] = useState(() => lsGet("employees", []));
  const [workOrders, setWorkOrders] = useState(() => lsGet("workOrders", []));

  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
    priority: "Medium",
    status: "Open", // Open | In Progress | Completed | Cancelled
    scheduledDate: "",
    assignedEmployeeId: "",
  });

  useEffect(() => {
    lsSet("workOrders", workOrders);
  }, [workOrders]);

  const addWO = (e) => {
    e.preventDefault();
    if (!form.projectId) return alert("Select a project");
    if (!form.title.trim()) return alert("Title is required");

    const p = projects.find((x) => String(x.id) === String(form.projectId));
    if (!p) return alert("Invalid project");

    const emp = employees.find((x) => String(x.id) === String(form.assignedEmployeeId));

    const wo = {
      id: Date.now(),
      projectId: Number(form.projectId),
      projectName: p.name,
      client: p.client,
      title: form.title.trim(),
      description: form.description || "",
      priority: form.priority,
      status: form.status,
      scheduledDate: form.scheduledDate || "",
      assignedEmployeeId: form.assignedEmployeeId ? Number(form.assignedEmployeeId) : null,
      assignedEmployeeName: emp?.name || "",
      createdAt: new Date().toISOString(),
    };

    setWorkOrders((prev) => [wo, ...prev]);

    setForm({
      projectId: "",
      title: "",
      description: "",
      priority: "Medium",
      status: "Open",
      scheduledDate: "",
      assignedEmployeeId: "",
    });
  };

  const remove = (id) => {
    const ok = confirm("Delete this work order?");
    if (!ok) return;
    setWorkOrders((prev) => prev.filter((x) => x.id !== id));
  };

  const updateStatus = (id, status) => {
    setWorkOrders((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const openCount = useMemo(
    () => workOrders.filter((w) => w.status === "Open" || w.status === "In Progress").length,
    [workOrders]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Work Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Create work orders linked to projects (can be assigned to employees)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">Open</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{openCount}</p>
        </div>
      </div>

      <form
        onSubmit={addWO}
        className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow space-y-4 border border-gray-100 dark:border-gray-800"
      >
        <h2 className="font-semibold text-gray-800 dark:text-white">Create Work Order</h2>

        <select
          className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
          value={form.projectId}
          onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.client}
            </option>
          ))}
        </select>

        <input
          className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Work Order Title *"
        />

        <input
          className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description (optional)"
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500">Priority</label>
            <select
              className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Status</label>
            <select
              className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Scheduled Date</label>
            <input
              type="date"
              className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
              value={form.scheduledDate}
              onChange={(e) => setForm((p) => ({ ...p, scheduledDate: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Assign Employee</label>
            <select
              className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
              value={form.assignedEmployeeId}
              onChange={(e) => setForm((p) => ({ ...p, assignedEmployeeId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} {e.role ? `— ${e.role}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700">
          Create Work Order
        </button>
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-x-auto border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">Work Orders List</div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((w) => (
              <tr key={w.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3 font-medium">
                  <Link className="text-blue-600 hover:underline" to={`/projects/${w.projectId}`}>
                    {w.projectName}
                  </Link>
                </td>
                <td className="px-4 py-3">{w.title}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {w.assignedEmployeeName || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {w.scheduledDate || "—"}
                </td>
                <td className="px-4 py-3">{w.priority}</td>
                <td className="px-4 py-3">
                  <select
                    value={w.status}
                    onChange={(e) => updateStatus(w.id, e.target.value)}
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-950 dark:text-white"
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-red-600 hover:underline" onClick={() => remove(w.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {workOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-300">
                  No work orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkOrders;