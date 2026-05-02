import React, { useEffect, useMemo, useState } from "react";
import { generateSalt, hashPassword } from "../../utils/password";

const usersKey = "users";
const rolesKey = "roles";

const lsGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const lsSet = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const UserManagement = () => {
  const [roles, setRoles] = useState(() => lsGet(rolesKey, []));
  const [users, setUsers] = useState(() => lsGet(usersKey, []));

  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: "",
    status: "Active",
    password: "", // ✅ NEW
  });

  useEffect(() => {
    setRoles(lsGet(rolesKey, []));
  }, []);

  useEffect(() => {
    lsSet(usersKey, users);
  }, [users]);

  const roleNameById = (roleId) =>
    roles.find((r) => String(r.id) === String(roleId))?.name || "—";

  const reset = () => {
    setEditId(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      roleId: roles[0]?.id ? String(roles[0].id) : "",
      status: "Active",
      password: "",
    });
  };

  useEffect(() => {
    if (!form.roleId && roles.length) {
      setForm((p) => ({ ...p, roleId: String(roles[0].id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return alert("Name required");
    if (!form.email.trim()) return alert("Email required");
    if (!form.roleId) return alert("Role required");

    const selectedRole = roles.find((r) => String(r.id) === String(form.roleId));
    const roleName = selectedRole?.name || "";

    const payloadBase = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      roleId: Number(form.roleId),
      roleName, // ✅ store roleName for session/sidebar
      status: form.status,
      updatedAt: new Date().toISOString(),
    };

    // unique email
    const emailTaken = users.some(
      (u) => u.email === payloadBase.email && u.id !== editId
    );
    if (emailTaken) return alert("Email already exists");

    const existingUser = editId ? users.find((u) => u.id === editId) : null;

    // ✅ Password rules:
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

    if (editId) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editId ? { ...u, ...payload } : u))
      );
    } else {
      setUsers((prev) => [
        { id: Date.now(), ...payload, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }

    reset();
  };

  const onEdit = (u) => {
    setEditId(u.id);
    setForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      roleId: String(u.roleId || ""),
      status: u.status || "Active",
      password: "", // do not show stored password
    });
  };

  const onDelete = (id) => {
    const ok = confirm("Delete this user?");
    if (!ok) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (editId === id) reset();
  };

  const total = useMemo(() => users.length, [users]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Frontend-only auth demo (email/password/roles). Backend auth will replace this later.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-300">Total Users</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{total}</p>
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
              <option key={r.id} value={r.id}>
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
            placeholder={editId ? "New Password (optional)" : "Password (required)"}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />

          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition md:col-span-3">
            {editId ? "Update" : "Add"}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Roles are managed in <b>Roles & Permissions</b>. Passwords are stored as PBKDF2 hashes (demo).
        </p>
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 font-semibold text-gray-700 dark:text-gray-200">Users</div>

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
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium text-gray-800 dark:text-white">{u.name}</td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{roleNameById(u.roleId)}</td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{u.status}</td>
                <td className="p-3 text-right space-x-3">
                  <button className="text-blue-600 hover:underline" onClick={() => onEdit(u)}>
                    Edit
                  </button>
                  <button className="text-red-600 hover:underline" onClick={() => onDelete(u.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-300">
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