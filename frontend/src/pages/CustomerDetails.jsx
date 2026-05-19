import React, { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import CustomerProjects from "../components/customers/CustomerProjects";
import { useProjects } from "../context/ProjectsContext";

const CustomerDetails = () => {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name); 
  const { projects, loading, error, getAll } = useProjects();

  // Fetch all projects on component mount
  useEffect(() => {
    getAll();
  }, [getAll]);

  // Filter projects of this customer
  const customerProjects = useMemo(
    () => projects.filter((p) => p.client?.trim() === decodedName?.trim()),
    [projects, decodedName],
  );

//   if (loading) {
//     return (
//       <div className="p-4">
//         <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
//           Loading customer details...
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

  if (customerProjects.length === 0) {
    return <div className="p-6">No data found</div>;
  }

  return (
    <div className="space-y-6 p-4 ">
      <h1 className="text-2xl font-bold text-white">{decodedName}</h1>

      <CustomerProjects projects={customerProjects} />
    </div>
  );
};

export default CustomerDetails;
