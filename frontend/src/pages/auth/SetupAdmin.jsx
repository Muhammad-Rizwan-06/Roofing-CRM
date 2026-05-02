import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";
import { generateSalt, hashPassword } from "../../utils/password";
import { ROLE } from "../../config/accessControl";

const defaultRoles = [
  { id: 1, name: ROLE.ADMIN, description: "Full access", permissions: ["*"] },
  { id: 2, name: ROLE.SALES, description: "CRM + Estimates", permissions: ["crm:*", "estimates:*"] },
  { id: 3, name: ROLE.PM, description: "Projects + Operations", permissions: ["projects:*", "operations:*"] },
  { id: 4, name: ROLE.WORKER, description: "Tasks + Docs", permissions: ["tasks:read", "documents:write"] },
  { id: 5, name: ROLE.ACCOUNTANT, description: "Finance + Reports", permissions: ["finance:*", "reports:read"] },
];

const SetupAdmin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "Admin", email: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();

    const existingUsers = JSON.parse(localStorage.getItem("users")) || [];
    if (existingUsers.length) return navigate("/login");

    if (!form.email.trim() || !form.password) return alert("Email and password required");

    const roles = JSON.parse(localStorage.getItem("roles")) || [];
    if (!roles.length) localStorage.setItem("roles", JSON.stringify(defaultRoles));

    const salt = generateSalt();
    const passwordHash = await hashPassword(form.password, salt);

    const adminUser = {
      id: Date.now(),
      name: form.name.trim() || "Admin",
      email: form.email.trim().toLowerCase(),
      phone: "",
      roleId: 1,
      roleName: ROLE.ADMIN,
      status: "Active",
      passwordSalt: salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("users", JSON.stringify([adminUser]));
    alert("Admin created. Please login.");
    navigate("/login");
  };

  return (
    <AuthShell
      title="Initial Setup"
      subtitle="Create the first Admin account (one-time setup)."
    >
      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
          placeholder="Admin Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />

        <input
          className="w-full border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
          placeholder="Admin Email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />

        <input
          type="password"
          className="w-full border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        />

        <button className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition">
          Create Admin
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          This will also seed default roles (Admin, Sales Manager, Project Manager, Worker, Accountant).
        </p>
      </form>
    </AuthShell>
  );
};

export default SetupAdmin;