import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";
import { useAuth } from "../../context/AuthContext";
import { canAccessPath, ROLE } from "../../config/accessControl";

const getDefaultRouteForRole = (roleName) => {
  switch (roleName) {
    case ROLE.ACCOUNTANT:
      return "/finance/estimates";
    case ROLE.WORKER:
      return "/operations/tasks";
    case ROLE.SALES:
      return "/leads";
    case ROLE.PM:
      return "/projects/active-jobs";
    case ROLE.CUSTOMER:
      return "/portal";
    case ROLE.ADMIN:
    default:
      return "/";
  }
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await login(form.email, form.password);

    setLoading(false);
    if (!res.ok) return alert(res.message);

    const session = JSON.parse(localStorage.getItem("session_user")) || null;
    const roleName = session?.roleName;

    // normal redirect logic
    let dest = canAccessPath(from, roleName)
      ? from
      : getDefaultRouteForRole(roleName);

    // ✅ UX Fix:
    // If user is NOT Customer, never land on /portal after login
    if (roleName !== ROLE.CUSTOMER && String(dest).startsWith("/portal")) {
      dest = "/";
    }

    // If user IS Customer, keep them inside /portal
    if (roleName === ROLE.CUSTOMER && !String(dest).startsWith("/portal")) {
      dest = "/portal";
    }

    navigate(dest, { replace: true });
  };

  return (
    <AuthShell title="Login" subtitle="Sign in to access your workspace.">
      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full border p-3 rounded-xl bg-white dark:bg-gray-950 dark:text-white"
          placeholder="Email"
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

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-70 transition"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          If you are the first user, go to <b>/setup</b>.
        </p>
      </form>
    </AuthShell>
  );
};

export default Login;