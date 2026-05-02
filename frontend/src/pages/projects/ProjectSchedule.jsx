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

const daysBetween = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  return Math.max(0, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
};

const ProjectSchedule = () => {
  const [projects, setProjects] = useState(() => lsGet("projects", []));
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const onFocus = () => setProjects(lsGet("projects", []));
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      startDate: p.startDate || "",
      endDate: p.endDate || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ startDate: "", endDate: "" });
  };

  const saveSchedule = () => {
    if (!editingId) return;

    if (form.startDate && form.endDate) {
      const s = new Date(form.startDate);
      const e = new Date(form.endDate);
      if (e < s) return alert("End date cannot be before start date");
    }

    const updated = projects.map((p) =>
      p.id === editingId
        ? {
            ...p,
            startDate: form.startDate || "",
            endDate: form.endDate || "",
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    setProjects(updated);
    lsSet("projects", updated);
    cancelEdit();
  };

  const scheduledCount = useMemo(
    () => projects.filter((p) => p.startDate || p.endDate).length,
    [projects]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Project Schedule
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Manage project start/end dates (stored inside Projects)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">Scheduled Projects</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{scheduledCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-x-auto border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Schedule List
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((p) => {
              const duration =
                p.startDate && p.endDate ? daysBetween(p.startDate, p.endDate) : null;

              const isEditing = editingId === p.id;

              return (
                <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-medium">
                    <Link className="text-blue-600 hover:underline" to={`/projects/${p.id}`}>
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.client}</td>

                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="date"
                        className="border rounded-lg px-2 py-1 bg-white dark:bg-gray-950 dark:text-white"
                        value={form.startDate}
                        onChange={(e) => setForm((x) => ({ ...x, startDate: e.target.value }))}
                      />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300">{p.startDate || "—"}</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="date"
                        className="border rounded-lg px-2 py-1 bg-white dark:bg-gray-950 dark:text-white"
                        value={form.endDate}
                        onChange={(e) => setForm((x) => ({ ...x, endDate: e.target.value }))}
                      />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300">{p.endDate || "—"}</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {duration === null ? "—" : `${duration} days`}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {p.status || "—"}
                  </td>

                  <td className="px-4 py-3 text-right space-x-3">
                    {isEditing ? (
                      <>
                        <button className="text-green-600 hover:underline" onClick={saveSchedule}>
                          Save
                        </button>
                        <button className="text-gray-600 hover:underline" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="text-blue-600 hover:underline" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {projects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-300">
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectSchedule;