import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";

const WorkOrders = () => {
    const {
      projects,
      error,
      getAll,
      getById, 
      addWorkOrder,
      updateWorkOrder,
      deleteWorkOrder,
      getAllWorkOrders,
    } = useProjects();

  const [workOrders, setWorkOrders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProjectWorkers, setSelectedProjectWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const filteredWorkOrders = useMemo(() => {
    if (!searchQuery.trim()) return workOrders || [];
    const q = searchQuery.toLowerCase();
    return (workOrders || []).filter((w) => {
      const projectName = (w.projectName || "").toLowerCase();
      const title = (w.title || "").toLowerCase();
      const assigned = (w.assignedWorkerName || "").toLowerCase();
      const priority = (w.priority || "").toLowerCase();
      const status = (w.status || "").toLowerCase();
      return (
        projectName.includes(q) ||
        title.includes(q) ||
        assigned.includes(q) ||
        priority.includes(q) ||
        status.includes(q)
      );
    });
  }, [workOrders, searchQuery]);

  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
    priority: "Medium",
    status: "Open",
    scheduledDate: "",
    assignedWorkerName: "",
  });

  const fetchWorkOrders = useCallback(async () => {
    const result = await getAllWorkOrders();
    if (result.ok) setWorkOrders(result.data);
  }, [getAllWorkOrders]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([getAll(), fetchWorkOrders()]);
      setPageLoading(false);
    };
    init();
  }, [getAll, fetchWorkOrders]);

  const openCount = useMemo(
    () =>
      filteredWorkOrders.filter(
        (w) => w.status === "Open" || w.status === "In Progress",
      ).length,
    [filteredWorkOrders],
  );

  const handleProjectChange = async (projectId) => {
    setForm((p) => ({ ...p, projectId, assignedWorkerName: "" }));
    setSelectedProjectWorkers([]);

    if (!projectId) return;

    setWorkersLoading(true);
    const result = await getById(projectId);
    if (result.ok) {
      setSelectedProjectWorkers(result.data.workers || []);
    }
    setWorkersLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.projectId) return alert("Select a project");
    if (!form.title.trim()) return alert("Title is required");
    const selectedProject = projects.find(
      (p) => p.projectId === form.projectId,
    ); 
    setSubmitting(true);
    const result = await addWorkOrder(form.projectId, {
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      status: form.status,
      scheduledDate: form.scheduledDate,
      assignedWorkerName: form.assignedWorkerName,
      projectName: selectedProject?.name?.trim() || "",
    });
    setSubmitting(false);

    if (!result.ok) return alert(result.message);

    await fetchWorkOrders();
    setForm({
      projectId: "",
      title: "",
      description: "",
      priority: "Medium",
      status: "Open",
      scheduledDate: "",
      assignedWorkerName: "",
    });
  };

  const handleUpdateStatus = async (projectId, workOrderId, status) => {
    const rawId = workOrderId.replace("WORKORDER#", "");
    await updateWorkOrder(projectId, rawId, { status });
    await fetchWorkOrders();
  };

  const handleDelete = async (projectId, workOrderId) => {
    const confirmed = confirm("Delete this work order?");
    if (!confirmed) return;
    const rawId = workOrderId.replace("WORKORDER#", "");
    const result = await deleteWorkOrder(projectId, rawId);
    if (!result.ok) return alert(result.message);
    await fetchWorkOrders();
  };


  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Work Orders
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Create work orders linked to projects
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">Open</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {openCount}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
          Error: {error}
        </div>
      )}

      {/* Create Work Order Form */}
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow space-y-4 border border-gray-100 dark:border-gray-800"
      >
        <h2 className="font-semibold text-gray-800 dark:text-white">
          Create Work Order
        </h2>

        <select
          className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
          value={form.projectId}
          onChange={(e) => handleProjectChange(e.target.value)} // ← changed
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>
              {p.name?.trim()} — {p.client?.trim()}
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
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="Description (optional)"
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500">Priority</label>
            <select
              className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
              value={form.priority}
              onChange={(e) =>
                setForm((p) => ({ ...p, priority: e.target.value }))
              }
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
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
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
              onChange={(e) =>
                setForm((p) => ({ ...p, scheduledDate: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Assign Worker</label>
            <select
              className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
              value={form.assignedWorkerName}
              onChange={(e) =>
                setForm((p) => ({ ...p, assignedWorkerName: e.target.value }))
              }
              disabled={workersLoading || !form.projectId}
            >
              <option value="">
                {workersLoading
                  ? "Loading workers..."
                  : !form.projectId
                    ? "Select a project first"
                    : "Unassigned"}
              </option>
              {selectedProjectWorkers.map((w) => (
                <option key={w.workerId} value={w.name}>
                  {w.name} {w.role ? `— ${w.role}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Work Order"}
        </button>
      </form>

      {/* Work Orders Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-x-auto border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Work Orders List
        </div>

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
            {filteredWorkOrders.map((w) => (
              <tr
                key={w.workOrderId}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    className="text-blue-600 hover:underline"
                    to={`/projects/${w.projectId}`}
                  >
                    {w.projectName}
                  </Link>
                </td>
                <td className="px-4 py-3">{w.title}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {w.assignedWorkerName || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {w.scheduledDate || "—"}
                </td>
                <td className="px-4 py-3">{w.priority}</td>
                <td className="px-4 py-3">
                  <select
                    value={w.status}
                    onChange={(e) =>
                      handleUpdateStatus(
                        w.projectId,
                        w.workOrderId,
                        e.target.value,
                      )
                    }
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-950 dark:text-white"
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(w.projectId, w.workOrderId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredWorkOrders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-300"
                >
                  {pageLoading ? <p>Loading...</p> : <p>No work orders yet.</p>}
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