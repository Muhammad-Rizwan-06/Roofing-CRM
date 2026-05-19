import React, { useEffect, useMemo } from "react";
import CustomersTable from "../components/customers/CustomersTable";
import { useProjects } from "../context/ProjectsContext";

const Customers = () => {
  const { projects, loading, error, getAll } = useProjects();

  // Fetch all projects on component mount
  useEffect(() => {
    getAll();
  }, [getAll]);

  // Derive customers from projects
  const customers = useMemo(() => {
    const map = new Map();

    projects.forEach((project) => {
      const name = project.client || "Unknown";
      const existing = map.get(name);

      if (!existing) {
        map.set(name, {
          id: name, // stable
          name,
          projects: 1,
        });
      } else {
        existing.projects += 1;
      }
    });

    return Array.from(map.values());
  }, [projects]);

//   if (loading) {
//     return (
//       <div className="p-4">
//         <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
//           Loading customers...
//         </div>
//       </div>
//     );
//   }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold dark:text-white text-gray-800">
        Customers
      </h1>
      <CustomersTable customers={customers} />
    </div>
  );
};

export default Customers;
