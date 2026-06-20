import React, { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTasks } from "../../context/TasksContext";
import { getTasksInRange } from "../../utils/getTasksInRange";

const Calendar = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const { tasks, loading, error, fetchTasks } = useTasks();

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Derived data ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const list = getTasksInRange(tasks, from, to) || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((t) => {
      const title = (t.title || "").toLowerCase();
      const project = (t.projectName || "").toLowerCase();
      const worker = (t.worker || "").toLowerCase();
      const priority = (t.priority || "").toLowerCase();
      const status = (t.status || "").toLowerCase();
      return (
        title.includes(q) ||
        project.includes(q) ||
        worker.includes(q) ||
        priority.includes(q) ||
        status.includes(q)
      );
    });
  }, [tasks, from, to, searchQuery]);

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

  // ── Loading / Error states ──────────────────────────────────────────────────

  if (loading)
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-300">
        Loading tasks...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-40 text-red-500">
        {error}
      </div>
    );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Calendar
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Task calendar view based on task Start Date
        </p>
      </div>

      {/* Filters */}
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
          className="bg-gray-200 dark:bg-gray-900 text-gray-500 dark:text-gray-300 hover:bg-gray-700 px-4 py-2 rounded-xl"
          onClick={() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("search");
            setSearchParams(newParams, { replace: true });
            setFrom("");
            setTo("");
          }}
          type="button"
        >
          Reset
        </button>
      </div>

      {/* Task Groups */}
      <div className="space-y-4">
        {dates.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-300">
            No tasks found for selected dates.
          </div>
        ) : (
          dates.map((date) => (
            <div
              key={date}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800"
            >
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-800 dark:text-white">
                {date}
              </div>

              <div className="p-4 space-y-3">
                {grouped[date].map((t) => (
                  <div
                    key={t.taskId}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {t.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          Project:{" "}
                          <Link
                            className="text-blue-600 hover:underline"
                            to={`/projects/${t.projectId}`}
                          >
                            {t.projectName || "N/A"}
                          </Link>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          Worker: {t.worker || "—"} • Priority: {t.priority} •
                          Status: {t.status}
                        </p>
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
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
