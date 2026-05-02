import React, { useEffect, useMemo, useState } from "react";

const LS_KEY = "roles";

const defaultRoles = [
  {
    id: 1,
    name: "Admin",
    description: "Full access to all modules and settings",
    permissions: ["*"],
  },
  {
    id: 2,
    name: "Sales Manager",
    description: "Manage leads, pipeline, estimates, customers",
    permissions: ["crm:read", "crm:write", "estimates:read", "estimates:write"],
  },
  {
    id: 3,
    name: "Project Manager",
    description: "Manage projects, tasks, workers, documents",
    permissions: ["projects:read", "projects:write", "tasks:write", "documents:write"],
  },
  {
    id: 4,
    name: "Worker",
    description: "View assigned tasks and upload photos",
    permissions: ["tasks:read", "documents:write"],
  },
  {
    id: 5,
    name: "Accountant",
    description: "Manage invoices, payments, expenses, finance reports",
    permissions: ["finance:*", "reports:read"],
  },
  {
    id: 6,
    name: "Customer",
    description: "Customer portal access (own projects, invoices, contracts)",
    permissions: ["portal:*"],
  },
];

const ensureCustomerRole = (list) => {
  const hasCustomer = (list || []).some((r) => String(r?.name) === "Customer");
  if (hasCustomer) return list;

  return [
    ...(list || []),
    {
      id: Date.now(),
      name: "Customer",
      description: "Customer portal access (own projects, invoices, contracts)",
      permissions: ["portal:*"],
    },
  ];
};

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    const list =
      Array.isArray(saved) && saved.length ? saved : defaultRoles;

    return ensureCustomerRole(list);
  } catch {
    return ensureCustomerRole(defaultRoles);
  }
};

const RolesPermissions = () => {
  const [roles, setRoles] = useState(() => load());
  const [form, setForm] = useState({
    name: "",
    description: "",
    permissions: "",
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(roles));
  }, [roles]);

  const total = useMemo(() => roles.length, [roles]);

  const addRole = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Role name required");

    const newRole = {
      id: Date.now(),
      name: form.name.trim(),
      description: form.description || "",
      permissions: form.permissions
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };

    setRoles((prev) => [...prev, newRole]);
    setForm({ name: "", description: "", permissions: "" });
  };

  const remove = (id) => {
    const ok = confirm("Delete this role?");
    if (!ok) return;

    const role = roles.find((r) => r.id === id);
    if (role?.name === "Admin") return alert("Admin role cannot be deleted.");
    if (role?.name === "Customer") return alert("Customer role should not be deleted (portal).");

    setRoles((prev) => prev.filter((r) => r.id !== id));
  };

  const resetDefaults = () => {
    const ok = confirm("Reset roles to defaults?");
    if (!ok) return;
    setRoles(ensureCustomerRole(defaultRoles));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            RBAC foundation for backend phase (stored in localStorage)
          </p>
        </div>

        <div className="flex gap-2">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-300">Total Roles</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{total}</p>
          </div>

          <button
            onClick={resetDefaults}
            className="bg-gray-200 px-4 py-2 rounded-xl hover:bg-gray-300 transition h-fit"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      <form
        onSubmit={addRole}
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-800 space-y-4"
      >
        <h2 className="font-semibold text-gray-800 dark:text-white">Add Custom Role</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            placeholder="Role name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <input
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            placeholder="Permissions (comma separated)"
            value={form.permissions}
            onChange={(e) => setForm((p) => ({ ...p, permissions: e.target.value }))}
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition w-full">
          Add Role
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Examples: <code>projects:read, projects:write</code> or <code>finance:*</code>
        </p>
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">Roles List</div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="p-3">Role</th>
              <th className="p-3">Description</th>
              <th className="p-3">Permissions</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium text-gray-800 dark:text-white">{r.name}</td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{r.description || "—"}</td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {(r.permissions || []).join(", ")}
                </td>
                <td className="p-3 text-right">
                  <button className="text-red-600 hover:underline" onClick={() => remove(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {roles.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500 dark:text-gray-300">
                  No roles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolesPermissions;