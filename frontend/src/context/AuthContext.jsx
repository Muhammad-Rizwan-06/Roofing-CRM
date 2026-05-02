// src/context/AuthContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { verifyPassword } from "../utils/password";

const SESSION_KEY = "session_user";

const AuthContext = createContext(null);

const loadSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(loadSession());

  const login = async (email, password) => {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const found = users.find((u) => u.email === String(email).trim().toLowerCase());

    if (!found) return { ok: false, message: "Invalid email or password" };
    if (found.status === "Inactive") return { ok: false, message: "User is inactive" };
    if (!found.passwordSalt || !found.passwordHash)
      return { ok: false, message: "User has no password set. Reset password in Settings." };

    const ok = await verifyPassword(password, found.passwordSalt, found.passwordHash);
    if (!ok) return { ok: false, message: "Invalid email or password" };

    const sessionUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      roleId: found.roleId,
      roleName: found.roleName,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);