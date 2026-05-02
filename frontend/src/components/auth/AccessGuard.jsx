// src/components/auth/AccessGuard.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { canAccessPath } from "../../config/accessControl";

const AccessGuard = ({ allow, children }) => {
  const { user } = useAuth();
  const roleName = user?.roleName;
  const location = useLocation();

  if (!canAccessPath(allow, roleName)) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default AccessGuard;