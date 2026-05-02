import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const lsGet = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const Calendar = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const tasks = useMemo(() => lsGet("tasks", []), []);
  const projects = useMemo(() => lsGet("projects", []), []);

  const projectName = (id) =>
    projects.find((p) => String(p.id) === String(id))?.name || "N/A";

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => {
        const start = t.startDate ? new Date(t.startDate) : null;
        if (!start || Number.isNaN(start.getTime())) return false;

        if (from) {
          const f = new Date(from);
          if (start < f) return false;
        }
        if (to) {
          const tt = new Date(to);
          if (start > tt) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [tasks, from, to]);

  // group by startDate
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const key = t.startDate || "No Date";
      map[key] = map[key] || [];
      map[key].push(t);
    });
    return map;
  }, [filtered]);

  const dates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Calendar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Task calendar view based on task Start Date
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 md:items-end">
        <div>
          <label className="text-xs text-gray-500">From</label>
          <input
            type="date"
            className="mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">To</label>
          <input
            type="date"
            className="mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <button
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl"
          onClick={() => {
            setFrom("");
            setTo("");
          }}
          type="button"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {dates.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-300">
            No tasks found for selected dates.
          </div>
        ) : (
          dates.map((date) => (
            <div key={date} className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-800 dark:text-white">
                {date}
              </div>

              <div className="p-4 space-y-3">
                {grouped[date].map((t) => (
                  <div key={t.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{t.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          Project:{" "}
                          <Link className="text-blue-600 hover:underline" to={`/projects/${t.projectId}`}>
                            {projectName(t.projectId)}
                          </Link>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          Worker: {t.worker || "—"} • Priority: {t.priority} • Status: {t.status}
                        </p>
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-300">
                        {t.startDate} → {t.endDate || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Calendar;