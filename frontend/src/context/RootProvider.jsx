import React from "react";
import ThemeProvider from "./ThemeContext";
import { AuthProvider } from "./AuthContext";
import { CompanyProvider } from "./CompanyContext";
import { RoleProvider } from "./RoleContext";
import { EmployeeProvider } from "./EmployeeContext";

// Add more providers as you create them
export const RootProvider = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
          <RoleProvider>
            <EmployeeProvider>
                {/* Add more providers here as needed */}
                {children}
            </EmployeeProvider>
          </RoleProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
