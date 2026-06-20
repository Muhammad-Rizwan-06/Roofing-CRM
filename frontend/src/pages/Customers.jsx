import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [customers, searchQuery]);

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
      <CustomersTable customers={filteredCustomers} />
    </div>
  );
};

export default Customers;
