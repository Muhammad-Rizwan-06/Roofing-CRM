import React, { useEffect, useState } from "react";
import CustomersTable from "../components/customers/CustomersTable";

const Customers = () => {
  const [customers, setCustomers] = useState([]);

  // Helper to safely parse localStorage and ensure it's always an array
  const safeParse = (key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(data)) return data;
      if (data?.list && Array.isArray(data.list)) return data.list;
      return [];
    } catch {
      return [];
    }
  };

  const loadCustomers = () => {
    const projects = safeParse("projects");

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

    setCustomers(Array.from(map.values()));
  };

  useEffect(() => {
    loadCustomers();

    // ✅ refresh when user comes back (conversion/project add/edit)
    const onFocus = () => loadCustomers();
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold dark:text-white text-gray-800">Customers</h1>
      <CustomersTable customers={customers} />
    </div>
  );
};

export default Customers;