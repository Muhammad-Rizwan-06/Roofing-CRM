import React, { useEffect, useMemo, useState } from "react";

const lsGet = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const lsSet = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const TeamsEmployees = () => {
  const [employees, setEmployees] = useState(() => lsGet("employees", []));
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    hourlyRate: "",
    availability: "Available",
  });

  useEffect(() => {
    lsSet("employees", employees);
  }, [employees]);

  const reset = () => {
    setEditId(null);
    setForm({
      name: "",
      role: "",
      phone: "",
      email: "",
      hourlyRate: "",
      availability: "Available",
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Employee name is required");

    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      hourlyRate: Number(form.hourlyRate || 0),
      availability: form.availability,
      updatedAt: new Date().toISOString(),
    };

    if (editId) {
      setEmployees((prev) => prev.map((x) => (x.id === editId ? { ...x, ...payload } : x)));
    } else {
      setEmployees((prev) => [
        { id: Date.now(), ...payload, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    reset();
  };

  const onEdit = (emp) => {
    setEditId(emp.id);
    setForm({
      name: emp.name || "",
      role: emp.role || "",
      phone: emp.phone || "",
      email: emp.email || "",
      hourlyRate: emp.hourlyRate ?? "",
      availability: emp.availability || "Available",
    });
  };

  const onDelete = (id) => {
    const ok = confirm("Delete this employee?");
    if (!ok) return;
    setEmployees((prev) => prev.filter((x) => x.id !== id));
    if (editId === id) reset();
  };

  const total = useMemo(() => employees.length, [employees]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Teams / Employees
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Employee directory used for task assignment (localStorage)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">Total Employees</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{total}</p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow space-y-4 border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-white">
            {editId ? "Edit Employee" : "Add Employee"}
          </h2>
          {editId && (
            <button
              type="button"
              onClick={reset}
              className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500">Name *</label>
            <input
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Employee name"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Role</label>
            <input
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              placeholder="Installer / Technician / Supervisor"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Hourly Rate</label>
            <input
              type="number"
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.hourlyRate}
              onChange={(e) => setForm((p) => ({ ...p, hourlyRate: e.target.value }))}
              placeholder="e.g. 15"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Phone</label>
            <input
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Phone"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input
              type="email"
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Availability</label>
            <select
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.availability}
              onChange={(e) => setForm((p) => ({ ...p, availability: e.target.value }))}
            >
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Off">Off</option>
            </select>
          </div>
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl w-full hover:bg-blue-700">
          {editId ? "Update Employee" : "Add Employee"}
        </button>
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-x-auto border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Employees List
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr
                key={e.id}
                className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950"
              >
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                  {e.name}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {e.role || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  ${Number(e.hourlyRate || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {e.phone || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {e.availability || "—"}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button className="text-blue-600 hover:underline" onClick={() => onEdit(e)}>
                    Edit
                  </button>
                  <button className="text-red-600 hover:underline" onClick={() => onDelete(e.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-300">
                  No employees yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamsEmployees;