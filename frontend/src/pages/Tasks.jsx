import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLE } from "../config/accessControl";
import { useTasks } from "../context/TasksContext";
import { useProjects } from "../context/ProjectsContext";
import { useEmployees } from "../context/EmployeesContext";

const normalize = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();

const Tasks = () => {
  const { user } = useAuth();
  const roleName = user?.roleName;

  const isAdmin = roleName === ROLE.ADMIN;
  const isPM = roleName === ROLE.PM;
  const isWorker = roleName === ROLE.WORKER;

  const canManageTasks = isAdmin || isPM;
  const canUpdateStatus = canManageTasks || isWorker;

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
  } = useTasks();
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    getAll,
  } = useProjects();
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
    getAllEmployees,
  } = useEmployees();

  const [view, setView] = useState("table");

  const [form, setForm] = useState({
    title: "",
    projectId: "",
    projectName: "",
    employeeId: "",
    worker: "",
    startDate: "",
    endDate: "",
    priority: "Medium",
    status: "Pending",
  });

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchTasks();
    getAll();
    getAllEmployees();
  }, []);

  // ── Worker → employee linking ──────────────────────────────────────────────
  const myEmployee = useMemo(() => {
    const myEmail = normalize(user?.email);
    const myName = normalize(user?.name);
    return (
      employees.find((e) => normalize(e.email) === myEmail) ||
      employees.find((e) => normalize(e.name) === myName) ||
      null
    );
  }, [employees, user?.email, user?.name]);

  const myEmployeeId = myEmployee?.employeeId;

  const isMyTask = (t) => {
    if (!isWorker) return true;
    if (
      myEmployeeId != null &&
      t.employeeId != null &&
      String(t.employeeId) === String(myEmployeeId)
    )
      return true;
    if (normalize(user?.name) && normalize(t.worker) === normalize(user?.name))
      return true;
    return false;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!canManageTasks) return;
    if (!form.title || !form.projectId) {
      alert("Fill required fields");
      return;
    }

    const selectedEmployee = employees.find(
      (e) => String(e.employeeId) === String(form.employeeId),
    );

    await addTask({
      title: form.title,
      projectId: form.projectId,
      projectName:
        projects.find((p) => String(p.projectId) === String(form.projectId))?.name ??
        "",
      employeeId: form.employeeId ? Number(form.employeeId) : null,
      worker: selectedEmployee?.name || form.worker || "",
      startDate: form.startDate,
      endDate: form.endDate,
      priority: form.priority,
      status: form.status || "Pending",
    });

    setForm({
      title: "",
      projectId: "",
      projectName: "",
      employeeId: "",
      worker: "",
      startDate: "",
      endDate: "",
      priority: "Medium",
      status: "Pending",
    });
  };

  const handleDelete = async (taskId) => {
    if (!canManageTasks) return;
    await deleteTask(taskId);
  };

  const changeStatus = async (taskId, status) => {
    if (!canUpdateStatus) return;
    const target = tasks.find((t) => t.taskId === taskId);
    if (isWorker && target && !isMyTask(target)) return;
    await updateTask(taskId, { status });
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const statuses = ["Pending", "In Progress", "Completed"];

  const visibleTasks = useMemo(() => {
    if (!isWorker) return tasks;
    return tasks.filter(isMyTask);
  }, [tasks, isWorker, myEmployeeId, user?.name]);

  const getProjectName = (id) =>
    projects.find((p) => String(p.projectId) === String(id))?.name || "N/A";

  // ── Loading / Error ────────────────────────────────────────────────────────
  const loading = tasksLoading || projectsLoading || employeesLoading;
  const error = tasksError || projectsError || employeesError;


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tasks Management</h1>
          {isWorker && (
            <p className="text-sm text-gray-500 mt-1">
              You can update status of your assigned tasks only.
            </p>
          )}
        </div>
        {isWorker && (
          <div className="text-xs text-gray-500">
            Employee linked:{" "}
            <span className="font-semibold">{myEmployee ? "Yes" : "No"}</span>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex gap-3">
        {["table", "kanban"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded capitalize ${
              view === v ? "bg-blue-600 text-white" : "bg-gray-200 text-black"
            }`}
          >
            {v === "table" ? "Table View" : "Kanban Board"}
          </button>
        ))}
      </div>

      {/* Form (Admin/PM only) */}
      {canManageTasks && (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow border border-gray-200 dark:border-gray-700 space-y-4">
          <input
            placeholder="Task Title"
            className="w-full rounded border border-gray-300 bg-white text-gray-900 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <select
            className="w-full rounded border border-gray-300 bg-white text-gray-900 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded border border-gray-300 bg-white text-gray-900 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          >
            <option value="">Assign Employee (optional)</option>
            {employees.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.name} {e.role ? `— ${e.role}` : ""}
              </option>
            ))}
          </select>

          {!form.employeeId && (
            <input
              placeholder="Assigned Worker (manual)"
              className="w-full rounded border border-gray-300 bg-white text-gray-900 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={form.worker}
              onChange={(e) => setForm({ ...form, worker: e.target.value })}
            />
          )}

          <div className="flex gap-3">
            <input
              type="date"
              className="w-full rounded border border-gray-300 bg-white text-gray-900 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />

            <input
              type="date"
              className="w-full rounded border border-gray-300 bg-white text-gray-900 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          <select
            className="w-full rounded border border-gray-300 bg-white text-gray-900 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <select
            className="w-full rounded border border-gray-300 bg-white text-gray-900 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>

          <button
            onClick={handleAdd}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 dark:hover:bg-blue-500"
          >
            Add Task
          </button>
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                {canManageTasks && (
                  <th className="px-4 py-3 text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleTasks.map((t) => (
                <tr
                  key={t.taskId}
                  className="border-t dark:bg-gray-900 hover:bg-gray-800"
                >
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3">
                    {t.projectName || getProjectName(t.projectId)}
                  </td>
                  <td className="px-4 py-3">{t.worker || "—"}</td>
                  <td className="px-4 py-3">
                    {t.startDate || "—"} → {t.endDate || "—"}
                  </td>
                  <td className="px-4 py-3">{t.priority}</td>
                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={(e) => changeStatus(t.taskId, e.target.value)}
                      className="border rounded px-2 py-1 dark:bg-gray-900 text-white"
                      disabled={!canUpdateStatus}
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  {canManageTasks && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(t.taskId)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {visibleTasks.length === 0 && (
                <tr>
                  <td
                    colSpan={canManageTasks ? 7 : 6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {loading ? "Loading..." : "No tasks yet."}
                    {error ? error : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statuses.map((status) => (
            <div
              key={status}
              className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl"
            >
              <h2 className="font-semibold mb-4">{status}</h2>
              <div className="space-y-3">
                {visibleTasks
                  .filter((t) => t.status === status)
                  .map((t) => (
                    <div
                      key={t.taskId}
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow"
                    >
                      <p className="font-semibold">{t.title}</p>
                      <p className="text-sm text-gray-500">
                        {t.projectName || getProjectName(t.projectId)}
                      </p>
                      <p className="text-sm">{t.worker || "—"}</p>
                      <p className="text-xs mt-1">Priority: {t.priority}</p>
                      <select
                        value={t.status}
                        onChange={(e) => changeStatus(t.taskId, e.target.value)}
                        className="mt-2 w-full border rounded px-2 py-1 dark:bg-gray-900 text-white"
                        disabled={!canUpdateStatus}
                      >
                        {statuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      {canManageTasks && (
                        <button
                          onClick={() => handleDelete(t.taskId)}
                          className="bg-red-500 text-white px-2 py-1 mt-3 rounded w-full hover:bg-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
