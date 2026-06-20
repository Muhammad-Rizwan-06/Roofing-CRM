import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useRole } from "../../context/RoleContext";
import { generateSalt, hashPassword } from "../../utils/password";

const UserManagement = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const {
    employees: users,
    loading,
    error,
    create,
    update,
    delete: deleteUser,
    getAll,
  } = useUser();
  const { getRoles, roles } = useRole();

  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: "",
    status: "Active",
    password: "",
  });

  // Load all users on component mount
  useEffect(() => {
    getAll();
    getRoles();
  }, []);

  // Set default role when roles load
  useEffect(() => {
    if (!form.roleId && roles.length) {
      setForm((p) => ({ ...p, roleId: String(roles[0].roleId) }));
    }
  }, [roles]);

  const reset = () => {
    setEditId(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      roleId: roles[0]?.roleId ? String(roles[0].roleId) : "",
      status: "Active",
      password: "",
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return alert("Name required");
    if (!form.email.trim()) return alert("Email required");
    if (!form.roleId) return alert("Role required");

    const selectedRole = roles.find(
      (r) => String(r.roleId) === String(form.roleId),
    );
    const roleName = selectedRole?.name || "";

    const payloadBase = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form?.phone.trim(),
      roleId: form.roleId,
      roleName,
      status: form.status,
    };

    // unique email check
    const emailTaken = users.some(
      (u) => u.email === payloadBase.email && u.userId !== editId,
    );
    if (emailTaken) return alert("Email already exists");

    const existingUser = editId ? users.find((u) => u.userId === editId) : null;

    // Password rules:
    // - new user: password required
    // - edit user: password optional (only updates if provided)
    let passwordSalt = existingUser?.passwordSalt || null;
    let passwordHash = existingUser?.passwordHash || null;

    if (!editId && !form.password) {
      return alert("Password is required for new users");
    }

    if (form.password) {
      passwordSalt = generateSalt();
      passwordHash = await hashPassword(form.password, passwordSalt);
    }

    const payload = {
      ...payloadBase,
      passwordSalt,
      passwordHash,
    };

    try {
      if (editId) {
        await update(editId, payload);
      } else {
        await create(payload);
      }
      reset();
    } catch (err) {
      alert(`Failed to save user: ${err.message}`);
    }
  };

  const onEdit = (u) => {
    setEditId(u.userId);
    
    // Find roleId from roles if not directly available on user
    let roleId = u.roleId || "";
    if (!roleId && u.roleName) {
      const role = roles.find(r => r.name === u.roleName);
      roleId = role ? String(role.roleId) : "";
    }
    
    setForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      roleId: String(roleId),
      status: u.status || "Active",
      roleName: u.roleName || "",
      password: "",
    });
  };

  const onDelete = async (userId) => {
    const ok = confirm("Delete this user?");
    if (!ok) return;
    try {
      await deleteUser(userId);
      if (editId === userId) reset();
    } catch (err) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users || [];
    const q = searchQuery.toLowerCase();
    return (users || []).filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      const roleName = (u.roleName || "").toLowerCase();
      const status = (u.status || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        roleName.includes(q) ||
        status.includes(q)
      );
    });
  }, [users, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            User Management
          </h1>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            Total Users
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {loading ? "..." : filteredUsers.length}
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-800 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-white">
            {editId ? "Edit User" : "Add User"}
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
          <input
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />

          <input
            type="email"
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />

          <input
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />

          <select
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            value={form.roleId}
            onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}
          >
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r.roleId} value={String(r.roleId)}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* ✅ Password field */}
          <input
            type="password"
            className="border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
            placeholder={
              editId ? "New Password (optional)" : "Password (required)"
            }
            value={form.password}
            onChange={(e) =>
              setForm((p) => ({ ...p, password: e.target.value }))
            }
          />

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition md:col-span-3 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading
              ? editId
                ? "Updating..."
                : "Adding..."
              : editId
                ? "Update"
                : "Add"}
          </button>
        </div>
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">
          Users
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr
                key={u.userId}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="p-3 font-medium text-gray-800 dark:text-white">
                  {u.name}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {u.email}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {u.roleName || ""}
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-300">
                  {u.status}
                </td>
                <td className="p-3 text-right space-x-3">
                  <button
                    className="text-blue-600 hover:underline disabled:opacity-50"
                    onClick={() => onEdit(u)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline disabled:opacity-50"
                    onClick={() => onDelete(u.userId)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-gray-500 dark:text-gray-300"
                >
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
