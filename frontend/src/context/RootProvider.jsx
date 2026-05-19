import React from "react";
import ThemeProvider from "./ThemeContext";
import { AuthProvider } from "./AuthContext";
import { CompanyProvider } from "./CompanyContext";
import { RoleProvider } from "./RoleContext";
import { EmployeeProvider } from "./EmployeeContext";
import { LeadsProvider } from "./LeadContext";
import { ProjectsProvider } from "./ProjectsContext";
import { ContractsProvider } from "./ContractContext";

// Add more providers as you create them
export const RootProvider = ({ children }) => {
  return (
    <ThemeProvider>
        <AuthProvider>
            <CompanyProvider>
                <RoleProvider>
                    <EmployeeProvider>
                        <LeadsProvider>
                            <ProjectsProvider>
                                <ContractsProvider>
                                    {children}
                                </ContractsProvider>
                            </ProjectsProvider>
                        </LeadsProvider>
                    </EmployeeProvider>
                </RoleProvider>
            </CompanyProvider>
        </AuthProvider>
    </ThemeProvider>
  );
};
