import React, { useMemo, useState } from "react";
import { getActivityLogs, clearActivityLogs } from "../../utils/activityLogStore";

const fmt = (iso) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const ActivityLogs = () => {
  const [q, setQ] = useState("");
  const [logs, setLogs] = useState(() => getActivityLogs());

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((l) => {
      const hay = [
        l.action,
        l.entityType,
        l.entityId,
        l.message,
        l.actor?.name,
        l.actor?.email,
        l.actor?.roleName,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [logs, q]);

  const onRefresh = () => setLogs(getActivityLogs());

  const onClear = () => {
    if (!confirm("Clear all activity logs?")) return;
    clearActivityLogs();
    setLogs([]);
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_logs_${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Activity Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Admin audit trail of important system actions.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
          >
            Refresh
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Export JSON
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search logs (action, user, entity, message...)"
          className="w-full border rounded-xl px-4 py-3 bg-white dark:bg-gray-950 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Logs ({filtered.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Actor</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Entity</th>
                <th className="text-left p-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-gray-100 dark:border-gray-800"
                >
                  <td className="p-3 whitespace-nowrap">{fmt(l.createdAt)}</td>
                  <td className="p-3">
                    <div className="font-medium text-gray-800 dark:text-gray-100">
                      {l.actor?.name || "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {l.actor?.roleName || "—"} • {l.actor?.email || "—"}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{l.action}</td>
                  <td className="p-3">
                    <div>{l.entityType}</div>
                    <div className="text-xs text-gray-500">{l.entityId}</div>
                  </td>
                  <td className="p-3 text-gray-700 dark:text-gray-200">
                    {l.message || "—"}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-gray-500 dark:text-gray-300"
                  >
                    No activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;