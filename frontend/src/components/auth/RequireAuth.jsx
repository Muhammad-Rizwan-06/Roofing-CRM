import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessPath, ROLE } from "../../config/accessControl";
import { useAuth } from "../../context/AuthContext";

const RequireAuth = () => {
  const { user } = useAuth();
  const location = useLocation();

  // First-time bootstrap: if no users exist, allow setup page
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const hasUsers = users.length > 0;

  if (!hasUsers && location.pathname !== "/setup") {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    if (location.pathname === "/login" || location.pathname === "/setup") return <Outlet />;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // ✅ Hard redirect: portal is customer-only
  if (location.pathname.startsWith("/portal") && user.roleName !== ROLE.CUSTOMER) {
    return <Navigate to="/" replace />;
  }

  const allowed = canAccessPath(location.pathname, user.roleName);
  if (!allowed) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
};

export default RequireAuth;