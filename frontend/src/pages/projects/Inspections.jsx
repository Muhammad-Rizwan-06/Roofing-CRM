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

const INSPECTION_STATUSES = [
  "Scheduled",
  "Completed",
  "Failed",
  "Needs Rework",
  "Skipped",   // ✅ maintenance mapping
  "Cancelled", // ✅ maintenance mapping
];

const Inspections = () => {
  const [projects] = useState(() => lsGet("projects", []));
  const [inspections, setInspections] = useState(() => lsGet("inspections", []));

  const [form, setForm] = useState({
    projectId: "",
    date: new Date().toISOString().slice(0, 10),
    inspector: "",
    status: "Scheduled",
    notes: "",
  });

  useEffect(() => {
    lsSet("inspections", inspections);
  }, [inspections]);

  const addInspection = (e) => {
    e.preventDefault();
    if (!form.projectId) return alert("Select a project");
    if (!form.date) return alert("Inspection date required");

    const p = projects.find((x) => String(x.id) === String(form.projectId));
    if (!p) return alert("Invalid project");

    const newInspection = {
      id: Date.now(),
      projectId: Number(form.projectId),
      projectName: p.name,
      client: p.client,
      date: form.date,
      inspector: form.inspector || "",
      status: form.status,
      notes: form.notes || "",
      createdAt: new Date().toISOString(),
    };

    setInspections((prev) => [newInspection, ...prev]);

    setForm({
      projectId: "",
      date: new Date().toISOString().slice(0, 10),
      inspector: "",
      status: "Scheduled",
      notes: "",
    });
  };

  const remove = (id) => {
    const ok = confirm("Delete this inspection record?");
    if (!ok) return;
    setInspections((prev) => prev.filter((x) => x.id !== id));
  };

  const updateStatus = (id, status) => {
    setInspections((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return inspections.filter((i) => i.status === "Scheduled" && i.date >= today).length;
  }, [inspections]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inspections</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Schedule and track inspection outcomes linked to projects (maintenance visits auto-create inspections)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">Upcoming</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{upcomingCount}</p>
        </div>
      </div>

      <form
        onSubmit={addInspection}
        className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow space-y-4 border border-gray-100 dark:border-gray-800"
      >
        <h2 className="font-semibold text-gray-800 dark:text-white">Add Inspection</h2>

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
              onChange={(e) => setForm((p) => ({ ...p, inspector: e.target.value }))}
              placeholder="Name"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Status</label>
            <select
              className="border p-3 w-full rounded bg-white dark:bg-gray-950 dark:text-white"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
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

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700">
          Add Inspection
        </button>
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-x-auto border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">Inspection Records</div>

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
            {inspections.map((i) => {
              const hasProject = i.projectId !== null && i.projectId !== undefined && i.projectId !== "";

              return (
                <tr key={i.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-medium">
                    {hasProject ? (
                      <Link className="text-blue-600 hover:underline" to={`/projects/${i.projectId}`}>
                        {i.projectName}
                      </Link>
                    ) : (
                      <span className="text-gray-800 dark:text-gray-100">
                        {i.projectName || "(Maintenance - No Project)"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.client}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.date}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i.inspector || "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={i.status}
                      onChange={(e) => updateStatus(i.id, e.target.value)}
                      className="border rounded px-2 py-1 bg-white dark:bg-gray-950 dark:text-white"
                    >
                      {INSPECTION_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-red-600 hover:underline" onClick={() => remove(i.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {inspections.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-300">
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