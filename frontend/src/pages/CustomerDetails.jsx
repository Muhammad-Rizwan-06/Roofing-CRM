import React from "react";
import { useParams } from "react-router-dom";
import CustomerProjects from "../components/customers/CustomerProjects";
import { safeParse } from "../utils/storageHelper";

const CustomerDetails = () => {
  const { name } = useParams();

  const projects = safeParse("projects");

  // Filter projects of this customer
  const customerProjects = projects.filter((p) => p.client === name);

  if (customerProjects.length === 0) {
    return <div className="p-6">No data found</div>;
  }

  return (
    <div className="space-y-6 p-4 ">
      <h1 className="text-2xl font-bold text-white">{name}</h1>

      <CustomerProjects projects={customerProjects} />
    </div>
  );
};

export default CustomerDetails;
