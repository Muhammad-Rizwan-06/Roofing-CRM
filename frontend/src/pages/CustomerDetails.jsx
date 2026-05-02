import React from "react";
import { useParams } from "react-router-dom";
import CustomerProjects from "../components/customers/CustomerProjects";

const CustomerDetails = () => {
  const { name } = useParams();

  const projects =
    JSON.parse(localStorage.getItem("projects")) || [];

  // Filter projects of this customer
  const customerProjects = projects.filter(
    (p) => p.client === name
  );

  if (customerProjects.length === 0) {
    return <div className="p-6">No data found</div>;
  }

  return (
    <div className="space-y-6 p-4">

      <h1 className="text-2xl font-bold text-gray-800">
        {name}
      </h1>

      <CustomerProjects projects={customerProjects} />

    </div>
  );
};

export default CustomerDetails;