import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useEmployees } from "../../context/EmployeesContext";

import { useCompany } from "../../context/CompanyContext";

const TeamsEmployees = () => {
  const {
    employees,
    loading,
    error,
    getAllEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployees();


  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    hourlyRate: "",
    availability: "Available",
  });
  const { company, getCompany } = useCompany();

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees || [];
    const q = searchQuery.toLowerCase();
    return (employees || []).filter((e) => {
      const name = (e.name || "").toLowerCase();
      const role = (e.role || "").toLowerCase();
      const phone = (e.phone || "").toLowerCase();
      const email = (e.email || "").toLowerCase();
      return (
        name.includes(q) ||
        role.includes(q) ||
        phone.includes(q) ||
        email.includes(q)
      );
    });
  }, [employees, searchQuery]);

  useEffect(() => {
    getCompany();
  }, [getCompany]);


  useEffect(() => {
    const init = async () => {
      await getAllEmployees();
      setPageLoading(false);
    };
    init();
  }, [getAllEmployees]);

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

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Employee name is required");

    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      hourlyRate: Number(form.hourlyRate || 0),
      availability: form.availability,
    };

    setSubmitting(true);

    let result;
    if (editId) {
      result = await updateEmployee(editId, payload);
    } else {
      result = await addEmployee(payload);
    }

    setSubmitting(false);

    if (!result.ok) return alert(result.message);
    reset();
  };

  const onEdit = (emp) => {
    setEditId(emp.employeeId); // ✅ use employeeId not emp.id
    setForm({
      name: emp.name || "",
      role: emp.role || "",
      phone: emp.phone || "",
      email: emp.email || "",
      hourlyRate: emp.hourlyRate ?? "",
      availability: emp.availability || "Available",
    });
  };

  const onDelete = async (employeeId) => {
    const confirmed = confirm("Delete this employee?");
    if (!confirmed) return;

    const result = await deleteEmployee(employeeId);
    if (!result.ok) return alert(result.message);
    if (editId === employeeId) reset();
  };

  const total = useMemo(() => filteredEmployees.length, [filteredEmployees]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Teams / Employees
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Employee directory used for task assignment
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            Total Employees
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {total}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
          Error: {error}
        </div>
      )}

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
              onChange={(e) =>
                setForm((p) => ({ ...p, hourlyRate: e.target.value }))
              }
              placeholder="e.g. 15"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Phone</label>
            <input
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="Phone"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input
              type="email"
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="Email"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Availability</label>
            <select
              className="w-full mt-1 border p-2 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
              value={form.availability}
              onChange={(e) =>
                setForm((p) => ({ ...p, availability: e.target.value }))
              }
            >
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Off">Off</option>
            </select>
          </div>
        </div>

        <button
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl w-full hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : editId
              ? "Update Employee"
              : "Add Employee"}
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
            {filteredEmployees.map((e) => (
              <tr
                key={e.employeeId}
                className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950"
              >
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                  {e.name}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {e.role || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {company?.currency} {Number(e.hourlyRate || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {e.phone || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {e.availability || "—"}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => onEdit(e)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => onDelete(e.employeeId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredEmployees.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-300"
                >
                  {pageLoading ? <p>Loading...</p> : <p>No employees yet.</p>}
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
