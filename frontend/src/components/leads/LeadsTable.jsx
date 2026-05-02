import React from "react";
import { useNavigate } from "react-router-dom";

const LeadsTable = ({ leads, onDelete, onConvert }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    if (status === "New") return "bg-blue-100 text-blue-600";
    if (status === "Inspection Scheduled") return "bg-indigo-100 text-indigo-600";
    if (status === "Estimate Sent") return "bg-yellow-100 text-yellow-700";
    if (status === "Negotiation") return "bg-orange-100 text-orange-700";
    if (status === "Won") return "bg-green-100 text-green-600";
    if (status === "Lost") return "bg-red-100 text-red-600";

    // backward compatibility for old data
    if (status === "Contacted") return "bg-yellow-100 text-yellow-600";
    if (status === "Closed") return "bg-green-100 text-green-600";

    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">All Leads</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-500 text-sm">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-400">
                  No Leads Found
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{lead.name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.phone}</td>

                  <td>
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>

                  <td className="space-x-3 text-right">
                    <button
                      onClick={() => navigate(`/finance/estimates?leadId=${lead.id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      Estimate
                    </button>

                    <button
                      onClick={() => onConvert(lead)}
                      className="text-green-600 hover:underline"
                    >
                      Convert
                    </button>

                    <button
                      onClick={() => onDelete(lead.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default LeadsTable;