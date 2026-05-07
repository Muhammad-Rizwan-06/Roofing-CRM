// src/context/AuthContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { apiClient } from "../utils/apiClient";

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
    try {
      const response = await apiClient.post("/login", {
        email: String(email).trim().toLowerCase(),
        password,
      });
      const foundUser = response.user;

      const sessionUser = {
        id: foundUser.userId,
        name: foundUser.name,
        email: foundUser.email,
        roleId: foundUser.roleId,
        roleName: foundUser.role,
      };


      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || "Login failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);