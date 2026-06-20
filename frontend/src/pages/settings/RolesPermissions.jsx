import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useRole } from "../../context/RoleContext";

const RolesPermissions = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const { roles, loading, error, getRoles, createRole, deleteRole } = useRole();
  const [form, setForm] = useState({
    name: "",
    description: "",
    permissions: "",
  });

  useEffect(() => {
    getRoles();
  }, []);


  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles || [];
    const q = searchQuery.toLowerCase();
    return (roles || []).filter((r) => {
      const name = (r.name || "").toLowerCase();
      const description = (r.description || "").toLowerCase();
      const permissions = (r.permissions || []).join(", ").toLowerCase();
      return (
        name.includes(q) ||
        description.includes(q) ||
        permissions.includes(q)
      );
    });
  }, [roles, searchQuery]);

  const addRole = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Role name required");

    try {
      await createRole({
        name: form.name.trim().charAt(0).toUpperCase() + form.name.trim().slice(1),
        description: form.description || "",
        permissions: form.permissions
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      });
      setForm({ name: "", description: "", permissions: "" });
    } catch (err) {
      alert(`Failed to add role: ${err.message}`);
    }
  };

  const remove = async (roleId) => {
    const ok = confirm("Delete this role?");
    if (!ok) return;

    const role = roles.find((r) => r.roleId === roleId);
    if (role?.name.toLowerCase() === "admin") return alert("Admin role cannot be deleted.");
    if (role?.name.toLowerCase() === "customer")
      return alert("Customer role should not be deleted (portal).");

    try {
      await deleteRole(roleId);
    } catch (err) {
      alert(`Failed to delete role: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Manage roles and permissions
          </p>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            Total Roles
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {loading ? "..." : filteredRoles.length}
          </p>
        </div>
      </div>

      <form
        onSubmit={addRole}
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-800 space-y-4"
      >
        <h2 className="font-semibold text-gray-800 dark:text-white">
          Add Custom Role
        </h2>

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
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
          <input
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            placeholder="Permissions (comma separated)"
            value={form.permissions}
            onChange={(e) =>
              setForm((p) => ({ ...p, permissions: e.target.value }))
            }
          />
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition w-full disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Role"}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Examples: <code>projects:read, projects:write</code> or{" "}
          <code>finance:*</code>
        </p>
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Roles List
        </div>

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
            {filteredRoles.map((r, i) => (
              <tr
                key={i}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="p-3 font-medium text-gray-800 dark:text-white">
                  {r.name}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {r.description || "—"}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {(r.permissions || []).join(", ")}
                </td>
                <td className="p-3 text-right">
                  <button
                    className="text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => remove(r.roleId)}
                    disabled={loading}
                  >
                    {loading ? "..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}

            {filteredRoles.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-gray-500 dark:text-gray-300"
                >
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
