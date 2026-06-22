import React, { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import CustomerProjects from "../components/customers/CustomerProjects";
import { useProjects } from "../context/ProjectsContext";

const CustomerDetails = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const { userId } = useParams();
  const { projects, loading, error, getAll } = useProjects();

  // Fetch all projects on component mount
  useEffect(() => {
    getAll();
  }, [getAll]);

  // Filter projects of this customer
  const customerProjects = useMemo(
    () => projects.filter((p) => p.userId === userId),
    [projects, userId],
  );
  const name = customerProjects[0]?.client || "Unknown Customer";

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return customerProjects || [];
    const q = searchQuery.toLowerCase();
    return (customerProjects || []).filter((p) => {
      const name = (p.name || "").toLowerCase();
      const client = (p.client || "").toLowerCase();
      const status = (p.status || "").toLowerCase();
      return name.includes(q) || client.includes(q) || status.includes(q);
    });
  }, [customerProjects, searchQuery]);

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
      <h1 className="text-2xl font-bold dark:text-white">{name}</h1>
      {/* <p className="text-gray-600 dark:text-gray-400">{name}</p> */}

      <CustomerProjects projects={filteredProjects} />
    </div>
  );
};

export default CustomerDetails;
