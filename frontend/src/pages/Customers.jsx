import React, { useEffect, useState } from "react";
import CustomersTable from "../components/customers/CustomersTable";

const Customers = () => {
  const [customers, setCustomers] = useState([]);

  const loadCustomers = () => {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];

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
      <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
      <CustomersTable customers={customers} />
    </div>
  );
};

export default Customers;