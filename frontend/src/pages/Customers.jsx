// import React, { useEffect, useMemo } from "react";
// import CustomersTable from "../components/customers/CustomersTable";
// import { useProjects } from "../context/ProjectsContext";

// const Customers = () => {
//   const { projects, loading, error, getAll } = useProjects();

//   // Fetch all projects on component mount
//   useEffect(() => {
//     getAll();
//   }, [getAll]);

//   // Derive customers from projects
//   const customers = useMemo(() => {
//     const map = new Map();

//     projects.forEach((project) => {
//       const userId = project.userId || null;
//       const existing = map.get(userId);

//       if (!existing) {
//         map.set(userId, {
//           id: userId, // stable
//           name: project.client || "Unknown",
//           projects: 1,
//         });
//       } else {
//         existing.projects += 1;
//       }
//     });

//     return Array.from(map.values());
//   }, [projects]);

//   if (error) {
//     return (
//       <div className="p-4">
//         <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
//           Error: {error}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 p-4">
//       <h1 className="text-2xl font-bold dark:text-white text-gray-800">
//         Customers
//       </h1>
//       <CustomersTable customers={customers} />
//     </div>
//   );
// };

// export default Customers;



import React, { useEffect, useMemo } from "react";
import CustomersTable from "../components/customers/CustomersTable";
import { useProjects } from "../context/ProjectsContext";

const Customers = () => {
  const { projects, loading, error, getAll: fetchProjects } = useProjects();

  useEffect(() => {
    fetchProjects();
  }, []);

  // Derive customers grouped by userId
  const customers = useMemo(() => {
    const map = new Map();

    projects.forEach((project) => {
      const userId = project.userId;

      // skip projects with no userId — can't group them meaningfully
      if (!userId) return;

      const existing = map.get(userId);

      if (!existing) {
        map.set(userId, {
          userId, // ← use userId as the key
          name: project.client || "Unknown",
          email: project.clientEmail || "",
          phone: project.clientPhone || "",
          projects: 1,
        });
      } else {
        existing.projects += 1;
      }
    });

    return Array.from(map.values());
  }, [projects]);

  if (error)
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
        Error: {error}
      </div>
    );

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
