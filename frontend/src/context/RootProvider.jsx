import React from "react";
import ThemeProvider from "./ThemeContext";
import { AuthProvider } from "./AuthContext";
import { CompanyProvider } from "./CompanyContext";
import { RoleProvider } from "./RoleContext";
import { UserProvider } from "./UserContext";
import { LeadsProvider } from "./LeadContext";
import { ProjectsProvider } from "./ProjectsContext";
import { ContractsProvider } from "./ContractContext";
import { EmployeesProvider } from "./EmployeesContext";
import { TasksProvider } from "./TasksContext";
import { SubcontractorsProvider } from "./SubContractorContext";
import { EstimatesProvider } from "./EstimatesContext";
import { InvoicesProvider } from "./InvoicesContext";
import { PaymentsProvider } from "./PaymentsContext";
import { ExpensesProvider } from "./ExpensesContext";
import { PurchaseOrdersProvider } from "./PurchaseOrdersContext";
import { MaterialsProvider } from "./MaterialsContext";
import { SuppliersProvider } from "./SuppliersContext";
import { DocumentsProvider } from "./DocumentsContext";

// Add more providers as you create them
export const RootProvider = ({ children }) => {
  return (
    <ThemeProvider>
        <AuthProvider>
            <CompanyProvider>
                <RoleProvider>
                    <UserProvider>
                        <LeadsProvider>
                            <ProjectsProvider>
                                <ContractsProvider>
                                    <EmployeesProvider>
                                        <TasksProvider>
                                            <SubcontractorsProvider>
                                                <EstimatesProvider>
                                                    <InvoicesProvider>
                                                        <PaymentsProvider>
                                                            <ExpensesProvider>
                                                                <PurchaseOrdersProvider>
                                                                    <MaterialsProvider>
                                                                        <SuppliersProvider>
                                                                            <DocumentsProvider>
                                                                                {children}
                                                                            </DocumentsProvider>
                                                                        </SuppliersProvider>
                                                                    </MaterialsProvider>
                                                                </PurchaseOrdersProvider>
                                                            </ExpensesProvider>
                                                        </PaymentsProvider>
                                                    </InvoicesProvider>
                                                </EstimatesProvider>
                                            </SubcontractorsProvider>
                                        </TasksProvider>
                                    </EmployeesProvider>
                                </ContractsProvider>
                            </ProjectsProvider>
                        </LeadsProvider>
                    </UserProvider>
                </RoleProvider>
            </CompanyProvider>
        </AuthProvider>
    </ThemeProvider>
  );
};
