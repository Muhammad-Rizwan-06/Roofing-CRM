
// export default Inspections;
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";
import { useContracts } from "../../context/ContractContext"; 

const INSPECTION_STATUSES = [
  "Scheduled",
  "Completed",
  "Failed",
  "Needs Rework",
  "Skipped",
  "Cancelled",
];

const Inspections = () => {
  const {
    projects,
    loading,
    error,
    getAll,
    addInspection,
    updateInspection,
    deleteInspection,
    getAllInspections,
  } = useProjects();

  const { updateContractInspection, deleteContractInspection } = useContracts(); // ✅ add

  const [inspections, setInspections] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    projectId: "",
    date: new Date().toISOString().slice(0, 10),
    inspector: "",
    status: "Scheduled",
    notes: "",
  });

  const fetchInspections = useCallback(async () => {
    const result = await getAllInspections();
    if (result.ok) setInspections(result.data);
  }, [getAllInspections]);

  // Fetch projects for dropdown and inspections for the table
  useEffect(() => {
    getAll();
    fetchInspections();
  }, [getAll, fetchInspections]);

  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return inspections.filter(
      (i) => i.status === "Scheduled" && i.date >= today,
    ).length;
  }, [inspections]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.projectId) return alert("Select a project");
    if (!form.date) return alert("Inspection date required");

    setSubmitting(true);
    const result = await addInspection(form.projectId, {
      date: form.date,
      inspector: form.inspector,
      projectName: projects.find(
        (p) => String(p.projectId) === String(form.projectId),
      )?.name,
      client: projects.find(
        (p) => String(p.projectId) === String(form.projectId),
      )?.client,
      status: form.status,
      notes: form.notes,
    });
    setSubmitting(false);

    if (!result.ok) return alert(result.message);

    await fetchInspections(); // ✅ refresh list
    setForm({
      projectId: "",
      date: new Date().toISOString().slice(0, 10),
      inspector: "",
      status: "Scheduled",
      notes: "",
    });
  };

  const handleUpdateStatus = async (projectId, inspectionId, status) => {
    const rawId = inspectionId.replace("INSPECTION#", "");

    // find the inspection to check its entityType
    const inspection = inspections.find((i) => i.inspectionId === inspectionId);

    if (inspection?.entityType === "CONTRACT_INSPECTION") {
      // ✅ route to contracts API
      await updateContractInspection(inspection.contractId, rawId, { status });
    } else {
      // ✅ route to projects API
      await updateInspection(projectId, rawId, { status });
    }

    await fetchInspections();
  };

  const handleDelete = async (projectId, inspectionId) => {
    const confirmed = confirm("Delete this inspection record?");
    if (!confirmed) return;

    const rawId = inspectionId.replace("INSPECTION#", "");
    const inspection = inspections.find((i) => i.inspectionId === inspectionId);

    let result;
    if (inspection?.entityType === "CONTRACT_INSPECTION") {
      // ✅ route to contracts API
      result = await deleteContractInspection(inspection.contractId, rawId);
    } else {
      // ✅ route to projects API
      result = await deleteInspection(projectId, rawId);
    }

    if (!result.ok) return alert(result.message);
    await fetchInspections();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Inspections
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Schedule and track inspection outcomes linked to projects
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">Upcoming</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {upcomingCount}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
          Error: {error}
        </div>
      )}

      {/* Add Inspection Form */}
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow space-y-4 border border-gray-100 dark:border-gray-800"
      >
        <h2 className="font-semibold text-gray-800 dark:text-white">
          Add Inspection
        </h2>

        <select
          className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
          value={form.projectId}
          onChange={(e) =>
            setForm((p) => ({ ...p, projectId: e.target.value }))
          }
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>
              {p.name?.trim()} — {p.client?.trim()}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500">Date</label>
            <input
              type="date"
              className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Inspector</label>
            <input
              className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
              value={form.inspector}
              onChange={(e) =>
                setForm((p) => ({ ...p, inspector: e.target.value }))
              }
              placeholder="Name"
            />
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
              {INSPECTION_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <input
          className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Notes (optional)"
        />

        <button
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Inspection"}
        </button>
      </form>

      {/* Inspection Records Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-x-auto border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Inspection Records
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Inspector</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((i) => (
              <tr
                key={i.inspectionId}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="px-4 py-3 font-medium">
                  {i.projectId ? (
                    <Link
                      className="text-blue-600 hover:underline"
                      to={`/projects/${i.projectId}`}
                    >
                      {i.projectName || i.projectId}
                    </Link>
                  ) : (
                    <span className="text-gray-800 dark:text-gray-100">
                      {i.projectName || "(No Project)"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {i.client || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {i.date}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {i.inspector || "—"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={i.status}
                    onChange={(e) =>
                      handleUpdateStatus(
                        i.projectId,
                        i.inspectionId,
                        e.target.value,
                      )
                    }
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-950 dark:text-white"
                  >
                    {INSPECTION_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(i.projectId, i.inspectionId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {inspections.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-300"
                >
                  No inspection records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inspections;