import React from "react";

const LeadsTable = () => {
  const leads = [
    { id: 1, name: "Ali Khan", status: "New", amount: "$1200" },
    { id: 2, name: "Ahmed Raza", status: "Contacted", amount: "$900" },
    { id: 3, name: "Usman Tariq", status: "Closed", amount: "$1500" },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">Recent Leads</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-sm border-b">
              <th className="py-2">Name</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b hover:bg-gray-50">
                <td className="py-3">{lead.name}</td>
                <td>{lead.status}</td>
                <td>{lead.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadsTable;