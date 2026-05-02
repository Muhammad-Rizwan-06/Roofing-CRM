import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLE } from "../config/accessControl";

const getLocalData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const normalize = (v) => String(v || "").trim().toLowerCase();

const Tasks = () => {
  const { user } = useAuth();
  const roleName = user?.roleName;

  const isAdmin = roleName === ROLE.ADMIN;
  const isPM = roleName === ROLE.PM;
  const isWorker = roleName === ROLE.WORKER;

  // Only Admin/PM can create/delete tasks
  const canManageTasks = isAdmin || isPM;

  // Worker can update status (but only for their tasks)
  const canUpdateStatus = canManageTasks || isWorker;

  const [tasks, setTasks] = useState(() => getLocalData("tasks"));
  const [projects, setProjects] = useState(() => getLocalData("projects"));
  const [employees, setEmployees] = useState(() => getLocalData("employees"));

  const [view, setView] = useState("table");

  const [form, setForm] = useState({
    title: "",
    projectId: "",
    employeeId: "",
    worker: "", // fallback text if no employee selected
    startDate: "",
    endDate: "",
    priority: "Medium",
    status: "Pending",
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // refresh projects/employees when user returns to tab
  useEffect(() => {
    const onFocus = () => {
      setProjects(getLocalData("projects"));
      setEmployees(getLocalData("employees"));
      setTasks(getLocalData("tasks"));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Find which employee record belongs to current logged-in user (for Worker filtering)
  const myEmployee = useMemo(() => {
    const myEmail = normalize(user?.email);
    const myName = normalize(user?.name);

    return (
      (employees || []).find((e) => normalize(e.email) && normalize(e.email) === myEmail) ||
      (employees || []).find((e) => normalize(e.name) === myName) ||
      null
    );
  }, [employees, user?.email, user?.name]);

  const myEmployeeId = myEmployee?.id;

  const isMyTask = (t) => {
    if (!isWorker) return true; // Admin/PM can see all
    const taskEmpId = t.employeeId;
    const taskWorkerName = normalize(t.worker);

    // Preferred match: employeeId
    if (myEmployeeId != null && taskEmpId != null && String(taskEmpId) === String(myEmployeeId)) {
      return true;
    }

    // Fallback match: worker name
    if (normalize(user?.name) && taskWorkerName === normalize(user?.name)) {
      return true;
    }

    return false;
  };

  const handleAdd = () => {
    if (!canManageTasks) return;

    if (!form.title || !form.projectId) {
      alert("Fill required fields");
      return;
    }

    const selectedEmployee = employees.find((e) => String(e.id) === String(form.employeeId));
    const workerName = selectedEmployee?.name || form.worker || "";

    const newTask = {
      id: Date.now(),
      title: form.title,
      projectId: form.projectId,
      employeeId: form.employeeId ? Number(form.employeeId) : null,
      worker: workerName,
      startDate: form.startDate,
      endDate: form.endDate,
      priority: form.priority,
      status: form.status || "Pending",
    };

    setTasks([...tasks, newTask]);

    setForm({
      title: "",
      projectId: "",
      employeeId: "",
      worker: "",
      startDate: "",
      endDate: "",
      priority: "Medium",
      status: "Pending",
    });
  };

  const handleDelete = (id) => {
    if (!canManageTasks) return;
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const changeStatus = (id, status) => {
    if (!canUpdateStatus) return;

    // Worker can only update their own tasks
    const target = tasks.find((t) => t.id === id);
    if (isWorker && target && !isMyTask(target)) return;

    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const getProjectName = (id) => {
    return projects.find((p) => p.id == id)?.name || "N/A";
  };

  const statuses = ["Pending", "In Progress", "Completed"];

  const visibleTasks = useMemo(() => {
    if (!isWorker) return tasks;
    return tasks.filter(isMyTask);
  }, [tasks, isWorker, myEmployeeId, user?.name]);

  return (
    <div className="space-y-6">
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
            Employee linked: <span className="font-semibold">{myEmployee ? "Yes" : "No"}</span>
          </div>
        )}
      </div>

      {/* VIEW TOGGLE */}
      <div className="flex gap-3">
        <button
          onClick={() => setView("table")}
          className={`px-4 py-2 rounded ${
            view === "table" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Table View
        </button>

        <button
          onClick={() => setView("kanban")}
          className={`px-4 py-2 rounded ${
            view === "kanban" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Kanban Board
        </button>
      </div>

      {/* FORM (Admin/PM only) */}
      {canManageTasks && (
        <div className="bg-white p-5 rounded-2xl shadow space-y-4">
          <input
            placeholder="Task Title"
            className="border p-3 w-full rounded"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <select
            className="border p-3 w-full rounded"
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Employee dropdown + fallback */}
          <select
            className="border p-3 w-full rounded"
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          >
            <option value="">Assign Employee (optional)</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} {e.role ? `— ${e.role}` : ""}
              </option>
            ))}
          </select>

          {!form.employeeId && (
            <input
              placeholder="Assigned Worker (manual)"
              className="border p-3 w-full rounded"
              value={form.worker}
              onChange={(e) => setForm({ ...form, worker: e.target.value })}
            />
          )}

          <div className="flex gap-3">
            <input
              type="date"
              className="border p-3 w-full rounded"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />

            <input
              type="date"
              className="border p-3 w-full rounded"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          <select
            className="border p-3 w-full rounded"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <select
            className="border p-3 w-full rounded"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>

          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700"
          >
            Add Task
          </button>
        </div>
      )}

      {/* TABLE VIEW */}
      {view === "table" && (
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                {canManageTasks && <th className="px-4 py-3 text-center">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {visibleTasks.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3">{getProjectName(t.projectId)}</td>
                  <td className="px-4 py-3">{t.worker || "—"}</td>
                  <td className="px-4 py-3">
                    {t.startDate || "—"} → {t.endDate || "—"}
                  </td>
                  <td className="px-4 py-3">{t.priority}</td>

                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={(e) => changeStatus(t.id, e.target.value)}
                      className="border rounded px-2 py-1"
                      disabled={!canUpdateStatus}
                    >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </td>

                  {canManageTasks && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(t.id)}
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
                    No tasks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statuses.map((status) => (
            <div key={status} className="bg-gray-100 p-4 rounded-xl">
              <h2 className="font-semibold mb-4">{status}</h2>

              <div className="space-y-3">
                {visibleTasks
                  .filter((t) => t.status === status)
                  .map((t) => (
                    <div key={t.id} className="bg-white p-3 rounded-lg shadow">
                      <p className="font-semibold">{t.title}</p>
                      <p className="text-sm text-gray-500">{getProjectName(t.projectId)}</p>
                      <p className="text-sm">{t.worker || "—"}</p>
                      <p className="text-xs mt-1">Priority: {t.priority}</p>

                      <select
                        value={t.status}
                        onChange={(e) => changeStatus(t.id, e.target.value)}
                        className="mt-2 w-full border rounded px-2 py-1"
                        disabled={!canUpdateStatus}
                      >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>

                      {canManageTasks && (
                        <button
                          onClick={() => handleDelete(t.id)}
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